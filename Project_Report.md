# Project Report: Dynamic Routing Protocol Simulator & Visualizer

**Course:** Computer Networks (Lab)  
**Project Title:** Dynamic Routing Protocol Simulator  
**Environment:** Python (FastAPI), React, GNS3 Integration  

---

## 1. Executive Summary
This project presents a comprehensive, full-stack simulation platform designed to visualize and analyze the behavior of the four primary dynamic routing protocols: **RIP, OSPF, EIGRP, and BGP**. The application provides a real-time, interactive environment where users can configure network topologies, simulate link failures, and observe how routing algorithms adapt dynamically. By integrating a FastAPI backend with a React-based "Void Neon" themed visualization layer, the project bridges the gap between theoretical protocol mechanics and practical network behavior.

## 2. Project Objectives
The primary objectives of this simulator are:
1. **Visual Learning:** To provide a visual representation of routing updates (LSAs, distance-vector updates, path-vector advertisements) using animations.
2. **Algorithm Modeling:** To implement the mathematical foundations of routing: Bellman-Ford (RIP), Dijkstra (OSPF), DUAL (EIGRP), and Path-Vector (BGP).
3. **Comparative Analysis:** To measure and compare performance metrics such as convergence time, control message overhead, and packet loss across different protocols.
4. **Hybrid Emulation:** To support both internal academic simulation and external emulation via GNS3 REST API integration.

## 3. System Architecture
The application follows a modern decoupled architecture:

### 3.1 Backend (FastAPI & Python)
- **Simulation Engine:** Orchestrates the discrete-time step simulation, managing the lifecycle of routers and links.
- **Protocol Modules:** Pluggable Python classes implementing specific routing logic.
- **WebSocket Manager:** Streams live simulation events (packet animations, routing table changes) to the frontend for sub-second updates.
- **GNS3 Client:** A service layer that translates simulation commands into GNS3 API calls, allowing for real-world topology syncing.

### 3.2 Frontend (React & React Flow)
- **Topology Canvas:** Powered by `React Flow`, providing a draggable and zoomable interface for network design.
- **State Management:** `Zustand` handles the global simulation state, ensuring a responsive UI.
- **Animations:** `Framer Motion` is used for packet travel animations and smooth transitions during topology changes.
- **Data Visualization:** `Recharts` renders real-time performance graphs (Convergence time, Packet loss).

---

## 4. Protocol Implementations

### 4.1 RIP (Routing Information Protocol)
- **Algorithm:** Distance-Vector (Bellman-Ford).
- **Metric:** Hop count (Max: 15).
- **Implementation Highlights:** 
    - Periodic updates every X simulation steps.
    - Split-horizon and Poison-reverse mechanisms to prevent routing loops.
    - Simulation of slow convergence and the "count-to-infinity" problem.

### 4.2 OSPF (Open Shortest Path First)
- **Algorithm:** Link-State (Dijkstra’s SPF).
- **Metric:** Cost (Reference BW / Interface BW).
- **Implementation Highlights:**
    - Link-State Advertisement (LSA) flooding simulation.
    - Local Link-State Database (LSDB) synchronization.
    - Independent SPF tree calculation at each node.
    - Rapid reconvergence upon link failure detection.

### 4.3 EIGRP (Enhanced Interior Gateway Routing Protocol)
- **Algorithm:** Diffusing Update Algorithm (DUAL).
- **Metric:** Composite (Bandwidth + Delay).
- **Implementation Highlights:**
    - Selection of Successors and Feasible Successors.
    - Feasibility Condition (AD < FD) modeling.
    - Active Query-Reply phase when no feasible successor is available.

### 4.4 BGP (Border Gateway Protocol)
- **Algorithm:** Path-Vector.
- **Metric:** Path attributes (AS_PATH, Local Pref, MED).
- **Implementation Highlights:**
    - Inter-AS (Autonomous System) routing simulation.
    - Loop prevention via AS_PATH attribute analysis.
    - Simulation of eBGP peering and route withdrawal messages.

---

## 5. Key Features

### 5.1 Real-Time Visualization
The simulator visualizes the "invisible" work of routers. When a link fails, the user sees:
- **Red "Failure" markers** on the link.
- **Animated packets** (colored by protocol) flying between routers to notify neighbors.
- **Live routing table highlights** as paths are removed or updated.

### 5.2 Performance Metrics & Comparison
The simulator tracks three critical KPIs:
1. **Convergence Time:** The time taken for all routers to have a consistent view of the network after a change.
2. **Control Message Overhead:** The number of protocol-specific packets generated to maintain the network.
3. **Reliability (Packet Loss):** Measured during the "instability" window between failure and reconvergence.

### 5.3 GNS3 Integration Layer
For advanced users, the tool can connect to a GNS3 server.
- **Syncing:** The tool can pull a topology directly from a GNS3 project.
- **Automation:** Commands issued in the web UI (like failing a link) can be mirrored in GNS3 by stopping specific node interfaces via the API.

---

## 6. Implementation Challenges & Solutions
- **Concurrency in Simulation:** Handling multiple simultaneous routing updates was solved using a discrete-time step approach where all routers process their "ingress queue" before moving to the next simulation tick.
- **WebSocket Latency:** To ensure the UI feels "alive," we implemented a binary-lightweight JSON protocol over WebSockets, minimizing the overhead of streaming 60+ updates per second.

## 7. Conclusion
This project successfully demonstrates the complexities of modern network routing. By providing a high-fidelity simulation and comparison tool, it serves as an effective educational resource for understanding how the internet maintains connectivity. The modular design of the backend ensures that additional protocols (like IS-IS or RIPng) can be added with minimal friction.

---

**Submitted by:** Laiba  
**Project Repository:** [Dynamic Routing Protocol Simulator](https://github.com/layyana-junaid/Dynamic_Routing_Protocol)  
**Date:** May 9, 2026
