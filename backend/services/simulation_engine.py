"""
Simulation Engine — orchestrates protocol simulation, manages state,
and pushes events via WebSocket.
"""

import asyncio
import copy
import time
from typing import Dict, List, Optional

from models.topology import Topology
from models.simulation import ComparisonResult
from protocols import PROTOCOL_MAP
from protocols.base import ProtocolBase
from services.websocket_manager import ConnectionManager


class SimulationEngine:
    def __init__(self, ws_manager: ConnectionManager):
        self.ws = ws_manager
        self.topology: Optional[Topology] = None
        self.protocol: Optional[ProtocolBase] = None
        self.protocol_name: str = "OSPF"
        self.state: str = "idle"  # idle | running | paused | converged | stopped
        self.speed: float = 1.0  # seconds per step
        self._task: Optional[asyncio.Task] = None
        self.event_log: List[dict] = []
        self.metrics_history: List[dict] = []

    # ── Topology management ───────────────────────────────────────────

    def load_topology(self, topology: Topology):
        self.topology = topology
        self.reset()

    # ── Protocol / config ─────────────────────────────────────────────

    def set_protocol(self, name: str):
        name = name.upper()
        if name not in PROTOCOL_MAP:
            raise ValueError(f"Unknown protocol: {name}")
        self.protocol_name = name
        self.reset()

    def set_speed(self, speed: float):
        self.speed = max(0.1, min(speed, 5.0))

    # ── Lifecycle ─────────────────────────────────────────────────────

    def reset(self):
        self._stop_loop()
        self.state = "idle"
        self.event_log.clear()
        self.metrics_history.clear()
        if self.topology:
            cls = PROTOCOL_MAP[self.protocol_name]
            self.protocol = cls(self.topology)

    async def start(self):
        if not self.protocol or not self.topology:
            return
        if self.state == "idle":
            events = self.protocol.initialize()
            await self._emit_events(events)
        self.state = "running"
        await self.ws.broadcast({"type": "simulation_state", "state": "running"})
        self._start_loop()

    async def pause(self):
        self.state = "paused"
        self._stop_loop()
        await self.ws.broadcast({"type": "simulation_state", "state": "paused"})

    async def stop(self):
        self.state = "stopped"
        self._stop_loop()
        await self.ws.broadcast({"type": "simulation_state", "state": "stopped"})

    async def step_once(self):
        """Execute a single simulation step (manual stepping)."""
        if not self.protocol:
            return
        if self.state == "idle":
            events = self.protocol.initialize()
            await self._emit_events(events)
            self.state = "paused"
        events = self.protocol.step()
        await self._emit_events(events)
        if self.protocol.converged:
            self.state = "converged"
            await self.ws.broadcast({"type": "simulation_state", "state": "converged"})

    # ── Topology mutations ────────────────────────────────────────────

    async def fail_link(self, link_id: str):
        if not self.protocol:
            return
        events = self.protocol.handle_link_failure(link_id)
        await self._emit_events(events)

    async def recover_link(self, link_id: str):
        if not self.protocol:
            return
        events = self.protocol.handle_link_recovery(link_id)
        await self._emit_events(events)

    async def update_link_cost(self, link_id: str, new_cost: int):
        if not self.protocol:
            return
        link = self.protocol._get_link(link_id)
        if link:
            link.cost = new_cost
            link.bandwidth = max(1, 1000 // new_cost)
            # Trigger reconvergence by treating as down+up
            events = self.protocol.handle_link_failure(link_id)
            link_obj = self.protocol._get_link(link_id)
            if link_obj:
                link_obj.cost = new_cost
                link_obj.bandwidth = max(1, 1000 // new_cost)
            events += self.protocol.handle_link_recovery(link_id)
            await self._emit_events(events)

    # ── Data access ───────────────────────────────────────────────────

    def get_state(self) -> dict:
        step = self.protocol.step_count if self.protocol else 0
        converged = self.protocol.converged if self.protocol else False
        ct = self.protocol.convergence_time if self.protocol else 0
        return {
            "state": self.state,
            "protocol": self.protocol_name,
            "step": step,
            "converged": converged,
            "convergence_time": ct,
        }

    def get_routing_table(self, router_id: str) -> List[dict]:
        if not self.protocol:
            return []
        return self.protocol.get_routing_table(router_id)

    def get_all_routing_tables(self) -> Dict[str, List[dict]]:
        if not self.protocol:
            return {}
        return self.protocol.get_all_routing_tables()

    def get_metrics(self) -> dict:
        if not self.protocol:
            return {}
        return self.protocol.get_metrics()

    def get_event_log(self) -> List[dict]:
        return self.event_log[-200:]  # last 200

    def get_metrics_history(self) -> List[dict]:
        return self.metrics_history

    # ── Protocol comparison ───────────────────────────────────────────

    async def run_comparison(self, fail_link_id: Optional[str] = None) -> List[dict]:
        """
        Run all four protocols to convergence on the current topology,
        optionally injecting a link failure, and return comparison metrics.
        """
        if not self.topology:
            return []

        results: List[dict] = []
        for name, cls in PROTOCOL_MAP.items():
            proto = cls(self.topology)
            proto.initialize()
            max_steps = 100
            for _ in range(max_steps):
                proto.step()
                if proto.converged:
                    break

            initial_ct = proto.convergence_time
            initial_cm = proto.control_messages
            route_count = sum(len(v) for v in proto.get_all_routing_tables().values())

            failure_ct = 0
            if fail_link_id:
                proto.converged = False
                proto.convergence_time = 0
                before_cm = proto.control_messages
                proto.handle_link_failure(fail_link_id)
                for _ in range(max_steps):
                    proto.step()
                    if proto.converged:
                        break
                failure_ct = proto.convergence_time

            results.append(
                {
                    "protocol": name,
                    "convergence_time": initial_ct,
                    "failure_convergence_time": failure_ct,
                    "total_control_messages": proto.control_messages,
                    "total_packet_loss": proto.packet_loss,
                    "total_overhead_bytes": proto.control_messages * 300,
                    "route_changes": 0,
                    "final_route_count": route_count,
                }
            )

        return results

    # ── Internal loop ─────────────────────────────────────────────────

    def _start_loop(self):
        if self._task is None or self._task.done():
            self._task = asyncio.create_task(self._run_loop())

    def _stop_loop(self):
        if self._task and not self._task.done():
            self._task.cancel()
        self._task = None

    async def _run_loop(self):
        try:
            while self.state == "running":
                if self.protocol:
                    events = self.protocol.step()
                    await self._emit_events(events)
                    if self.protocol.converged:
                        self.state = "converged"
                        await self.ws.broadcast(
                            {"type": "simulation_state", "state": "converged"}
                        )
                        break
                await asyncio.sleep(self.speed)
        except asyncio.CancelledError:
            pass

    async def _emit_events(self, events: List[dict]):
        ts = time.time()
        for evt in events:
            evt.setdefault("timestamp", ts)
            self.event_log.append(evt)
            if evt.get("type") == "metrics_update":
                self.metrics_history.append(evt)
        await self.ws.broadcast_many(events)
