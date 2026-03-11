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
import { PROTOCOL_COLORS } from '../../utils/constants';

/**
 * Side-by-side comparison of all four protocols after running the comparison endpoint.
 */
export default function ComparisonView() {
  const results = useSimulationStore((s) => s.comparisonResults);

  if (!results || results.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-xs text-text-muted italic">
        No comparison data yet — use the sidebar to run a comparison
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
          className="flex-1 min-w-[280px]"
        >
          <h4 className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider mb-2">
            Protocol Comparison
          </h4>
          <div className="rounded-xl border border-surface-border shadow-soft overflow-hidden">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="bg-surface-hover text-text-secondary uppercase tracking-wider">
                  <th className="text-left px-3 py-2 font-medium">Protocol</th>
                  <th className="text-right px-3 py-2 font-medium">Conv. (ms)</th>
                  <th className="text-right px-3 py-2 font-medium">Ctrl Msgs</th>
                  <th className="text-right px-3 py-2 font-medium">Pkt Loss</th>
                  <th className="text-right px-3 py-2 font-medium">Overhead</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r, idx) => (
                  <tr
                    key={r.protocol}
                    className={clsx(
                      'border-t border-surface-border-light hover:bg-surface-hover/50 transition',
                      idx % 2 === 0 ? 'bg-surface-card' : 'bg-surface-panel'
                    )}
                  >
                    <td className="px-3 py-1.5">
                      <span
                        className="font-semibold"
                        style={{ color: PROTOCOL_COLORS[r.protocol] }}
                      >
                        {r.protocol}
                      </span>
                    </td>
                    <td className="px-3 py-1.5 text-right text-text-primary font-mono">
                      {r.convergence_time}
                    </td>
                    <td className="px-3 py-1.5 text-right text-text-primary font-mono">
                      {r.total_control_messages}
                    </td>
                    <td className="px-3 py-1.5 text-right text-text-primary font-mono">
                      {r.total_packet_loss}
                    </td>
                    <td className="px-3 py-1.5 text-right text-text-primary font-mono">
                      {(r.total_overhead_bytes / 1000).toFixed(1)}KB
                    </td>
                  </tr>
                ))}
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
