# Dynamic Routing Protocol Simulator

A full stack, university level application that simulates and visualises **RIP**, **OSPF**, **EIGRP**, and **BGP** routing protocol behaviour on configurable network topologies.

Built for a Computer Networks course project with a professional, demo ready dark themed UI.

---

## Architecture Overview

```
┌────────────────────────────────────────────────────────────────┐
│                        React Frontend                         │
│   React Flow · Framer Motion · Recharts · Tailwind · Zustand  │
└──────────────────────────┬─────────────────────────────────────┘
                           │  REST + WebSocket
┌──────────────────────────┴─────────────────────────────────────┐
│                      FastAPI Backend                           │
│   Simulation Engine · Protocol Modules · Metrics · WS Manager  │
└──────────────────────────┬─────────────────────────────────────┘
                           │  HTTP (optional)
┌──────────────────────────┴─────────────────────────────────────┐
│                  GNS3 Emulation Layer                          │
│   Topology management via GNS3 REST API (v2)                   │
└────────────────────────────────────────────────────────────────┘
```

### Component Roles

| Layer | Technology | Responsibility |
|-------|-----------|---------------|
| **Frontend** | React 18, React Flow, Framer Motion, Recharts, Tailwind CSS | Topology visualisation, protocol animations, routing tables, metrics charts, comparison dashboard |
| **Backend** | Python, FastAPI, WebSockets | REST API, WebSocket event streaming, simulation orchestration, protocol simulation modules |
| **Emulation** | GNS3 (optional) | Network topology emulation via GNS3 REST API; falls back to built-in simulation when GNS3 is unavailable |

### GNS3 Integration Approach

GNS3 is integrated as the **emulation layer** via its REST API (`/v2/`):

- The `GNS3Client` class (`backend/services/gns3_client.py`) communicates with a local GNS3 server
- It can create projects, nodes, links, and sync topology state
- If `GNS3_ENABLED=true` and a GNS3 server is reachable, the app imports topology from GNS3
- **If GNS3 is not running**, the app functions fully using the built-in simulation engine with sample topologies

**What is truly implemented vs abstracted:**

| Feature | Implementation |
|---------|---------------|
| Topology definition | Real (sample topologies + GNS3 import) |
| Protocol routing logic | Academic simulation (correct algorithm modelling) |
| LSA/update packet animation | Simulated events via WebSocket |
| Routing table computation | Real algorithms (Bellman-Ford, Dijkstra, DUAL, path-vector) |
| Link failure/recovery | Fully working in simulation engine |
| Metrics (convergence, loss, overhead) | Measured from simulation |
| GNS3 topology sync | Real GNS3 API integration |
| Actual packet forwarding | Not implemented (would require full router OS images) |

This hybrid approach is **presentation-worthy** and **technically sound** for a university project.

---

## Protocols Implemented

### RIP (Routing Information Protocol)
- Distance-vector, Bellman-Ford algorithm
- Hop count metric (max 15, 16 = infinity)
- Periodic updates, split-horizon, triggered updates
- Slow convergence demonstrated

### OSPF (Open Shortest Path First)
- Link-state, Dijkstra's SPF algorithm
- Cost metric (reference BW / link BW)
- LSA flooding simulation (hop-by-hop)
- Fast convergence after link failure

### EIGRP (Enhanced Interior Gateway Routing Protocol)
- Advanced distance-vector, DUAL algorithm
- Composite metric (bandwidth + delay)
- Successor / feasible-successor selection
- Active queries on successor loss

### BGP (Border Gateway Protocol)
- Path-vector, inter-AS routing
- AS_PATH attribute, loop detection
- Best-path selection (LOCAL_PREF, AS_PATH length, MED)
- Route advertisement and withdrawal

---

## UI Layout

```
┌──────────────────────────────────────────────────────────┐
│  Header: [☰] Title  [RIP|OSPF|EIGRP|BGP]  [▶ ⏸ ⏹ ↺] [☰]│
├──────────┬──────────────────────────────────┬────────────┤
│ Sidebar  │                                  │  Detail    │
│ ─────── │     Topology Canvas              │  Panel     │
│ Topology │     (React Flow + animations)    │  ─────── │
│ Protocol │                                  │  Router    │
│ Failures │                                  │  Info      │
│ Links    │                                  │  Routing   │
│ Compare  │                                  │  Table     │
├──────────┴──────────────────────────────────┴────────────┤
│  Bottom Panel: [Event Log | Metrics | Comparison]        │
└──────────────────────────────────────────────────────────┘
```

---

## Project Structure

```
CN_Project/
├── README.md
├── backend/
│   ├── requirements.txt
│   ├── config.py
│   ├── main.py                          # FastAPI entry point
│   ├── models/
│   │   ├── topology.py                  # Router, Link, Topology models
│   │   └── simulation.py               # SimState, Metrics, Comparison models
│   ├── protocols/
│   │   ├── base.py                      # ProtocolBase ABC
│   │   ├── rip.py                       # RIP simulation
│   │   ├── ospf.py                      # OSPF simulation
│   │   ├── eigrp.py                     # EIGRP simulation
│   │   └── bgp.py                       # BGP simulation
│   ├── services/
│   │   ├── simulation_engine.py         # Orchestrator
│   │   ├── websocket_manager.py         # WS broadcast
│   │   └── gns3_client.py              # GNS3 REST API client
│   ├── routers/
│   │   ├── topology_router.py           # /api/topology/*
│   │   ├── simulation_router.py         # /api/simulation/*
│   │   └── metrics_router.py            # /api/metrics/*
│   └── data/
│       └── sample_topologies.py         # Demo topologies
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── index.html
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── index.css
│       ├── api/client.js               # API wrappers
│       ├── store/simulationStore.js     # Zustand state
│       ├── hooks/
│       │   ├── useWebSocket.js          # WS connection
│       │   └── useSimulation.js         # Simulation actions
│       ├── utils/constants.js           # Colors, protocol info
│       └── components/
│           ├── layout/
│           │   ├── Header.jsx
│           │   ├── Sidebar.jsx
│           │   └── BottomPanel.jsx
│           ├── topology/
│           │   ├── TopologyCanvas.jsx
│           │   ├── RouterNode.jsx
│           │   ├── AnimatedEdge.jsx
│           │   └── PacketOverlay.jsx
│           ├── controls/
│           │   ├── SimulationControls.jsx
│           │   ├── ProtocolSelector.jsx
│           │   └── FailureControls.jsx
│           ├── panels/
│           │   ├── RouterDetail.jsx
│           │   ├── RoutingTable.jsx
│           │   ├── EventLog.jsx
│           │   └── ComparisonView.jsx
│           └── charts/
│               ├── ConvergenceChart.jsx
│               ├── PacketLossChart.jsx
│               └── OverheadChart.jsx
```

