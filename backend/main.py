"""
Dynamic Routing Protocol Simulator — FastAPI Backend
=====================================================
Entry point.  Run with:  uvicorn main:app --reload --port 8000
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from models.topology import Topology
from services.websocket_manager import ConnectionManager
from services.simulation_engine import SimulationEngine
from services.gns3_client import GNS3Client
from routers.topology_router import router as topology_router
from routers.simulation_router import router as simulation_router
from routers.metrics_router import router as metrics_router
from data.sample_topologies import get_default_topology


# ── Shared instances ──────────────────────────────────────────────────

ws_manager = ConnectionManager()
engine = SimulationEngine(ws_manager)
gns3 = GNS3Client()


# ── App lifecycle ─────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: load default topology
    topo_data = get_default_topology()
    if topo_data:
        engine.load_topology(Topology(**topo_data))

    # Check GNS3 availability
    gns3_ok = await gns3.is_available()
    if gns3_ok:
        ver = await gns3.get_version()
        print(f"[GNS3] Connected — version {ver}")
    else:
        print("[GNS3] Not available — using built-in simulation engine")

    yield

    # Shutdown
    await engine.stop()
    await gns3.close()


# ── FastAPI app ───────────────────────────────────────────────────────

app = FastAPI(
    title=settings.app_name,
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(topology_router)
app.include_router(simulation_router)
app.include_router(metrics_router)


# ── WebSocket endpoint ────────────────────────────────────────────────

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await ws_manager.connect(websocket)
    try:
        while True:
            # Keep connection alive; client can send ping/control messages
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)


# ── Health check ──────────────────────────────────────────────────────

@app.get("/api/health")
async def health():
    gns3_ok = await gns3.is_available()
    return {
        "status": "ok",
        "gns3_available": gns3_ok,
        "simulation_state": engine.get_state(),
    }
