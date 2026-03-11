import { useEffect } from 'react';
import useWebSocket from './hooks/useWebSocket';
import useSimulation from './hooks/useSimulation';
import useSimulationStore from './store/simulationStore';
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import BottomPanel from './components/layout/BottomPanel';
import TopologyCanvas from './components/topology/TopologyCanvas';
import RouterDetail from './components/panels/RouterDetail';

export default function App() {
  useWebSocket();
  const { loadTopologyList, loadTopology } = useSimulation();
  const showSidebar = useSimulationStore((s) => s.showSidebar);
  const showDetailPanel = useSimulationStore((s) => s.showDetailPanel);
  const selectedRouter = useSimulationStore((s) => s.selectedRouter);

  // Bootstrap: fetch topology list and load default topology
  useEffect(() => {
    loadTopologyList();
    loadTopology('medium_6');
  }, []);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-surface-base">
      {/* ─ Header ──────────────────────────────────────────────── */}
      <Header />

      {/* ─ Main content area ───────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar */}
        {showSidebar && (
          <div className="w-72 flex-shrink-0 border-r border-surface-border overflow-y-auto bg-surface-panel">
            <Sidebar />
          </div>
        )}

        {/* Center: topology canvas */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 relative">
            <TopologyCanvas />
          </div>

          {/* Bottom panel (logs / charts / comparison) */}
          <BottomPanel />
        </div>

        {/* Right detail panel */}
        {showDetailPanel && selectedRouter && (
          <div className="w-80 flex-shrink-0 border-l border-surface-border overflow-y-auto bg-surface-panel">
            <RouterDetail />
          </div>
        )}
      </div>
    </div>
  );
}