---

## Setup & Installation

### Prerequisites
- **Python 3.10+**
- **Node.js 18+** and npm
- **GNS3** (optional — for emulation layer demo)

### Backend Setup

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
```

### Frontend Setup

```bash
cd frontend
npm install
```

### GNS3 Setup (Optional)

1. Install and run GNS3 (download from https://gns3.com)
2. Ensure the GNS3 server is running on `localhost:3080`
3. Set environment variable before starting the backend:
   ```bash
   set GNS3_ENABLED=true    # Windows
   export GNS3_ENABLED=true # Linux/Mac
   ```

---

## Running Locally

### Start the backend

```bash
cd backend
uvicorn main:app --reload --port 8000
```

### Start the frontend (in a separate terminal)

```bash
cd frontend
npm run dev
```

Open **http://localhost:5173** in your browser.

The frontend Vite dev server proxies `/api` and `/ws` requests to the backend automatically.

---

## Demo Walkthrough

### Scenario 1: RIP Route Propagation
1. Select the **Small 4-Router Ring** topology from the sidebar
2. Choose **RIP** protocol from the header
3. Click **Start** (▶) — watch periodic RIP Update packets animate between routers
4. Click any router to see its routing table fill with hop-count routes
5. Observe the Event Log for route add/update events
6. Wait for convergence (status badge turns blue, timer shown)

### Scenario 2: OSPF Link Failure Recovery
1. Load the **Medium 6-Router Mesh** topology
2. Select **OSPF** — start the simulation
3. Once converged, go to **Failure Simulation** in the sidebar
4. Select link **R1 — R2** and click **Fail**
5. Watch LSA flooding animations as routers detect the failure
6. Observe routing tables update with new shortest paths via alternative routes
7. Click **Restore** to bring the link back — watch reconvergence

### Scenario 3: EIGRP Feasible Successor
1. On the same mesh topology, switch to **EIGRP**
2. Start and wait for convergence
3. Fail a link — if a feasible successor exists, watch instant route switch
4. If no feasible successor, observe EIGRP Query packets (red) as the router goes Active

### Scenario 4: BGP Multi-AS
1. Load the **BGP 3-AS Topology**
2. Select **BGP** — start the simulation
3. Watch BGP UPDATE messages propagate between autonomous systems
4. Note the AS_PATH attribute in routing tables
5. Fail an eBGP link — observe route withdrawals and re-advertisements

### Scenario 5: Protocol Comparison
1. Load any topology
2. In the sidebar, click **Run All-Protocol Comparison**
3. Switch to the **Comparison** tab in the bottom panel
4. View the side-by-side table and bar charts comparing convergence time, control messages, packet loss, and overhead for all four protocols

---

## Sample Topologies

| ID | Name | Routers | Links | Best For |
|----|------|---------|-------|----------|
| `small_4` | Small 4-Router Ring | 4 | 5 | RIP demo, simple ring |
| `medium_6` | Medium 6-Router Mesh | 6 | 8 | OSPF, EIGRP, general demo |
| `bgp_3as` | BGP 3-AS Topology | 6 | 7 | BGP inter-AS routing |

---

## API Reference

### Topology
- `GET /api/topology/list` — list available topologies
- `GET /api/topology/{id}` — get topology details
- `POST /api/topology/load/{id}` — load topology into simulation
- `POST /api/topology/link/{id}/fail` — simulate link failure
- `POST /api/topology/link/{id}/recover` — restore failed link

### Simulation
- `GET /api/simulation/state` — current simulation state
- `POST /api/simulation/protocol/{name}` — set protocol (RIP/OSPF/EIGRP/BGP)
- `POST /api/simulation/start` — start simulation loop
- `POST /api/simulation/pause` — pause simulation
- `POST /api/simulation/step` — execute single step
- `POST /api/simulation/reset` — reset to idle
- `POST /api/simulation/compare` — run all-protocol comparison
- `GET /api/simulation/routing-table/{router_id}` — get routing table

### Metrics
- `GET /api/metrics/current` — current metrics snapshot
- `GET /api/metrics/history` — metrics time-series

### WebSocket
- `ws://localhost:8000/ws` — live event stream

---

## Technology Stack

| Component | Technology |
|-----------|-----------|
| Backend framework | FastAPI (Python) |
| Real-time updates | WebSockets |
| Network emulation | GNS3 REST API |
| Frontend framework | React 18 |
| Graph visualisation | React Flow |
| Animations | Framer Motion |
| Charts | Recharts |
| Styling | Tailwind CSS |
| State management | Zustand |
| Icons | Lucide React |
| Build tool | Vite |

---

## License

University project — for educational purposes only.
