from pydantic import BaseModel
from typing import List, Optional


class Position(BaseModel):
    x: float
    y: float


class Router(BaseModel):
    id: str
    label: str
    ip: str
    position: Position
    as_number: Optional[int] = None
    status: str = "active"


class Link(BaseModel):
    id: str
    source: str
    target: str
    cost: int = 10
    bandwidth: int = 100
    delay: float = 1.0
    status: str = "up"
    network: str = ""


class Topology(BaseModel):
    id: str
    name: str
    description: str = ""
    routers: List[Router]
    links: List[Link]


class TopologyUpdate(BaseModel):
    link_id: str
    action: str   # fail, recover, update_cost
    cost: Optional[int] = None
