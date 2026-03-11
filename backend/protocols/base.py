"""
Base class for all routing protocol simulations.
Each protocol module extends ProtocolBase and implements the abstract methods
to model its specific routing behavior (distance vector, link state, etc.).
"""

from abc import ABC, abstractmethod
from typing import Dict, List, Optional
import copy


class ProtocolBase(ABC):
    """Abstract base class for routing protocol simulators."""

    PROTOCOL_NAME: str = "BASE"
    PACKET_COLOR: str = "#ffffff"

    def __init__(self, topology):
        # Deep-copy topology so protocol mutations don't affect others
        self.topology = copy.deepcopy(topology)
        self.step_count: int = 0
        self.converged: bool = False
        self.convergence_time: float = 0
        self.control_messages: int = 0
        self.packet_loss: int = 0
        self.step_interval_ms: float = 1000  # display interval per step

    # ── Helper utilities ──────────────────────────────────────────────

    def _get_connected_links(self, router_id: str):
        return [
            l
            for l in self.topology.links
            if l.source == router_id or l.target == router_id
        ]

    def _get_other_end(self, link, router_id: str) -> str:
        return link.target if link.source == router_id else link.source

    def _get_router(self, router_id: str):
        for r in self.topology.routers:
            if r.id == router_id:
                return r
        return None

    def _get_link(self, link_id: str):
        for l in self.topology.links:
            if l.id == link_id:
                return l
        return None

    def _get_link_between(self, r1: str, r2: str):
        for l in self.topology.links:
            if (l.source == r1 and l.target == r2) or (
                l.source == r2 and l.target == r1
            ):
                return l
        return None

    # ── Abstract interface ────────────────────────────────────────────

    @abstractmethod
    def initialize(self) -> List[dict]:
        """Set up initial routing state.  Returns initial events."""
        ...

    @abstractmethod
    def step(self) -> List[dict]:
        """Execute one simulation step.  Returns events produced."""
        ...

    @abstractmethod
    def handle_link_failure(self, link_id: str) -> List[dict]:
        """React to a link going down."""
        ...

    @abstractmethod
    def handle_link_recovery(self, link_id: str) -> List[dict]:
        """React to a link coming back up."""
        ...

    @abstractmethod
    def get_routing_table(self, router_id: str) -> List[dict]:
        """Return the current routing table for one router."""
        ...

    @abstractmethod
    def get_all_routing_tables(self) -> Dict[str, List[dict]]:
        """Return routing tables for every router."""
        ...

    def get_metrics(self) -> dict:
        total_routes = 0
        tables = self.get_all_routing_tables()
        for rid, entries in tables.items():
            total_routes += len(entries)
        return {
            "protocol": self.PROTOCOL_NAME,
            "step": self.step_count,
            "convergence_time": self.convergence_time,
            "control_messages": self.control_messages,
            "packet_loss": self.packet_loss,
            "converged": self.converged,
            "active_routes": total_routes,
            "control_overhead_bytes": self.control_messages * 300,
        }
