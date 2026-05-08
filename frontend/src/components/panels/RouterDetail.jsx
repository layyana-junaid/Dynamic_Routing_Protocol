import { useEffect } from 'react';
import { Server, Cpu, Activity, ShieldCheck, Zap } from 'lucide-react';
import useSimulationStore from '../../store/simulationStore';
import useSimulation from '../../hooks/useSimulation';
import RoutingTable from './RoutingTable';
import { PROTOCOL_COLORS } from '../../utils/constants';

/**
 * Right-side detail panel showing selected router's info and routing table.
 */
export default function RouterDetail() {
  const selectedRouter = useSimulationStore((s) => s.selectedRouter);
  const topology = useSimulationStore((s) => s.topology);
  const routingTables = useSimulationStore((s) => s.routingTables);
  const selectedProtocol = useSimulationStore((s) => s.selectedProtocol);
  const { fetchRoutingTable } = useSimulation();

  const router = topology?.routers?.find((r) => r.id === selectedRouter);
  const entries = routingTables[selectedRouter] || [];
  const color = PROTOCOL_COLORS[selectedProtocol];

  // Refresh routing table when router or step changes
  const simStep = useSimulationStore((s) => s.simStep);
  useEffect(() => {
    if (selectedRouter) {
      fetchRoutingTable(selectedRouter);
    }
  }, [selectedRouter, simStep]);

  if (!router) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-text-tertiary text-[10px] gap-3 uppercase tracking-[0.2em] animate-pulse">
        <Activity size={32} className="opacity-20" />
        <span>Awaiting Input...</span>
      </div>
    );
  }

  const isUp = router.status === 'active';

  return (
    <div className="flex flex-col gap-6">
      {/* Router Header */}
      <div className="flex items-center gap-4">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center border-2 shadow-inner transition-all duration-500 animate-neon"
          style={{ 
            backgroundColor: color + '08', 
            borderColor: color + '40',
            '--glow-color': color 
          }}
        >
          {isUp ? <Cpu size={22} style={{ color }} /> : <Zap size={22} className="text-accent-warning" />}
        </div>
        <div>
          <h3 className="text-sm font-bold text-text-primary tracking-widest uppercase">
            {router.label}
          </h3>
          <p className="text-[10px] text-accent-primary font-mono bg-accent-primary/10 px-2 py-0.5 rounded-full inline-block mt-1">
            {router.ip}
          </p>
        </div>
      </div>

      {/* Real-time Diagnostics */}
      <div className="grid grid-cols-2 gap-3">
        <MetricCard icon={<Activity size={12} />} label="CONVERGED" value={isUp ? "TRUE" : "FALSE"} color={isUp ? "#00ff9f" : "#ff006e"} />
        <MetricCard icon={<ShieldCheck size={12} />} label="SECURITY" value="ACTIVE" color="#00d2ff" />
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-2 gap-y-3 bg-surface-base/30 border border-surface-border-light/50 rounded-2xl p-4 text-[10px] font-mono">
        <span className="text-text-tertiary uppercase tracking-tighter">System ID</span>
        <span className="text-text-primary text-right uppercase">{router.id}</span>
        
        <span className="text-text-tertiary uppercase tracking-tighter">Status</span>
        <span className="flex items-center justify-end gap-2">
          <span
            className="w-1.5 h-1.5 rounded-full animate-pulse"
            style={{ backgroundColor: isUp ? '#00ff9f' : '#ff006e' }}
          />
          <span className="text-text-primary uppercase">{router.status}</span>
        </span>

        {router.as_number != null && (
          <>
            <span className="text-text-tertiary uppercase tracking-tighter">Domain AS</span>
            <span className="text-text-primary text-right">{router.as_number}</span>
          </>
        )}
        
        <span className="text-text-tertiary uppercase tracking-tighter">Protocol</span>
        <span style={{ color }} className="font-bold text-right uppercase text-glow">
          {selectedProtocol}
        </span>
      </div>

      {/* Routing Table Section */}
      <div className="flex-1 min-h-0 flex flex-col">
        <h4 className="text-[10px] font-bold text-text-tertiary uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
          <div className="w-1 h-1 bg-accent-primary" />
          FIB (Forwarding Information Base)
        </h4>
        <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
           <RoutingTable entries={entries} protocol={selectedProtocol} />
        </div>
      </div>
    </div>
  );
}

function MetricCard({ icon, label, value, color }) {
  return (
    <div className="bg-surface-base/30 border border-surface-border-light/50 rounded-xl p-2 flex flex-col gap-1">
      <div className="flex items-center gap-1.5 text-[8px] text-text-tertiary uppercase font-bold tracking-tighter">
        <span style={{ color }}>{icon}</span>
        {label}
      </div>
      <div className="text-[11px] font-bold tracking-widest uppercase" style={{ color }}>
        {value}
      </div>
    </div>
  );
}
