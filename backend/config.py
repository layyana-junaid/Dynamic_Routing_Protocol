import os
from typing import Optional
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()


class Settings(BaseModel):
    app_name: str = "Dynamic Routing Protocol Simulator"
    gns3_host: str = os.getenv("GNS3_HOST", "127.0.0.1")
    gns3_port: int = int(os.getenv("GNS3_PORT", "3080"))
    gns3_user: Optional[str] = os.getenv("GNS3_USER", None)
    gns3_password: Optional[str] = os.getenv("GNS3_PASSWORD", None)
    gns3_enabled: bool = os.getenv("GNS3_ENABLED", "false").lower() == "true"
    simulation_step_interval: float = float(os.getenv("SIM_STEP_INTERVAL", "1.0"))
    cors_origins: list = [
        "http://localhost:5173",
        "http://localhost:3000",
    ]


settings = Settings()
