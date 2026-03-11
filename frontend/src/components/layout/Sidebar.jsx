import { useEffect } from 'react';
import {
  Network,
  Unlink,
  Link2,
  BarChart3,
  ChevronDown,
  Info,
} from 'lucide-react';
import useSimulationStore from '../../store/simulationStore';
import useSimulation from '../../hooks/useSimulation';
import { PROTOCOL_INFO, PROTOCOL_COLORS } from '../../utils/constants';
import FailureControls from '../controls/FailureControls';

export default function Sidebar() {
  const topology = useSimulationStore((s) => s.topology);
  const topologyList = useSimulationStore((s) => s.topologyList);
  const selectedProtocol = useSimulationStore((s) => s.selectedProtocol);
  const linkStatuses = useSimulationStore((s) => s.linkStatuses);
  const { loadTopology, runComparison } = useSimulation();

  const protoInfo = PROTOCOL_INFO[selectedProtocol];

  return (
    <div className="flex flex-col gap-0.5 p-3 text-sm">
      {/* ── Topology selector ────────────────────────────────── */}
      <SidebarSection icon={<Network size={15} />} title="Topology">
        <select
          value={topology?.id || ''}
          onChange={(e) => loadTopology(e.target.value)}
          className="w-full bg-surface-card border border-surface-border rounded-lg px-3 py-2 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
        >
          {topologyList.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        {topology && (
          <p className="text-xs text-text-tertiary mt-2 leading-relaxed">
            {topology.description}
          </p>
        )}
      </SidebarSection>

      {/* ── Protocol info ─────────────────────────────────────── */}
      <SidebarSection icon={<Info size={15} />} title="Protocol Info">
        {protoInfo && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: protoInfo.color }}
              />
              <span className="font-medium text-text-primary text-xs">
                {protoInfo.fullName}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
              <span className="text-text-tertiary">Type</span>
              <span className="text-text-primary">{protoInfo.type}</span>
              <span className="text-text-tertiary">Metric</span>
              <span className="text-text-primary">{protoInfo.metric}</span>
            </div>
            <p className="text-xs text-text-tertiary leading-relaxed">
              {protoInfo.description}
            </p>
          </div>
        )}
      </SidebarSection>

      {/* ── Failure controls ──────────────────────────────────── */}
      <SidebarSection icon={<Unlink size={15} />} title="Failure Simulation">
        <FailureControls />
      </SidebarSection>

      {/* ── Link status list ──────────────────────────────────── */}
      <SidebarSection icon={<Link2 size={15} />} title="Link Status">
        {topology?.links?.length ? (
          <div className="space-y-1 max-h-44 overflow-y-auto pr-1">
            {topology.links.map((link) => {
              const status = linkStatuses[link.id] || link.status;
              const isUp = status === 'up';
              return (
                <div
                  key={link.id}
                  className="flex items-center justify-between bg-surface-card border border-surface-border-light rounded-lg px-3 py-1.5"
                >
                  <span className="text-xs text-text-primary">
                    {link.source} — {link.target}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-text-tertiary">
                      c:{link.cost}
                    </span>
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{
                        backgroundColor: isUp ? '#22c55e' : '#ef4444',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-text-muted">No topology loaded</p>
        )}
      </SidebarSection>

      {/* ── Compare protocols ─────────────────────────────────── */}
      <SidebarSection icon={<BarChart3 size={15} />} title="Compare Protocols">
        <button
          onClick={() => runComparison(null)}
          className="w-full py-2 rounded-lg text-xs font-medium bg-accent-primary/10 text-accent-primary hover:bg-accent-primary/20 transition border border-accent-primary/20"
        >
          Run All-Protocol Comparison
        </button>
        <p className="text-[10px] text-text-muted mt-1.5">
          Runs RIP, OSPF, EIGRP, BGP to convergence on the current topology and compares metrics.
        </p>
      </SidebarSection>
    </div>
  );
}

/* ── Reusable collapsible section ────────────────────────────────── */

function SidebarSection({ icon, title, children }) {
  return (
    <details open className="group mb-2">
      <summary className="flex items-center gap-2 cursor-pointer select-none py-2 px-1 rounded-md hover:bg-surface-hover transition text-text-secondary hover:text-text-primary">
        {icon}
        <span className="text-xs font-semibold uppercase tracking-wider flex-1">
          {title}
        </span>
        <ChevronDown
          size={14}
          className="transition-transform group-open:rotate-180 text-text-muted"
        />
      </summary>
      <div className="pl-1 pr-0.5 pt-2 pb-3">{children}</div>
    </details>
  );
}
