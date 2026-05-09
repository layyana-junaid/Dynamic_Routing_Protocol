from fastapi import APIRouter, HTTPException
from typing import List, Optional
from models.topology import Topology

router = APIRouter(prefix="/api/topology", tags=["topology"])


def _get_engine():
    from main import engine
    return engine


def _get_gns3():
    from main import gns3
    return gns3


@router.get("/list")
async def list_topologies():
    from data.sample_topologies import TOPOLOGIES
    
    # 1. Start with sample topologies
    results = [{"id": t["id"], "name": t["name"], "description": t.get("description", ""), "source": "local"} for t in TOPOLOGIES]
    
    # 2. Add GNS3 projects if available
    gns3 = _get_gns3()
    if await gns3.is_available():
        projects = await gns3.list_projects()
        for p in projects:
            results.append({
                "id": f"gns3_{p['project_id']}",
                "name": f"[GNS3] {p['name']}",
                "description": f"GNS3 Project: {p['name']}",
                "source": "gns3",
                "project_id": p['project_id']
            })
            
    return results


@router.get("/{topology_id}")
async def get_topology(topology_id: str):
    # Check if it's a GNS3 topology
    if topology_id.startswith("gns3_"):
        project_id = topology_id.replace("gns3_", "")
        gns3 = _get_gns3()
        topo = await gns3.sync_topology_from_project(project_id)
        if not topo:
            raise HTTPException(status_code=404, detail="GNS3 Project not found or empty")
        return topo
        
    from data.sample_topologies import get_topology
    topo = get_topology(topology_id)
    if not topo:
        raise HTTPException(status_code=404, detail="Topology not found")
    return topo


@router.post("/load/{topology_id}")
async def load_topology(topology_id: str):
    engine = _get_engine()
    
    # Check if it's a GNS3 topology
    if topology_id.startswith("gns3_"):
        project_id = topology_id.replace("gns3_", "")
        gns3 = _get_gns3()
        topo_data = await gns3.sync_topology_from_project(project_id)
        if not topo_data:
            raise HTTPException(status_code=404, detail="GNS3 Project not found or empty")
    else:
        from data.sample_topologies import get_topology
        topo_data = get_topology(topology_id)
        if not topo_data:
            raise HTTPException(status_code=404, detail="Topology not found")
            
    topology = Topology(**topo_data)
    engine.load_topology(topology)
    return {"status": "ok", "topology": topo_data}


@router.post("/link/{link_id}/fail")
async def fail_link(link_id: str):
    engine = _get_engine()
    await engine.fail_link(link_id)
    return {"status": "ok", "link_id": link_id, "action": "fail"}


@router.post("/link/{link_id}/recover")
async def recover_link(link_id: str):
    engine = _get_engine()
    await engine.recover_link(link_id)
    return {"status": "ok", "link_id": link_id, "action": "recover"}


@router.post("/link/{link_id}/cost")
async def update_link_cost(link_id: str, cost: int):
    if cost < 1:
        raise HTTPException(status_code=400, detail="Cost must be >= 1")
    engine = _get_engine()
    await engine.update_link_cost(link_id, cost)
    return {"status": "ok", "link_id": link_id, "cost": cost}
