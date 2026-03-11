"""
OSPF (Open Shortest Path First) — Link-State Simulation
========================================================
- Metric: cost = reference_bw / link_bw (minimum 1)
- Each router generates LSAs for directly connected links
- LSAs are flooded hop-by-hop until every router has the full LSDB
- Each router independently runs Dijkstra's SPF to compute shortest paths
- Fast convergence after topology changes
"""

import copy
from typing import Dict, List, Set

from .base import ProtocolBase


class OSPFProtocol(ProtocolBase):
    PROTOCOL_NAME = "OSPF"
    PACKET_COLOR = "#60a5fa"
    REFERENCE_BW = 1000  # Mbps

    def __init__(self, topology):
        super().__init__(topology)
        # Global truth LSDB: origin_router → {neighbour: cost}
        self.lsdb: Dict[str, Dict[str, int]] = {}
        # Per-router view (simulates flooding latency)
        self.router_lsdb: Dict[str, Dict[str, Dict[str, int]]] = {}
        self.routing_tables: Dict[str, Dict[str, dict]] = {}
        self.pending_lsas: List[dict] = []
        self.lsa_seq = 1

    # ── Helpers ───────────────────────────────────────────────────────

    def _cost(self, link) -> int:
        return max(1, int(self.REFERENCE_BW / max(1, link.bandwidth)))

    # ── Initialise ────────────────────────────────────────────────────

    def initialize(self) -> List[dict]:
        events: List[dict] = []
        for router in self.topology.routers:
            self.lsdb[router.id] = {}
            self.router_lsdb[router.id] = {}
            self.routing_tables[router.id] = {}

            for link in self._get_connected_links(router.id):
                if link.status != "up":
                    continue
                nbr = self._get_other_end(link, router.id)
                cost = self._cost(link)
                self.lsdb[router.id][nbr] = cost
                self.router_lsdb[router.id].setdefault(router.id, {})[nbr] = cost

            # Queue LSA for flooding
            self.pending_lsas.append(
                {
                    "origin": router.id,
                    "lsa": dict(self.lsdb[router.id]),
                    "seq": self.lsa_seq,
                    "ttl": len(self.topology.routers),
                    "visited": {router.id},
                }
            )
            events.append(
                {
                    "type": "route_update",
                    "router_id": router.id,
                    "destination": "LSDB",
                    "action": "init",
                    "protocol": "OSPF",
                    "metric": 0,
                    "next_hop": "",
                }
            )
        self.lsa_seq += 1
        return events

    # ── Step ──────────────────────────────────────────────────────────

    def step(self) -> List[dict]:
        events: List[dict] = []
        self.step_count += 1
        changes = False

        # --- Phase 1: flood pending LSAs one hop further ---
        next_pending: List[dict] = []
        for lsa_info in self.pending_lsas:
            origin = lsa_info["origin"]
            lsa_data = lsa_info["lsa"]
            visited: Set[str] = lsa_info["visited"]
            new_visited: Set[str] = set()

            for rid in list(visited):
                for link in self._get_connected_links(rid):
                    if link.status != "up":
                        continue
                    nbr_id = self._get_other_end(link, rid)
                    if nbr_id in visited:
                        continue
                    nbr = self._get_router(nbr_id)
                    if not nbr or nbr.status != "active":
                        continue

                    events.append(
                        {
                            "type": "packet_animation",
                            "id": f"lsa_{self.step_count}_{origin}_{rid}_{nbr_id}",
                            "from": rid,
                            "to": nbr_id,
                            "packet_type": "LSA",
                            "label": f"LSA ({origin})",
                            "color": self.PACKET_COLOR,
                        }
                    )
                    self.control_messages += 1

                    old = dict(self.router_lsdb.get(nbr_id, {}).get(origin, {}))
                    self.router_lsdb.setdefault(nbr_id, {})[origin] = dict(lsa_data)
                    if old != lsa_data:
                        changes = True
                    new_visited.add(nbr_id)

            all_vis = visited | new_visited
            all_active = {r.id for r in self.topology.routers if r.status == "active"}
            if all_vis < all_active and lsa_info["ttl"] > 1:
                next_pending.append(
                    {
                        "origin": origin,
                        "lsa": lsa_data,
                        "seq": lsa_info["seq"],
                        "ttl": lsa_info["ttl"] - 1,
                        "visited": all_vis,
                    }
                )
        self.pending_lsas = next_pending

        # --- Phase 2: recompute SPF when LSDB changed ---
        if changes or (not self.pending_lsas and self.step_count <= 3):
            for router in self.topology.routers:
                if router.status != "active":
                    continue
                new_routes = self._dijkstra(router.id)
                old_routes = dict(self.routing_tables.get(router.id, {}))
                self.routing_tables[router.id] = new_routes

                for dest, entry in new_routes.items():
                    prev = old_routes.get(dest)
                    if not prev:
                        events.append(self._route_evt(router.id, dest, entry, "add"))
                    elif prev["metric"] != entry["metric"] or prev["next_hop_id"] != entry["next_hop_id"]:
                        events.append(self._route_evt(router.id, dest, entry, "update"))
                for dest in old_routes:
                    if dest not in new_routes:
                        events.append(
                            {
                                "type": "route_update",
                                "router_id": router.id,
                                "destination": dest,
                                "next_hop": "",
                                "metric": -1,
                                "action": "remove",
                                "protocol": "OSPF",
                            }
                        )

        # --- Convergence detection ---
        if (
            not self.pending_lsas
            and not changes
            and self.step_count > 2
            and not self.converged
        ):
            self.converged = True
            self.convergence_time = self.step_count * self.step_interval_ms
            events.append(
                {
                    "type": "convergence",
                    "protocol": "OSPF",
                    "time_ms": self.convergence_time,
                    "converged": True,
                    "step": self.step_count,
                }
            )
        elif changes:
            self.converged = False

        events.append(self._metrics_event())
        return events

    # ── Dijkstra SPF ──────────────────────────────────────────────────

    def _dijkstra(self, source: str) -> Dict[str, dict]:
        lsdb = self.router_lsdb.get(source, {})
        all_nodes: Set[str] = set()
        for orig, nbrs in lsdb.items():
            all_nodes.add(orig)
            for n in nbrs:
                all_nodes.add(n)

        dist = {n: float("inf") for n in all_nodes}
        dist[source] = 0
        prev: Dict[str, str] = {}
        visited: Set[str] = set()

        while len(visited) < len(all_nodes):
            u, d = None, float("inf")
            for n in all_nodes - visited:
                if dist[n] < d:
                    u, d = n, dist[n]
            if u is None:
                break
            visited.add(u)
            for nbr, cost in lsdb.get(u, {}).items():
                if nbr in visited:
                    continue
                alt = dist[u] + cost
                if alt < dist[nbr]:
                    dist[nbr] = alt
                    prev[nbr] = u

        routes: Dict[str, dict] = {}
        for dest in all_nodes:
            if dest == source or dist[dest] == float("inf"):
                continue
            # Trace first hop
            cur = dest
            while cur in prev and prev[cur] != source:
                cur = prev[cur]
            first_hop = cur
            dest_r = self._get_router(dest)
            fh_r = self._get_router(first_hop)
            if dest_r and fh_r:
                routes[dest] = {
                    "destination": dest_r.ip,
                    "next_hop": fh_r.ip,
                    "next_hop_id": first_hop,
                    "metric": dist[dest],
                    "protocol": "OSPF",
                    "age": 0,
                    "path_type": "intra-area",
                }
        return routes

    # ── Link failure / recovery ───────────────────────────────────────

    def handle_link_failure(self, link_id: str) -> List[dict]:
        events: List[dict] = []
        link = self._get_link(link_id)
        if not link:
            return events
        link.status = "down"
        self.converged = False
        self.packet_loss += 3

        events.append(
            {"type": "link_status", "link_id": link_id, "source": link.source, "target": link.target, "status": "down"}
        )

        for rid in (link.source, link.target):
            other = self._get_other_end(link, rid)
            self.lsdb.setdefault(rid, {}).pop(other, None)
            self.lsdb.setdefault(other, {}).pop(rid, None)
            self.router_lsdb.setdefault(rid, {})[rid] = dict(self.lsdb.get(rid, {}))

            self.pending_lsas.append(
                {
                    "origin": rid,
                    "lsa": dict(self.lsdb.get(rid, {})),
                    "seq": self.lsa_seq,
                    "ttl": len(self.topology.routers),
                    "visited": {rid},
                }
            )
        self.lsa_seq += 1
        return events

    def handle_link_recovery(self, link_id: str) -> List[dict]:
        events: List[dict] = []
        link = self._get_link(link_id)
        if not link:
            return events
        link.status = "up"
        self.converged = False
        cost = self._cost(link)

        events.append(
            {"type": "link_status", "link_id": link_id, "source": link.source, "target": link.target, "status": "up"}
        )

        for rid in (link.source, link.target):
            other = self._get_other_end(link, rid)
            self.lsdb.setdefault(rid, {})[other] = cost
            self.router_lsdb.setdefault(rid, {})[rid] = dict(self.lsdb[rid])
            self.pending_lsas.append(
                {
                    "origin": rid,
                    "lsa": dict(self.lsdb[rid]),
                    "seq": self.lsa_seq,
                    "ttl": len(self.topology.routers),
                    "visited": {rid},
                }
            )
        self.lsa_seq += 1
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
                "protocol": "OSPF",
                "age": e.get("age", 0),
                "path_type": e.get("path_type", "intra-area"),
                "status": "active",
            }
            for e in tbl.values()
        ]

    def get_all_routing_tables(self) -> Dict[str, List[dict]]:
        return {rid: self.get_routing_table(rid) for rid in self.routing_tables}

    # ── Private helpers ───────────────────────────────────────────────

    def _route_evt(self, rid, dest, entry, action):
        return {
            "type": "route_update",
            "router_id": rid,
            "destination": dest,
            "next_hop": entry["next_hop_id"],
            "metric": entry["metric"],
            "action": action,
            "protocol": "OSPF",
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
