import { useEffect } from 'react';
import { Server, Cpu, Globe } from 'lucide-react';
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
      <div className="flex flex-col items-center justify-center h-full text-text-muted text-xs gap-2">
        <Server size={28} />
        <span>Click a router to inspect</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Router header */}
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: color + '12' }}
        >
          <Cpu size={18} style={{ color }} />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-text-primary">
            {router.label}
          </h3>
          <p className="text-[11px] text-text-tertiary font-mono">{router.ip}</p>
        </div>
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs bg-surface-card border border-surface-border rounded-xl p-3">
        <span className="text-text-tertiary">ID</span>
        <span className="text-text-primary font-mono">{router.id}</span>
        <span className="text-text-tertiary">Status</span>
        <span className="flex items-center gap-1.5">
          <span
            className="w-2 h-2 rounded-full"
            style={{
              backgroundColor:
                router.status === 'active' ? '#22c55e' : '#ef4444',
            }}
          />
          <span className="text-text-primary capitalize">{router.status}</span>
        </span>
        {router.as_number != null && (
          <>
            <span className="text-text-tertiary">AS Number</span>
            <span className="text-text-primary">{router.as_number}</span>
          </>
        )}
        <span className="text-text-tertiary">Protocol</span>
        <span style={{ color }} className="font-medium">
          {selectedProtocol}
        </span>
      </div>

      {/* Routing table */}
      <div>
        <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
          Routing Table
        </h4>
        <RoutingTable entries={entries} protocol={selectedProtocol} />
      </div>
    </div>
  );
}
