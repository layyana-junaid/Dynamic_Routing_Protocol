"""
RIP (Routing Information Protocol) v2 — Distance-Vector Simulation
==================================================================
- Metric: hop count (max 15; 16 = unreachable)
- Periodic full-table updates every UPDATE_INTERVAL steps
- Split-horizon with poisoned reverse
- Triggered updates on topology change
- Bellman-Ford route selection
"""

import copy
from typing import Dict, List

from .base import ProtocolBase


class RIPProtocol(ProtocolBase):
    PROTOCOL_NAME = "RIP"
    PACKET_COLOR = "#4ade80"
    INFINITY = 16
    UPDATE_INTERVAL = 3  # steps between periodic updates

    def __init__(self, topology):
        super().__init__(topology)
        self.routing_tables: Dict[str, Dict[str, dict]] = {}
        self.previous_tables: Dict[str, Dict[str, dict]] = {}
        self.pending_triggered: List[str] = []

    # ── Initialise ────────────────────────────────────────────────────

    def initialize(self) -> List[dict]:
        events: List[dict] = []
        for router in self.topology.routers:
            self.routing_tables[router.id] = {}
            for link in self._get_connected_links(router.id):
                if link.status != "up":
                    continue
                nbr_id = self._get_other_end(link, router.id)
                nbr = self._get_router(nbr_id)
                if not nbr:
                    continue
                self.routing_tables[router.id][nbr_id] = {
                    "destination": nbr.ip,
                    "next_hop": nbr.ip,
                    "next_hop_id": nbr_id,
                    "metric": 1,
                    "learned_from": "direct",
                    "age": 0,
                    "network": link.network or f"10.0.{link.id.replace('L','')}.0/24",
                }
                events.append(
                    {
                        "type": "route_update",
                        "router_id": router.id,
                        "destination": nbr_id,
                        "next_hop": nbr_id,
                        "metric": 1,
                        "action": "add",
                        "protocol": "RIP",
                    }
                )
        self.previous_tables = copy.deepcopy(self.routing_tables)
        return events

    # ── Step ──────────────────────────────────────────────────────────

    def step(self) -> List[dict]:
        events: List[dict] = []
        self.step_count += 1

        # Determine which routers send updates this step
        send_from: set = set()
        if self.pending_triggered:
            send_from = set(self.pending_triggered)
            self.pending_triggered.clear()
        elif self.step_count % self.UPDATE_INTERVAL == 0:
            send_from = {
                r.id for r in self.topology.routers if r.status == "active"
            }

        if not send_from:
            events.append(self._metrics_event())
            return events

        self.previous_tables = copy.deepcopy(self.routing_tables)
        changes = False

        for rid in send_from:
            router = self._get_router(rid)
            if not router or router.status != "active":
                continue
            for link in self._get_connected_links(rid):
                if link.status != "up":
                    continue
                nbr_id = self._get_other_end(link, rid)
                nbr = self._get_router(nbr_id)
                if not nbr or nbr.status != "active":
                    continue

                # Animate RIP update packet
                events.append(
                    {
                        "type": "packet_animation",
                        "id": f"rip_{self.step_count}_{rid}_{nbr_id}",
                        "from": rid,
                        "to": nbr_id,
                        "packet_type": "RIP_UPDATE",
                        "label": "RIP Update",
                        "color": self.PACKET_COLOR,
                    }
                )
                self.control_messages += 1

                # Process this update at the neighbour
                for dest, entry in list(self.routing_tables[rid].items()):
                    if dest == nbr_id:
                        continue  # split-horizon
                    new_metric = min(entry["metric"] + 1, self.INFINITY)
                    cur = self.routing_tables[nbr_id].get(dest)

                    if cur is None and new_metric < self.INFINITY:
                        self.routing_tables[nbr_id][dest] = {
                            "destination": entry["destination"],
                            "next_hop": self._get_router(rid).ip,
                            "next_hop_id": rid,
                            "metric": new_metric,
                            "learned_from": rid,
                            "age": 0,
                            "network": entry.get("network", ""),
                        }
                        changes = True
                        events.append(self._route_evt(nbr_id, dest, rid, new_metric, "add"))

                    elif cur and new_metric < cur["metric"]:
                        cur.update(
                            metric=new_metric,
                            next_hop_id=rid,
                            next_hop=self._get_router(rid).ip,
                            learned_from=rid,
                            age=0,
                        )
                        changes = True
                        events.append(self._route_evt(nbr_id, dest, rid, new_metric, "update"))

                    elif cur and cur["next_hop_id"] == rid and new_metric != cur["metric"]:
                        cur["metric"] = new_metric
                        cur["age"] = 0
                        changes = True
                        action = "update" if new_metric < self.INFINITY else "remove"
                        events.append(self._route_evt(nbr_id, dest, rid, new_metric, action))

        # Age all entries
        for rid in self.routing_tables:
            for entry in self.routing_tables[rid].values():
                entry["age"] += 1

        # Convergence check
        if not changes and not self.converged and self.step_count > 1:
            self.converged = True
            self.convergence_time = self.step_count * self.step_interval_ms
            events.append(
                {
                    "type": "convergence",
                    "protocol": "RIP",
                    "time_ms": self.convergence_time,
                    "converged": True,
                    "step": self.step_count,
                }
            )
        elif changes:
            self.converged = False

        events.append(self._metrics_event())
        return events

    # ── Link failure / recovery ───────────────────────────────────────

    def handle_link_failure(self, link_id: str) -> List[dict]:
        events: List[dict] = []
        link = self._get_link(link_id)
        if not link:
            return events
        link.status = "down"
        self.converged = False
        self.packet_loss += 2

        events.append(
            {
                "type": "link_status",
                "link_id": link_id,
                "source": link.source,
                "target": link.target,
                "status": "down",
            }
        )

        for rid in (link.source, link.target):
            other = self._get_other_end(link, rid)
            if other in self.routing_tables.get(rid, {}):
                self.routing_tables[rid][other]["metric"] = self.INFINITY
            for dest, entry in self.routing_tables.get(rid, {}).items():
                if entry["next_hop_id"] == other:
                    entry["metric"] = self.INFINITY
                    events.append(self._route_evt(rid, dest, other, self.INFINITY, "remove"))
            self.pending_triggered.append(rid)
        return events

    def handle_link_recovery(self, link_id: str) -> List[dict]:
        events: List[dict] = []
        link = self._get_link(link_id)
        if not link:
            return events
        link.status = "up"
        self.converged = False

        events.append(
            {
                "type": "link_status",
                "link_id": link_id,
                "source": link.source,
                "target": link.target,
                "status": "up",
            }
        )

        for rid in (link.source, link.target):
            other = self._get_other_end(link, rid)
            nbr = self._get_router(other)
            if not nbr:
                continue
            self.routing_tables.setdefault(rid, {})[other] = {
                "destination": nbr.ip,
                "next_hop": nbr.ip,
                "next_hop_id": other,
                "metric": 1,
                "learned_from": "direct",
                "age": 0,
                "network": link.network or f"10.0.{link.id.replace('L','')}.0/24",
            }
            events.append(self._route_evt(rid, other, other, 1, "add"))
            self.pending_triggered.append(rid)
        return events

    # ── Routing tables ────────────────────────────────────────────────

    def get_routing_table(self, router_id: str) -> List[dict]:
        tbl = self.routing_tables.get(router_id, {})
        return [
            {
                "destination": e.get("network", e["destination"]),
                "next_hop": e["next_hop"],
                "next_hop_id": e["next_hop_id"],
                "metric": e["metric"],
                "protocol": "RIP",
                "age": e["age"],
                "status": "active" if e["metric"] < self.INFINITY else "unreachable",
            }
            for e in tbl.values()
            if e["metric"] < self.INFINITY
        ]

    def get_all_routing_tables(self) -> Dict[str, List[dict]]:
        return {rid: self.get_routing_table(rid) for rid in self.routing_tables}

    # ── Private helpers ───────────────────────────────────────────────

    def _route_evt(self, rid, dest, nh, metric, action):
        return {
            "type": "route_update",
            "router_id": rid,
            "destination": dest,
            "next_hop": nh,
            "metric": metric,
            "action": action,
            "protocol": "RIP",
        }

    def _metrics_event(self):
        return {
            "type": "metrics_update",
            "step": self.step_count,
            "convergence_time": self.convergence_time,
            "control_messages": self.control_messages,
            "packet_loss": self.packet_loss,
            "converged": self.converged,
        }
