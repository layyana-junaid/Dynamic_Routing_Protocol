from .base import ProtocolBase
from .rip import RIPProtocol
from .ospf import OSPFProtocol
from .eigrp import EIGRPProtocol
from .bgp import BGPProtocol

PROTOCOL_MAP = {
    "RIP": RIPProtocol,
    "OSPF": OSPFProtocol,
    "EIGRP": EIGRPProtocol,
    "BGP": BGPProtocol,
}
