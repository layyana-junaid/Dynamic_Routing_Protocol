"""
Sample topologies for demo scenarios.
Each topology is defined as a plain dict matching the Topology model.
"""


TOPOLOGIES = [
    # ── 1. Small 4-Router topology (good for RIP demo) ────────────────
    {
        "id": "small_4",
        "name": "Small 4 Router Ring",
        "description": "Simple ring topology  ideal for RIP distance vector demonstration",
        "routers": [
            {"id": "R1", "label": "Router 1", "ip": "10.0.1.1", "position": {"x": 200, "y": 80}, "status": "active"},
            {"id": "R2", "label": "Router 2", "ip": "10.0.2.1", "position": {"x": 500, "y": 80}, "status": "active"},
            {"id": "R3", "label": "Router 3", "ip": "10.0.3.1", "position": {"x": 500, "y": 350}, "status": "active"},
            {"id": "R4", "label": "Router 4", "ip": "10.0.4.1", "position": {"x": 200, "y": 350}, "status": "active"},
        ],
        "links": [
            {"id": "L1", "source": "R1", "target": "R2", "cost": 10, "bandwidth": 100, "delay": 1.0, "status": "up", "network": "10.0.12.0/24"},
            {"id": "L2", "source": "R2", "target": "R3", "cost": 10, "bandwidth": 100, "delay": 1.0, "status": "up", "network": "10.0.23.0/24"},
            {"id": "L3", "source": "R3", "target": "R4", "cost": 10, "bandwidth": 100, "delay": 1.0, "status": "up", "network": "10.0.34.0/24"},
            {"id": "L4", "source": "R4", "target": "R1", "cost": 10, "bandwidth": 100, "delay": 1.0, "status": "up", "network": "10.0.41.0/24"},
            {"id": "L5", "source": "R1", "target": "R3", "cost": 25, "bandwidth": 40, "delay": 5.0, "status": "up", "network": "10.0.13.0/24"},
        ],
    },
    # ── 2. Medium 6-Router mesh (OSPF / EIGRP demo) ──────────────────
    {
        "id": "medium_6",
        "name": "Medium 6 Router Mesh",
        "description": "Mesh topology with multiple paths  best for OSPF and EIGRP demonstrations",
        "routers": [
            {"id": "R1", "label": "Router 1", "ip": "10.0.1.1", "position": {"x": 250, "y": 60},  "status": "active"},
            {"id": "R2", "label": "Router 2", "ip": "10.0.2.1", "position": {"x": 550, "y": 60},  "status": "active"},
            {"id": "R3", "label": "Router 3", "ip": "10.0.3.1", "position": {"x": 100, "y": 250}, "status": "active"},
            {"id": "R4", "label": "Router 4", "ip": "10.0.4.1", "position": {"x": 700, "y": 250}, "status": "active"},
            {"id": "R5", "label": "Router 5", "ip": "10.0.5.1", "position": {"x": 250, "y": 440}, "status": "active"},
            {"id": "R6", "label": "Router 6", "ip": "10.0.6.1", "position": {"x": 550, "y": 440}, "status": "active"},
        ],
        "links": [
            {"id": "L1", "source": "R1", "target": "R2", "cost": 10, "bandwidth": 100, "delay": 1.0, "status": "up", "network": "10.0.12.0/24"},
            {"id": "L2", "source": "R1", "target": "R3", "cost": 20, "bandwidth": 50,  "delay": 2.0, "status": "up", "network": "10.0.13.0/24"},
            {"id": "L3", "source": "R1", "target": "R5", "cost": 15, "bandwidth": 70,  "delay": 1.5, "status": "up", "network": "10.0.15.0/24"},
            {"id": "L4", "source": "R2", "target": "R4", "cost": 10, "bandwidth": 100, "delay": 1.0, "status": "up", "network": "10.0.24.0/24"},
            {"id": "L5", "source": "R2", "target": "R6", "cost": 25, "bandwidth": 40,  "delay": 3.0, "status": "up", "network": "10.0.26.0/24"},
            {"id": "L6", "source": "R3", "target": "R5", "cost": 10, "bandwidth": 100, "delay": 1.0, "status": "up", "network": "10.0.35.0/24"},
            {"id": "L7", "source": "R4", "target": "R6", "cost": 10, "bandwidth": 100, "delay": 1.0, "status": "up", "network": "10.0.46.0/24"},
            {"id": "L8", "source": "R5", "target": "R6", "cost": 10, "bandwidth": 100, "delay": 1.0, "status": "up", "network": "10.0.56.0/24"},
        ],
    },
    # ── 3. BGP multi-AS topology (3 autonomous systems) ───────────────
    {
        "id": "bgp_3as",
        "name": "BGP 3 AS Topology",
        "description": "Three autonomous systems with eBGP peering  for BGP path vector demonstration",
        "routers": [
            {"id": "R1", "label": "AS100-R1", "ip": "10.100.1.1", "position": {"x": 150, "y": 100}, "as_number": 100, "status": "active"},
            {"id": "R2", "label": "AS100-R2", "ip": "10.100.2.1", "position": {"x": 400, "y": 100}, "as_number": 100, "status": "active"},
            {"id": "R3", "label": "AS200-R1", "ip": "10.200.1.1", "position": {"x": 650, "y": 100}, "as_number": 200, "status": "active"},
            {"id": "R4", "label": "AS200-R2", "ip": "10.200.2.1", "position": {"x": 650, "y": 350}, "as_number": 200, "status": "active"},
            {"id": "R5", "label": "AS300-R1", "ip": "10.300.1.1", "position": {"x": 400, "y": 350}, "as_number": 300, "status": "active"},
            {"id": "R6", "label": "AS300-R2", "ip": "10.300.2.1", "position": {"x": 150, "y": 350}, "as_number": 300, "status": "active"},
        ],
        "links": [
            # iBGP links (within AS)
            {"id": "L1", "source": "R1", "target": "R2", "cost": 5,  "bandwidth": 1000, "delay": 0.5, "status": "up", "network": "10.100.12.0/24"},
            {"id": "L2", "source": "R3", "target": "R4", "cost": 5,  "bandwidth": 1000, "delay": 0.5, "status": "up", "network": "10.200.12.0/24"},
            {"id": "L3", "source": "R5", "target": "R6", "cost": 5,  "bandwidth": 1000, "delay": 0.5, "status": "up", "network": "10.300.12.0/24"},
            # eBGP links (between AS)
            {"id": "L4", "source": "R2", "target": "R3", "cost": 20, "bandwidth": 100,  "delay": 5.0, "status": "up", "network": "10.0.23.0/24"},
            {"id": "L5", "source": "R4", "target": "R5", "cost": 20, "bandwidth": 100,  "delay": 5.0, "status": "up", "network": "10.0.45.0/24"},
            {"id": "L6", "source": "R6", "target": "R1", "cost": 20, "bandwidth": 100,  "delay": 5.0, "status": "up", "network": "10.0.61.0/24"},
            # Extra cross-link for redundancy
            {"id": "L7", "source": "R2", "target": "R5", "cost": 30, "bandwidth": 50,   "delay": 8.0, "status": "up", "network": "10.0.25.0/24"},
        ],
    },
]

# Default topology used at startup
DEFAULT_TOPOLOGY_ID = "medium_6"


def get_topology(topology_id: str):
    for t in TOPOLOGIES:
        if t["id"] == topology_id:
            return t
    return None


def get_default_topology():
    return get_topology(DEFAULT_TOPOLOGY_ID)
