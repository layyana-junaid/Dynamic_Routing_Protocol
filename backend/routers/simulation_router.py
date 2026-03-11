from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/api/simulation", tags=["simulation"])


def _get_engine():
    from main import engine
    return engine


@router.get("/state")
async def get_state():
    return _get_engine().get_state()


@router.post("/protocol/{protocol_name}")
async def set_protocol(protocol_name: str):
    try:
        _get_engine().set_protocol(protocol_name)
        return {"status": "ok", "protocol": protocol_name.upper()}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/speed")
async def set_speed(speed: float = 1.0):
    _get_engine().set_speed(speed)
    return {"status": "ok", "speed": _get_engine().speed}


@router.post("/start")
async def start_simulation():
    await _get_engine().start()
    return {"status": "ok"}


@router.post("/pause")
async def pause_simulation():
    await _get_engine().pause()
    return {"status": "ok"}


@router.post("/stop")
async def stop_simulation():
    await _get_engine().stop()
    return {"status": "ok"}


@router.post("/step")
async def step_simulation():
    await _get_engine().step_once()
    return {"status": "ok"}


@router.post("/reset")
async def reset_simulation():
    _get_engine().reset()
    return {"status": "ok"}


@router.post("/compare")
async def run_comparison(fail_link_id: str = None):
    results = await _get_engine().run_comparison(fail_link_id)
    return {"results": results}


@router.get("/routing-table/{router_id}")
async def get_routing_table(router_id: str):
    return {"router_id": router_id, "entries": _get_engine().get_routing_table(router_id)}


@router.get("/routing-tables")
async def get_all_routing_tables():
    return _get_engine().get_all_routing_tables()


@router.get("/events")
async def get_events():
    return _get_engine().get_event_log()
