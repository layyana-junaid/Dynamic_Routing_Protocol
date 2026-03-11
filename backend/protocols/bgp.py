"""
BGP (Border Gateway Protocol) — Path-Vector Simulation
=======================================================
- Inter-AS routing protocol (path-vector)
- Routes carry AS_PATH attribute
- Best-path selection: LOCAL_PREF > AS_PATH length > MED
- eBGP between different AS, iBGP within same AS
- Route advertisements carry NLRI + path attributes
"""

import copy
from typing import Dict, List, Optional, Set

from .base import ProtocolBase


class BGPProtocol(ProtocolBase):
    PROTOCOL_NAME = "BGP"
    PACKET_COLOR = "#c084fc"

    def __init__(self, topology):
        super().__init__(topology)
        # BGP RIB:  {router: {prefix: [path_entry, ...]}}
        self.adj_rib_in: Dict[str, Dict[str, List[dict]]] = {}
        self.loc_rib: Dict[str, Dict[str, dict]] = {}
        self.routing_tables: Dict[str, Dict[str, dict]] = {}
        self.pending_updates: List[dict] = []
        self.as_map: Dict[str, int] = {}  # router → AS number

    # ── Helpers ───────────────────────────────────────────────────────

    def _router_as(self, router_id: str) -> int:
        r = self._get_router(router_id)
        return r.as_number if r and r.as_number else self.as_map.get(router_id, 0)

    def _is_ebgp(self, r1: str, r2: str) -> bool:
        return self._router_as(r1) != self._router_as(r2)

    def _best_path(self, paths: List[dict]) -> Optional[dict]:
        if not paths:
            return None
        valid = [p for p in paths if p.get("withdrawn") is not True]
        if not valid:
            return None
        # Selection: highest LOCAL_PREF → shortest AS_PATH → lowest MED
        valid.sort(
            key=lambda p: (
                -p.get("local_pref", 100),
                len(p.get("as_path", [])),
                p.get("med", 0),
            )
        )
        return valid[0]

    # ── Initialise ────────────────────────────────────────────────────

    def initialize(self) -> List[dict]:
        events: List[dict] = []

        # Build AS map
        for r in self.topology.routers:
            self.as_map[r.id] = r.as_number or 0
            self.adj_rib_in[r.id] = {}
            self.loc_rib[r.id] = {}
            self.routing_tables[r.id] = {}

        # Each router originates a prefix for its own AS
        originated: Dict[int, str] = {}
        for router in self.topology.routers:
            asn = self._router_as(router.id)
            prefix = f"AS{asn}:10.{asn}.0.0/16"

            path_entry = {
                "prefix": prefix,
                "next_hop": router.ip,
                "next_hop_id": router.id,
                "as_path": [asn],
                "local_pref": 100,
                "med": 0,
                "origin": "IGP",
                "originated_by": router.id,
            }
            self.adj_rib_in[router.id].setdefault(prefix, []).append(path_entry)
            best = self._best_path(self.adj_rib_in[router.id][prefix])
            if best:
                self.loc_rib[router.id][prefix] = best
                self._install_route(router.id, prefix, best)
                events.append(self._route_evt(router.id, prefix, best, "add"))

            # Queue advertisements to neighbours
            for link in self._get_connected_links(router.id):
                if link.status != "up":
                    continue
                nbr_id = self._get_other_end(link, router.id)
                self.pending_updates.append(
                    {
                        "from": router.id,
                        "to": nbr_id,
                        "prefix": prefix,
                        "path": copy.deepcopy(path_entry),
                        "withdraw": False,
                    }
                )
        return events

    # ── Step ──────────────────────────────────────────────────────────

    def step(self) -> List[dict]:
        events: List[dict] = []
        self.step_count += 1
        changes = False

        updates = list(self.pending_updates)
        self.pending_updates.clear()

        for upd in updates:
            src = upd["from"]
            dst = upd["to"]
            prefix = upd["prefix"]
            path = upd["path"]
            withdraw = upd.get("withdraw", False)

            link = self._get_link_between(src, dst)
            if not link or link.status != "up":
                continue

            pkt_label = "WITHDRAW" if withdraw else "UPDATE"
            events.append(
                {
                    "type": "packet_animation",
                    "id": f"bgp_{self.step_count}_{src}_{dst}_{prefix[:8]}",
                    "from": src,
                    "to": dst,
                    "packet_type": f"BGP_{pkt_label}",
                    "label": f"BGP {pkt_label}",
                    "color": self.PACKET_COLOR,
                }
            )
            self.control_messages += 1

            if withdraw:
                # Remove paths learned from src
                entries = self.adj_rib_in.get(dst, {}).get(prefix, [])
                self.adj_rib_in[dst][prefix] = [
                    e for e in entries if e.get("next_hop_id") != src
                ]
            else:
                # Loop detection: if our AS is in the path, skip
                dst_as = self._router_as(dst)
                if dst_as in path.get("as_path", []):
                    continue

                new_path = copy.deepcopy(path)
                new_path["next_hop"] = self._get_router(src).ip if self._get_router(src) else src
                new_path["next_hop_id"] = src

                # Prepend AS on eBGP boundary
                if self._is_ebgp(src, dst):
                    new_path["as_path"] = [dst_as] + new_path["as_path"]
                    new_path["local_pref"] = 100
                else:
                    new_path["local_pref"] = path.get("local_pref", 100)

                entries = self.adj_rib_in.setdefault(dst, {}).setdefault(prefix, [])
                # Replace existing entry from same neighbour
                entries = [e for e in entries if e.get("next_hop_id") != src]
                entries.append(new_path)
                self.adj_rib_in[dst][prefix] = entries

            # Re-run best path selection
            old_best = self.loc_rib.get(dst, {}).get(prefix)
            new_best = self._best_path(self.adj_rib_in.get(dst, {}).get(prefix, []))

            if new_best:
                self.loc_rib.setdefault(dst, {})[prefix] = new_best
                self._install_route(dst, prefix, new_best)

                if not old_best:
                    changes = True
                    events.append(self._route_evt(dst, prefix, new_best, "add"))
                elif (
                    old_best.get("next_hop_id") != new_best.get("next_hop_id")
                    or old_best.get("as_path") != new_best.get("as_path")
                ):
                    changes = True
                    events.append(self._route_evt(dst, prefix, new_best, "update"))

                # Propagate to other neighbours
                for lnk in self._get_connected_links(dst):
                    if lnk.status != "up":
                        continue
                    peer = self._get_other_end(lnk, dst)
                    if peer == src:
                        continue
                    self.pending_updates.append(
                        {
                            "from": dst,
                            "to": peer,
                            "prefix": prefix,
                            "path": copy.deepcopy(new_best),
                            "withdraw": False,
                        }
                    )
            elif old_best:
                # Route withdrawn
                self.loc_rib.get(dst, {}).pop(prefix, None)
                self.routing_tables.get(dst, {}).pop(prefix, None)
                changes = True
                events.append(
                    {
                        "type": "route_update",
                        "router_id": dst,
                        "destination": prefix,
                        "next_hop": "",
                        "metric": -1,
                        "action": "remove",
                        "protocol": "BGP",
                    }
                )
                # Send withdrawals
                for lnk in self._get_connected_links(dst):
                    if lnk.status != "up":
                        continue
                    peer = self._get_other_end(lnk, dst)
                    if peer == src:
                        continue
                    self.pending_updates.append(
                        {
                            "from": dst,
                            "to": peer,
                            "prefix": prefix,
                            "path": {},
                            "withdraw": True,
                        }
                    )

        # Convergence detection
        if (
            not self.pending_updates
            and not changes
            and self.step_count > 2
            and not self.converged
        ):
            self.converged = True
            self.convergence_time = self.step_count * self.step_interval_ms
            events.append(
                {
                    "type": "convergence",
                    "protocol": "BGP",
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
        self.packet_loss += 4

        events.append(
            {"type": "link_status", "link_id": link_id, "source": link.source, "target": link.target, "status": "down"}
        )

        # Both endpoints withdraw routes learned from each other
        for rid in (link.source, link.target):
            other = self._get_other_end(link, rid)
            for prefix, entries in list(self.adj_rib_in.get(rid, {}).items()):
                before = len(entries)
                self.adj_rib_in[rid][prefix] = [
                    e for e in entries if e.get("next_hop_id") != other
                ]
                after = len(self.adj_rib_in[rid][prefix])
                if before != after:
                    old_best = self.loc_rib.get(rid, {}).get(prefix)
                    new_best = self._best_path(self.adj_rib_in[rid][prefix])
                    if new_best:
                        self.loc_rib[rid][prefix] = new_best
                        self._install_route(rid, prefix, new_best)
                        events.append(self._route_evt(rid, prefix, new_best, "update"))
                    elif old_best:
                        self.loc_rib.get(rid, {}).pop(prefix, None)
                        self.routing_tables.get(rid, {}).pop(prefix, None)
                        events.append(
                            {"type": "route_update", "router_id": rid, "destination": prefix, "next_hop": "", "metric": -1, "action": "remove", "protocol": "BGP"}
                        )
                        for lnk in self._get_connected_links(rid):
                            if lnk.status != "up":
                                continue
                            peer = self._get_other_end(lnk, rid)
                            self.pending_updates.append(
                                {"from": rid, "to": peer, "prefix": prefix, "path": {}, "withdraw": True}
                            )
        return events

    def handle_link_recovery(self, link_id: str) -> List[dict]:
        events: List[dict] = []
        link = self._get_link(link_id)
        if not link:
            return events
        link.status = "up"
        self.converged = False

        events.append(
            {"type": "link_status", "link_id": link_id, "source": link.source, "target": link.target, "status": "up"}
        )

        # Both endpoints re-advertise their loc-RIB to each other
        for rid in (link.source, link.target):
            other = self._get_other_end(link, rid)
            for prefix, best in self.loc_rib.get(rid, {}).items():
                self.pending_updates.append(
                    {"from": rid, "to": other, "prefix": prefix, "path": copy.deepcopy(best), "withdraw": False}
                )
        return events

    # ── Routing tables ────────────────────────────────────────────────

    def _install_route(self, router_id: str, prefix: str, path: dict):
        self.routing_tables.setdefault(router_id, {})[prefix] = {
            "destination": prefix,
            "next_hop": path.get("next_hop", ""),
            "next_hop_id": path.get("next_hop_id", ""),
            "metric": len(path.get("as_path", [])),
            "as_path": path.get("as_path", []),
            "local_pref": path.get("local_pref", 100),
            "med": path.get("med", 0),
            "protocol": "BGP",
            "age": 0,
            "origin": path.get("origin", "IGP"),
        }

    def get_routing_table(self, router_id: str) -> List[dict]:
        tbl = self.routing_tables.get(router_id, {})
        return [
            {
                "destination": e["destination"],
                "next_hop": e["next_hop"],
                "next_hop_id": e["next_hop_id"],
                "metric": e["metric"],
                "as_path": " → ".join(str(a) for a in e.get("as_path", [])),
                "local_pref": e.get("local_pref", 100),
                "protocol": "BGP",
                "age": e.get("age", 0),
                "status": "active",
            }
            for e in tbl.values()
        ]

    def get_all_routing_tables(self) -> Dict[str, List[dict]]:
        return {rid: self.get_routing_table(rid) for rid in self.routing_tables}

    # ── Private helpers ───────────────────────────────────────────────

    def _route_evt(self, rid, prefix, path, action):
        return {
            "type": "route_update",
            "router_id": rid,
            "destination": prefix,
            "next_hop": path.get("next_hop_id", ""),
            "metric": len(path.get("as_path", [])),
            "action": action,
            "protocol": "BGP",
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
