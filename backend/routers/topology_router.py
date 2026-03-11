from fastapi import APIRouter, HTTPException
from typing import Optional

router = APIRouter(prefix="/api/topology", tags=["topology"])


def _get_engine():
    from main import engine
    return engine


@router.get("/list")
async def list_topologies():
    from data.sample_topologies import TOPOLOGIES
    return [{"id": t["id"], "name": t["name"], "description": t.get("description", "")} for t in TOPOLOGIES]


@router.get("/{topology_id}")
async def get_topology(topology_id: str):
    from data.sample_topologies import get_topology
    topo = get_topology(topology_id)
    if not topo:
        raise HTTPException(status_code=404, detail="Topology not found")
    return topo


@router.post("/load/{topology_id}")
async def load_topology(topology_id: str):
    from data.sample_topologies import get_topology
    from models.topology import Topology
    topo_data = get_topology(topology_id)
    if not topo_data:
        raise HTTPException(status_code=404, detail="Topology not found")
    engine = _get_engine()
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
