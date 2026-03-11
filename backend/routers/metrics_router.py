from fastapi import APIRouter

router = APIRouter(prefix="/api/metrics", tags=["metrics"])


def _get_engine():
    from main import engine
    return engine


@router.get("/current")
async def get_current_metrics():
    return _get_engine().get_metrics()


@router.get("/history")
async def get_metrics_history():
    return _get_engine().get_metrics_history()
