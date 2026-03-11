"""
GNS3 integration client.
Communicates with the GNS3 server REST API (v2) for topology management.

Architecture note
-----------------
GNS3 is used as the *emulation layer*: it manages the actual lab topology
(virtual routers, links, network namespaces).  The FastAPI backend uses the
GNS3 API to create / query / modify that topology, while the protocol
simulation and visualisation logic live entirely in our own codebase.

When GNS3 is not available (GNS3_ENABLED=false), the application falls
back to its built-in academic simulation engine, so the project remains
fully demo-able without a running GNS3 server.
"""

import httpx
from typing import Optional, Dict, List, Any
from config import settings


class GNS3Client:
    """Thin async wrapper around the GNS3 REST API."""

    def __init__(self):
        self.base_url = f"http://{settings.gns3_host}:{settings.gns3_port}/v2"
        self.enabled = settings.gns3_enabled
        self._client: Optional[httpx.AsyncClient] = None

    async def _http(self) -> httpx.AsyncClient:
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(timeout=10.0)
        return self._client

    async def close(self):
        if self._client and not self._client.is_closed:
            await self._client.aclose()

    # ── Health / connectivity ─────────────────────────────────────────

    async def is_available(self) -> bool:
        if not self.enabled:
            return False
        try:
            client = await self._http()
            resp = await client.get(f"{self.base_url}/version")
            return resp.status_code == 200
        except Exception:
            return False

    async def get_version(self) -> Optional[dict]:
        try:
            client = await self._http()
            resp = await client.get(f"{self.base_url}/version")
            resp.raise_for_status()
            return resp.json()
        except Exception:
            return None

    # ── Projects ──────────────────────────────────────────────────────

    async def list_projects(self) -> List[dict]:
        try:
            client = await self._http()
            resp = await client.get(f"{self.base_url}/projects")
            resp.raise_for_status()
            return resp.json()
        except Exception:
            return []

    async def create_project(self, name: str) -> Optional[dict]:
        try:
            client = await self._http()
            resp = await client.post(
                f"{self.base_url}/projects",
                json={"name": name},
            )
            resp.raise_for_status()
            return resp.json()
        except Exception:
            return None

    async def open_project(self, project_id: str) -> Optional[dict]:
        try:
            client = await self._http()
            resp = await client.post(
                f"{self.base_url}/projects/{project_id}/open"
            )
            resp.raise_for_status()
            return resp.json()
        except Exception:
            return None

    # ── Nodes ─────────────────────────────────────────────────────────

    async def list_nodes(self, project_id: str) -> List[dict]:
        try:
            client = await self._http()
            resp = await client.get(
                f"{self.base_url}/projects/{project_id}/nodes"
            )
            resp.raise_for_status()
            return resp.json()
        except Exception:
            return []

    async def create_node(
        self,
        project_id: str,
        name: str,
        node_type: str = "vpcs",
        compute_id: str = "local",
        x: int = 0,
        y: int = 0,
    ) -> Optional[dict]:
        body: Dict[str, Any] = {
            "name": name,
            "node_type": node_type,
            "compute_id": compute_id,
            "x": x,
            "y": y,
        }
        try:
            client = await self._http()
            resp = await client.post(
                f"{self.base_url}/projects/{project_id}/nodes",
                json=body,
            )
            resp.raise_for_status()
            return resp.json()
        except Exception:
            return None

    async def start_node(self, project_id: str, node_id: str) -> bool:
        try:
            client = await self._http()
            resp = await client.post(
                f"{self.base_url}/projects/{project_id}/nodes/{node_id}/start"
            )
            return resp.status_code == 200
        except Exception:
            return False

    async def stop_node(self, project_id: str, node_id: str) -> bool:
        try:
            client = await self._http()
            resp = await client.post(
                f"{self.base_url}/projects/{project_id}/nodes/{node_id}/stop"
            )
            return resp.status_code == 200
        except Exception:
            return False

    # ── Links ─────────────────────────────────────────────────────────

    async def list_links(self, project_id: str) -> List[dict]:
        try:
            client = await self._http()
            resp = await client.get(
                f"{self.base_url}/projects/{project_id}/links"
            )
            resp.raise_for_status()
            return resp.json()
        except Exception:
            return []

    async def create_link(
        self,
        project_id: str,
        node1_id: str,
        adapter1: int,
        port1: int,
        node2_id: str,
        adapter2: int,
        port2: int,
    ) -> Optional[dict]:
        body = {
            "nodes": [
                {"node_id": node1_id, "adapter_number": adapter1, "port_number": port1},
                {"node_id": node2_id, "adapter_number": adapter2, "port_number": port2},
            ]
        }
        try:
            client = await self._http()
            resp = await client.post(
                f"{self.base_url}/projects/{project_id}/links",
                json=body,
            )
            resp.raise_for_status()
            return resp.json()
        except Exception:
            return None

    async def delete_link(self, project_id: str, link_id: str) -> bool:
        try:
            client = await self._http()
            resp = await client.delete(
                f"{self.base_url}/projects/{project_id}/links/{link_id}"
            )
            return resp.status_code in (200, 204)
        except Exception:
            return False

    # ── Topology sync helper ──────────────────────────────────────────

    async def sync_topology_from_project(self, project_id: str) -> Optional[dict]:
        """
        Read the current GNS3 project state and convert it to our
        internal Topology model format.
        """
        nodes = await self.list_nodes(project_id)
        links = await self.list_links(project_id)
        if not nodes:
            return None

        routers = []
        node_map: Dict[str, str] = {}
        for i, n in enumerate(nodes):
            rid = f"R{i + 1}"
            node_map[n["node_id"]] = rid
            routers.append(
                {
                    "id": rid,
                    "label": n.get("name", rid),
                    "ip": f"10.0.{i + 1}.1",
                    "position": {"x": n.get("x", i * 200), "y": n.get("y", 200)},
                    "status": "active",
                }
            )

        topo_links = []
        for j, lnk in enumerate(links):
            ln = lnk.get("nodes", [])
            if len(ln) < 2:
                continue
            src = node_map.get(ln[0].get("node_id", ""), "")
            tgt = node_map.get(ln[1].get("node_id", ""), "")
            if src and tgt:
                topo_links.append(
                    {
                        "id": f"L{j + 1}",
                        "source": src,
                        "target": tgt,
                        "cost": 10,
                        "bandwidth": 100,
                        "delay": 1.0,
                        "status": "up",
                        "network": f"10.0.{100 + j}.0/24",
                    }
                )

        return {
            "id": f"gns3_{project_id[:8]}",
            "name": f"GNS3 Topology",
            "description": "Imported from GNS3 project",
            "routers": routers,
            "links": topo_links,
        }
