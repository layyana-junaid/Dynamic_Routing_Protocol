from pydantic import BaseModel
from typing import Optional, List, Dict, Any


class SimulationConfig(BaseModel):
    topology_id: str = "default"
    protocol: str = "OSPF"
    speed: float = 1.0


class SimulationState(BaseModel):
    state: str = "idle"
    protocol: str = "OSPF"
    step: int = 0
    converged: bool = False
    convergence_time: float = 0


class SimulationEvent(BaseModel):
    type: str
    data: Dict[str, Any]
    timestamp: float = 0


class RoutingEntry(BaseModel):
    destination: str
    next_hop: str
    next_hop_id: str
    metric: float
    protocol: str
    age: int = 0
    via_interface: str = ""


class MetricsSnapshot(BaseModel):
    step: int
    convergence_time: float
    packet_loss: int
    control_messages: int
    control_overhead_bytes: int
    active_routes: int


class ComparisonResult(BaseModel):
    protocol: str
    convergence_time: float
    failure_convergence_time: float = 0
    total_control_messages: int
    total_packet_loss: int
    total_overhead_bytes: int
    route_changes: int
    final_route_count: int
