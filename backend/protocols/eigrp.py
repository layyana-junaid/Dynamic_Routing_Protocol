"""
EIGRP (Enhanced Interior Gateway Routing Protocol) — DUAL Simulation
=====================================================================
- Advanced distance-vector / hybrid protocol
- Composite metric based on bandwidth + delay
- DUAL algorithm: successor / feasible-successor / active queries
- Fast convergence via feasible successors (no SPF needed)
"""

import copy
from typing import Dict, List, Optional, Set

from .base import ProtocolBase


def _composite_metric(bandwidth_kbps: int, delay_us: int) -> int:
    """Simplified EIGRP composite metric = (10^7 / BW_min) + (sum_delay / 10)."""
    bw_component = 10_000_000 // max(1, bandwidth_kbps)
    delay_component = delay_us // 10
    return (bw_component + delay_component) * 256


class EIGRPProtocol(ProtocolBase):
    PROTOCOL_NAME = "EIGRP"
    PACKET_COLOR = "#fbbf24"

    def __init__(self, topology):
        super().__init__(topology)
        # Per-router topology table:  {router: {dest: {via_nbr: {metric, rd, ...}}}}
        self.topo_table: Dict[str, Dict[str, Dict[str, dict]]] = {}
        self.routing_tables: Dict[str, Dict[str, dict]] = {}
        # Active / passive state per (router, dest)
        self.active_queries: Dict[str, Dict[str, dict]] = {}
        self.pending_updates: List[dict] = []

    # ── Helpers ───────────────────────────────────────────────────────

    def _link_metric(self, link) -> int:
        bw_kbps = link.bandwidth * 1000
        delay_us = int(link.delay * 1000)
        return _composite_metric(bw_kbps, delay_us)

    def _select_successor(self, router_id: str, dest: str):
        """Pick successor (and possibly feasible successors) for a destination."""
        entries = self.topo_table.get(router_id, {}).get(dest, {})
        if not entries:
            self.routing_tables.get(router_id, {}).pop(dest, None)
            return None

        best = None
        for via, info in entries.items():
            if info.get("metric", float("inf")) >= 1e9:
                continue
            if best is None or info["metric"] < entries[best]["metric"]:
                best = via

        if best is None:
            self.routing_tables.get(router_id, {}).pop(dest, None)
            return None

        best_info = entries[best]
        dest_r = self._get_router(dest)
        via_r = self._get_router(best)
        self.routing_tables.setdefault(router_id, {})[dest] = {
            "destination": dest_r.ip if dest_r else dest,
            "next_hop": via_r.ip if via_r else best,
            "next_hop_id": best,
            "metric": best_info["metric"],
            "feasible_distance": best_info["metric"],
            "protocol": "EIGRP",
            "age": 0,
            "successor": best,
        }
        return best

    # ── Initialise ────────────────────────────────────────────────────

    def initialize(self) -> List[dict]:
        events: List[dict] = []
        for router in self.topology.routers:
            self.topo_table[router.id] = {}
            self.routing_tables[router.id] = {}
            self.active_queries[router.id] = {}

            for link in self._get_connected_links(router.id):
                if link.status != "up":
                    continue
                nbr_id = self._get_other_end(link, router.id)
                metric = self._link_metric(link)
                self.topo_table[router.id].setdefault(nbr_id, {})[nbr_id] = {
                    "metric": metric,
                    "reported_distance": 0,
                }
                self._select_successor(router.id, nbr_id)
                events.append(
                    {
                        "type": "route_update",
                        "router_id": router.id,
                        "destination": nbr_id,
                        "next_hop": nbr_id,
                        "metric": metric,
                        "action": "add",
                        "protocol": "EIGRP",
                    }
                )

            # Queue initial Update packets to neighbours
            for link in self._get_connected_links(router.id):
                if link.status != "up":
                    continue
                nbr_id = self._get_other_end(link, router.id)
                self.pending_updates.append(
                    {"from": router.id, "to": nbr_id, "table": copy.deepcopy(self.routing_tables[router.id])}
                )
        return events

    # ── Step ──────────────────────────────────────────────────────────

    def step(self) -> List[dict]:
        events: List[dict] = []
        self.step_count += 1
        changes = False

        updates_this_round = list(self.pending_updates)
        self.pending_updates.clear()

        for upd in updates_this_round:
            src = upd["from"]
            dst = upd["to"]
            table = upd["table"]

            events.append(
                {
                    "type": "packet_animation",
                    "id": f"eigrp_{self.step_count}_{src}_{dst}",
                    "from": src,
                    "to": dst,
                    "packet_type": "EIGRP_UPDATE",
                    "label": "EIGRP Update",
                    "color": self.PACKET_COLOR,
                }
            )
            self.control_messages += 1

            link = self._get_link_between(src, dst)
            if not link or link.status != "up":
                continue
            link_cost = self._link_metric(link)

            for dest, entry in table.items():
                if dest == dst:
                    continue
                new_metric = entry["metric"] + link_cost
                rd = entry["metric"]  # reported distance
                cur_entries = self.topo_table.setdefault(dst, {}).setdefault(dest, {})
                prev_metric = cur_entries.get(src, {}).get("metric", None)

                cur_entries[src] = {"metric": new_metric, "reported_distance": rd}

                old_rt = self.routing_tables.get(dst, {}).get(dest)
                self._select_successor(dst, dest)
                new_rt = self.routing_tables.get(dst, {}).get(dest)

                if new_rt and (old_rt is None):
                    changes = True
                    events.append(
                        {
                            "type": "route_update",
                            "router_id": dst,
                            "destination": dest,
                            "next_hop": new_rt["next_hop_id"],
                            "metric": new_rt["metric"],
                            "action": "add",
                            "protocol": "EIGRP",
                        }
                    )
                elif new_rt and old_rt and (old_rt["metric"] != new_rt["metric"] or old_rt["next_hop_id"] != new_rt["next_hop_id"]):
                    changes = True
                    events.append(
                        {
                            "type": "route_update",
                            "router_id": dst,
                            "destination": dest,
                            "next_hop": new_rt["next_hop_id"],
                            "metric": new_rt["metric"],
                            "action": "update",
                            "protocol": "EIGRP",
                        }
                    )
                elif old_rt and not new_rt:
                    changes = True
                    events.append(
                        {
                            "type": "route_update",
                            "router_id": dst,
                            "destination": dest,
                            "next_hop": "",
                            "metric": -1,
                            "action": "remove",
                            "protocol": "EIGRP",
                        }
                    )

        # Process active queries (DUAL)
        resolved = []
        for rid, queries in self.active_queries.items():
            for dest, qinfo in list(queries.items()):
                qinfo["wait"] -= 1
                if qinfo["wait"] <= 0:
                    self._select_successor(rid, dest)
                    resolved.append((rid, dest))
                    rt = self.routing_tables.get(rid, {}).get(dest)
                    if rt:
                        changes = True
                        events.append(
                            {
                                "type": "route_update",
                                "router_id": rid,
                                "destination": dest,
                                "next_hop": rt["next_hop_id"],
                                "metric": rt["metric"],
                                "action": "update",
                                "protocol": "EIGRP",
                            }
                        )
        for rid, dest in resolved:
            self.active_queries[rid].pop(dest, None)

        # Convergence detection
        if (
            not self.pending_updates
            and not changes
            and self.step_count > 2
            and not self.converged
            and all(len(q) == 0 for q in self.active_queries.values())
        ):
            self.converged = True
            self.convergence_time = self.step_count * self.step_interval_ms
            events.append(
                {"type": "convergence", "protocol": "EIGRP", "time_ms": self.convergence_time, "converged": True, "step": self.step_count}
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
            {"type": "link_status", "link_id": link_id, "source": link.source, "target": link.target, "status": "down"}
        )

        for rid in (link.source, link.target):
            other = self._get_other_end(link, rid)
            # Remove direct route via failed link
            self.topo_table.setdefault(rid, {}).pop(other, None)
            for dest in list(self.topo_table.get(rid, {})):
                self.topo_table[rid][dest].pop(other, None)

            # Check if feasible successor exists for each affected destination
            for dest in list(self.routing_tables.get(rid, {})):
                rt = self.routing_tables[rid][dest]
                if rt["next_hop_id"] == other:
                    # Try feasible successor
                    new_succ = self._select_successor(rid, dest)
                    new_rt = self.routing_tables.get(rid, {}).get(dest)
                    if new_succ and new_rt:
                        events.append(
                            {
                                "type": "route_update",
                                "router_id": rid,
                                "destination": dest,
                                "next_hop": new_rt["next_hop_id"],
                                "metric": new_rt["metric"],
                                "action": "update",
                                "protocol": "EIGRP",
                            }
                        )
                    else:
                        # Go Active — send queries
                        self.active_queries.setdefault(rid, {})[dest] = {"wait": 2}
                        for ql in self._get_connected_links(rid):
                            if ql.status != "up":
                                continue
                            qn = self._get_other_end(ql, rid)
                            events.append(
                                {
                                    "type": "packet_animation",
                                    "id": f"query_{rid}_{dest}_{qn}",
                                    "from": rid,
                                    "to": qn,
                                    "packet_type": "EIGRP_QUERY",
                                    "label": "Query",
                                    "color": "#f87171",
                                }
                            )
                            self.control_messages += 1
                        events.append(
                            {
                                "type": "route_update",
                                "router_id": rid,
                                "destination": dest,
                                "next_hop": "",
                                "metric": -1,
                                "action": "remove",
                                "protocol": "EIGRP",
                            }
                        )

            # Propagate update to remaining neighbours
            for nl in self._get_connected_links(rid):
                if nl.status != "up":
                    continue
                nbr = self._get_other_end(nl, rid)
                self.pending_updates.append(
                    {"from": rid, "to": nbr, "table": copy.deepcopy(self.routing_tables.get(rid, {}))}
                )
        return events

    def handle_link_recovery(self, link_id: str) -> List[dict]:
        events: List[dict] = []
        link = self._get_link(link_id)
        if not link:
            return events
        link.status = "up"
        self.converged = False
        metric = self._link_metric(link)

        events.append(
            {"type": "link_status", "link_id": link_id, "source": link.source, "target": link.target, "status": "up"}
        )

        for rid in (link.source, link.target):
            other = self._get_other_end(link, rid)
            self.topo_table.setdefault(rid, {}).setdefault(other, {})[other] = {
                "metric": metric,
                "reported_distance": 0,
            }
            self._select_successor(rid, other)
            rt = self.routing_tables.get(rid, {}).get(other)
            if rt:
                events.append(
                    {
                        "type": "route_update",
                        "router_id": rid,
                        "destination": other,
                        "next_hop": rt["next_hop_id"],
                        "metric": rt["metric"],
                        "action": "add",
                        "protocol": "EIGRP",
                    }
                )
            for nl in self._get_connected_links(rid):
                if nl.status != "up":
                    continue
                nbr = self._get_other_end(nl, rid)
                self.pending_updates.append(
                    {"from": rid, "to": nbr, "table": copy.deepcopy(self.routing_tables.get(rid, {}))}
                )
        return events

    # ── Routing tables ────────────────────────────────────────────────

    def get_routing_table(self, router_id: str) -> List[dict]:
        tbl = self.routing_tables.get(router_id, {})
        return [
            {
                "destination": e["destination"],
                "next_hop": e["next_hop"],
                "next_hop_id": e["next_hop_id"],
                "metric": e["metric"],
                "protocol": "EIGRP",
                "age": e.get("age", 0),
                "successor": e.get("successor", ""),
                "status": "active",
            }
            for e in tbl.values()
        ]

    def get_all_routing_tables(self) -> Dict[str, List[dict]]:
        return {rid: self.get_routing_table(rid) for rid in self.routing_tables}

    def _metrics_event(self):
        return {
            "type": "metrics_update",
            "step": self.step_count,
            "convergence_time": self.convergence_time,
            "control_messages": self.control_messages,
            "packet_loss": self.packet_loss,
            "converged": self.converged,
        }
