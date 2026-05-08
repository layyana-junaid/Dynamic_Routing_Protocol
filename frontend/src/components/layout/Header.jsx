import { Cpu, PanelLeftClose, PanelRightClose } from 'lucide-react';
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
    <header className="h-16 flex-shrink-0 flex items-center justify-between px-6 z-30 glass border-b-0 rounded-2xl shadow-glow-cyan w-full">
      {/* Left – logo & toggle */}
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-xl hover:bg-surface-hover text-text-secondary hover:text-accent-primary transition-all active:scale-90"
          title="Toggle sidebar"
        >
          <PanelLeftClose size={20} />
        </button>

        <div className="flex items-center gap-3">
          <div className="p-2 bg-surface-base rounded-lg border border-surface-border-light shadow-glow-blue animate-pulse">
            <Cpu size={22} className="text-accent-primary" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-widest text-text-primary uppercase flex items-center gap-2">
              <span className="text-accent-primary text-glow">Net</span>Core
              <span className="text-xs font-normal text-text-tertiary ml-1">v2.0</span>
            </h1>
            <p className="text-[10px] text-text-tertiary font-mono tracking-tighter uppercase">Routing Protocol Simulator</p>
          </div>
        </div>
      </div>

      {/* Center – protocol selector */}
      <div className="flex items-center gap-8 bg-surface-base/50 px-6 py-1.5 rounded-2xl border border-surface-border-light">
        <ProtocolSelector />

        <div className="h-6 w-[1px] bg-surface-border-light" />

        {/* Status badge */}
        <div className="flex items-center gap-3 text-xs">
          <div className="relative">
            <div 
              className="w-2 h-2 rounded-full animate-ping absolute"
              style={{ backgroundColor: stateInfo.color }}
            />
            <div 
              className="w-2 h-2 rounded-full relative"
              style={{ backgroundColor: stateInfo.color }}
            />
          </div>
          <span className="text-text-primary font-bold tracking-wide uppercase">{stateInfo.label}</span>
          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-surface-base rounded-md border border-surface-border-light">
             <span className="text-[10px] text-text-tertiary font-mono">STEP</span>
             <span className="font-mono text-accent-primary font-bold">{simStep.toString().padStart(3, '0')}</span>
          </div>
        </div>
      </div>

      {/* Right – simulation controls & toggle */}
      <div className="flex items-center gap-4">
        <SimulationControls />

        <div className="h-6 w-[1px] bg-surface-border-light" />

        <button
          onClick={toggleDetailPanel}
          className="p-2 rounded-xl hover:bg-surface-hover text-text-secondary hover:text-accent-primary transition-all active:scale-90"
          title="Toggle detail panel"
        >
          <PanelRightClose size={20} />
        </button>
      </div>
    </header>
  );
}
