import { motion } from 'framer-motion';
import clsx from 'clsx';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
} from 'recharts';
import useSimulationStore from '../../store/simulationStore';
import useSimulation from '../../hooks/useSimulation';
import { PROTOCOL_COLORS } from '../../utils/constants';

/**
 * Side-by-side comparison of all four protocols after running the comparison endpoint.
 */
export default function ComparisonView() {
  const { runComparison } = useSimulation();
  const results = useSimulationStore((s) => s.comparisonResults);

  if (!results || results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 p-8">
        <div className="text-xs text-text-tertiary italic text-center max-w-xs">
          No comparison data available. Execute the analysis to see side-by-side performance metrics for all protocols.
        </div>
        <button
          onClick={() => runComparison(null)}
          className="btn-neon px-6 py-2"
        >
          Run Multi-Protocol Analysis
        </button>
      </div>
    );
  }

  const convergenceData = results.map((r) => ({
    name: r.protocol,
    value: r.convergence_time,
    fill: PROTOCOL_COLORS[r.protocol],
  }));

  const controlData = results.map((r) => ({
    name: r.protocol,
    value: r.total_control_messages,
    fill: PROTOCOL_COLORS[r.protocol],
  }));

  const lossData = results.map((r) => ({
    name: r.protocol,
    value: r.total_packet_loss,
    fill: PROTOCOL_COLORS[r.protocol],
  }));

  return (
    <div className="h-full overflow-y-auto">
      <div className="flex flex-col lg:flex-row gap-3 p-3">
        {/* Summary table */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex-[1.5] min-w-[400px]"
        >
          <h4 className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider mb-2">
            Protocol Comparison
          </h4>
          <div className="rounded-xl border border-surface-border shadow-soft overflow-x-auto custom-scrollbar">
            <table className="w-full text-[11px] min-w-[380px]">
              <thead>
                <tr className="bg-surface-hover text-text-secondary uppercase tracking-wider">
                  <th className="text-left px-3 py-2 font-medium">Protocol</th>
                  <th className="text-right px-3 py-2 font-medium">Conv (ms)</th>
                  <th className="text-right px-3 py-2 font-medium">Msgs</th>
                  <th className="text-right px-3 py-2 font-medium">Loss</th>
                  <th className="text-right px-3 py-2 font-medium">Overhead</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r, idx) => {
                  if (!r) return null;
                  const convTime = r.convergence_time ?? 0;
                  const ctrlMsgs = r.total_control_messages ?? 0;
                  const pktLoss = r.total_packet_loss ?? 0;
                  const overhead = (r.total_overhead_bytes ?? 0) / 1000;
                  
                  return (
                    <tr
                      key={r.protocol || idx}
                      className={clsx(
                        'border-t border-surface-border-light hover:bg-surface-hover/50 transition',
                        idx % 2 === 0 ? 'bg-surface-card' : 'bg-surface-panel'
                      )}
                    >
                      <td className="px-3 py-1.5">
                        <span
                          className="font-semibold"
                          style={{ color: PROTOCOL_COLORS[r.protocol] || '#7c3aed' }}
                        >
                          {r.protocol}
                        </span>
                      </td>
                      <td className="px-3 py-1.5 text-right text-text-primary font-mono">
                        {convTime}
                      </td>
                      <td className="px-3 py-1.5 text-right text-text-primary font-mono">
                        {ctrlMsgs}
                      </td>
                      <td className="px-3 py-1.5 text-right text-text-primary font-mono">
                        {pktLoss}
                      </td>
                      <td className="px-3 py-1.5 text-right text-text-primary font-mono">
                        {overhead.toFixed(1)}KB
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Convergence chart */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex-1 min-w-[200px]"
        >
          <h4 className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider mb-2">
            Convergence Time
          </h4>
          <div className="h-32 bg-surface-card border border-surface-border rounded-xl p-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={convergenceData}>
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={35} />
                <Tooltip
                  contentStyle={{ background: '#ffffff', border: '1px solid #d8dee9', borderRadius: 8, fontSize: 11 }}
                  labelStyle={{ color: '#1f2937' }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {convergenceData.map((d, i) => (
                    <Cell key={i} fill={d.fill} fillOpacity={0.8} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Control messages chart */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex-1 min-w-[200px]"
        >
          <h4 className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider mb-2">
            Control Messages
          </h4>
          <div className="h-32 bg-surface-card border border-surface-border rounded-xl p-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={controlData}>
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={35} />
                <Tooltip
                  contentStyle={{ background: '#ffffff', border: '1px solid #d8dee9', borderRadius: 8, fontSize: 11 }}
                  labelStyle={{ color: '#1f2937' }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {controlData.map((d, i) => (
                    <Cell key={i} fill={d.fill} fillOpacity={0.8} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
