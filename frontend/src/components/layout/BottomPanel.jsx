import { useState } from 'react';
import { ChevronUp, ScrollText, BarChart3, GitCompare } from 'lucide-react';
import clsx from 'clsx';
import useSimulationStore from '../../store/simulationStore';
import EventLog from '../panels/EventLog';
import ComparisonView from '../panels/ComparisonView';
import ConvergenceChart from '../charts/ConvergenceChart';
import PacketLossChart from '../charts/PacketLossChart';
import OverheadChart from '../charts/OverheadChart';

const TABS = [
  { id: 'log', label: 'Event Log', icon: ScrollText },
  { id: 'metrics', label: 'Metrics', icon: BarChart3 },
  { id: 'comparison', label: 'Comparison', icon: GitCompare },
];

export default function BottomPanel() {
  const [collapsed, setCollapsed] = useState(false);
  const activeTab = useSimulationStore((s) => s.bottomTab);
  const setTab = useSimulationStore((s) => s.setBottomTab);

  return (
    <div
      className={clsx(
        'border-t border-surface-border bg-surface-panel flex flex-col transition-all duration-300',
        collapsed ? 'h-9' : 'h-56'
      )}
    >
      {/* Tab bar */}
      <div className="flex items-center justify-between h-9 flex-shrink-0 px-3 border-b border-surface-border-light">
        <div className="flex items-center gap-1">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setTab(tab.id);
                  if (collapsed) setCollapsed(false);
                }}
                className={clsx(
                  'flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-medium transition',
                  active
                    ? 'bg-surface-card text-text-primary shadow-soft'
                    : 'text-text-tertiary hover:text-text-primary hover:bg-surface-hover'
                )}
              >
                <Icon size={13} />
                {tab.label}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded hover:bg-surface-hover text-text-tertiary hover:text-text-primary transition"
        >
          <ChevronUp
            size={14}
            className={clsx('transition-transform', collapsed && 'rotate-180')}
          />
        </button>
      </div>

      {/* Tab content */}
      {!collapsed && (
        <div className="flex-1 overflow-hidden">
          {activeTab === 'log' && <EventLog />}
          {activeTab === 'metrics' && (
            <div className="flex h-full gap-2 p-2 overflow-x-auto">
              <div className="flex-1 min-w-[250px]">
                <ConvergenceChart />
              </div>
              <div className="flex-1 min-w-[250px]">
                <PacketLossChart />
              </div>
              <div className="flex-1 min-w-[250px]">
                <OverheadChart />
              </div>
            </div>
          )}
          {activeTab === 'comparison' && <ComparisonView />}
        </div>
      )}
    </div>
  );
}
