import { Activity, PanelLeftClose, PanelRightClose } from 'lucide-react';
import useSimulationStore from '../../store/simulationStore';
import SimulationControls from '../controls/SimulationControls';
import ProtocolSelector from '../controls/ProtocolSelector';
import { SIM_STATES, PROTOCOL_COLORS } from '../../utils/constants';

export default function Header() {
  const simState = useSimulationStore((s) => s.simState);
  const simStep = useSimulationStore((s) => s.simStep);
  const selectedProtocol = useSimulationStore((s) => s.selectedProtocol);
  const toggleSidebar = useSimulationStore((s) => s.toggleSidebar);
  const toggleDetailPanel = useSimulationStore((s) => s.toggleDetailPanel);

  const stateInfo = SIM_STATES[simState] || SIM_STATES.idle;

  return (
    <header className="h-14 flex-shrink-0 flex items-center justify-between px-5 border-b border-surface-border bg-surface-card shadow-soft z-30">
      {/* Left – logo & toggle */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="p-1.5 rounded-md hover:bg-surface-hover text-text-secondary hover:text-text-primary transition"
          title="Toggle sidebar"
        >
          <PanelLeftClose size={18} />
        </button>

        <div className="flex items-center gap-2">
          <Activity size={20} style={{ color: PROTOCOL_COLORS[selectedProtocol] }} />
          <h1 className="text-sm font-semibold tracking-wide text-text-primary">
            Routing Protocol Simulator
          </h1>
        </div>
      </div>

      {/* Center – protocol selector */}
      <div className="flex items-center gap-6">
        <ProtocolSelector />

        {/* Status badge */}
        <div className="flex items-center gap-2 text-xs">
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: stateInfo.color }}
          />
          <span className="text-text-secondary font-medium">{stateInfo.label}</span>
          <span className="text-surface-border">|</span>
          <span className="text-text-tertiary">Step {simStep}</span>
        </div>
      </div>

      {/* Right – simulation controls & toggle */}
      <div className="flex items-center gap-3">
        <SimulationControls />

        <button
          onClick={toggleDetailPanel}
          className="p-1.5 rounded-md hover:bg-surface-hover text-text-secondary hover:text-text-primary transition"
          title="Toggle detail panel"
        >
          <PanelRightClose size={18} />
        </button>
      </div>
    </header>
  );
}
