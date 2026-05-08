import { useEffect } from 'react';
import {
  Network,
  Unlink,
  Link2,
  BarChart3,
  ChevronDown,
  Info,
  Terminal
} from 'lucide-react';
import { motion } from 'framer-motion';
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
    <div className="flex flex-col gap-4 p-4 h-full overflow-y-auto">
      {/* ── Topology selector ────────────────────────────────── */}
      <SidebarSection icon={<Network size={16} />} title="Network Topology">
        <div className="relative group">
          <select
            value={topology?.id || ''}
            onChange={(e) => loadTopology(e.target.value)}
            className="w-full bg-surface-base border border-surface-border-light rounded-xl px-4 py-3 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary appearance-none transition-all group-hover:border-accent-primary/50"
          >
            {topologyList.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-text-tertiary">
            <ChevronDown size={14} />
          </div>
        </div>
        {topology && (
          <div className="mt-3 p-3 bg-surface-base/30 rounded-xl border border-surface-border-light/50">
            <p className="text-[10px] text-text-tertiary leading-relaxed italic">
              {topology.description}
            </p>
          </div>
        )}
      </SidebarSection>

      {/* ── Protocol info ─────────────────────────────────────── */}
      <SidebarSection icon={<Terminal size={16} />} title="Protocol Engine">
        {protoInfo && (
          <div className="space-y-3 p-3 bg-surface-base/30 rounded-xl border border-surface-border-light/50">
            <div className="flex items-center gap-3">
              <div 
                className="w-3 h-3 rounded-full shadow-glow-cyan animate-pulse"
                style={{ backgroundColor: protoInfo.color, boxShadow: `0 0 10px ${protoInfo.color}80` }}
              />
              <span className="font-bold text-text-primary text-[11px] tracking-widest uppercase">
                {protoInfo.fullName}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-y-2 text-[10px] font-mono">
              <span className="text-text-tertiary uppercase tracking-tighter">Logic</span>
              <span className="text-accent-primary uppercase">{protoInfo.type}</span>
              <span className="text-text-tertiary uppercase tracking-tighter">Metric</span>
              <span className="text-text-primary uppercase">{protoInfo.metric}</span>
            </div>
            <p className="text-[10px] text-text-tertiary leading-relaxed border-t border-surface-border-light/50 pt-2 mt-2">
              {protoInfo.description}
            </p>
          </div>
        )}
      </SidebarSection>

      {/* ── Failure controls ──────────────────────────────────── */}
      <SidebarSection icon={<Unlink size={16} />} title="Failure Injection">
        <FailureControls />
      </SidebarSection>

      {/* ── Link status list ──────────────────────────────────── */}
      <SidebarSection icon={<Link2 size={16} />} title="Live Infrastructure">
        {topology?.links?.length ? (
          <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
            {topology.links.map((link) => {
              const status = linkStatuses[link.id] || link.status;
              const isUp = status === 'up';
              return (
                <div
                  key={link.id}
                  className="flex items-center justify-between bg-surface-base/20 border border-surface-border-light/50 rounded-xl px-4 py-2 hover:bg-surface-hover/50 transition-all group"
                >
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-text-secondary tracking-tighter uppercase group-hover:text-text-primary transition-colors">
                      {link.source} ↔ {link.target}
                    </span>
                    <span className="text-[9px] text-text-tertiary font-mono">Cost: {link.cost}</span>
                  </div>
                  <div 
                    className="w-2 h-2 rounded-full shadow-sm"
                    style={{
                      backgroundColor: isUp ? '#00ff9f' : '#ff006e',
                      boxShadow: isUp ? '0 0 8px #00ff9f80' : '0 0 8px #ff006e80'
                    }}
                  />
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-[10px] text-text-muted italic">No topology loaded</p>
        )}
      </SidebarSection>

      {/* ── Compare protocols ─────────────────────────────────── */}
      <SidebarSection icon={<BarChart3 size={16} />} title="Comparative Analysis">
        <button
          onClick={() => runComparison(null)}
          className="btn-primary w-full text-[10px] font-bold tracking-widest uppercase py-3 shadow-glow-blue"
        >
          Execute All-Protocol Analysis
        </button>
        <p className="text-[9px] text-text-tertiary mt-3 leading-relaxed font-mono px-1">
          Simulates RIP, OSPF, EIGRP, and BGP concurrently to measure convergence delta.
        </p>
      </SidebarSection>
    </div>
  );
}

/* ── Reusable collapsible section ────────────────────────────────── */

function SidebarSection({ icon, title, children }) {
  return (
    <div className="mb-2">
      <div className="flex items-center gap-3 px-1 mb-4">
        <div className="text-accent-primary">{icon}</div>
        <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-text-tertiary/70">
          {title}
        </span>
        <div className="h-[1px] flex-1 bg-surface-border-light/30" />
      </div>
      <div className="px-1">{children}</div>
    </div>
  );
}
