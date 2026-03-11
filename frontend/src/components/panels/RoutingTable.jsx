import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { PROTOCOL_COLORS } from '../../utils/constants';

/**
 * Compact, readable routing table for a single router.
 */
export default function RoutingTable({ entries, protocol }) {
  const color = PROTOCOL_COLORS[protocol] || '#818cf8';

  if (!entries || entries.length === 0) {
    return (
      <p className="text-xs text-text-muted italic py-4 text-center">
        No routes yet — start the simulation
      </p>
    );
  }

  return (
    <div className="rounded-xl overflow-hidden border border-surface-border shadow-soft">
      <table className="w-full text-[11px]">
        <thead>
          <tr className="bg-surface-hover text-text-secondary uppercase tracking-wider">
            <th className="text-left px-3 py-2 font-medium">Destination</th>
            <th className="text-left px-3 py-2 font-medium">Next Hop</th>
            <th className="text-right px-3 py-2 font-medium">Metric</th>
          </tr>
        </thead>
        <tbody>
          <AnimatePresence>
            {entries.map((entry, idx) => (
              <motion.tr
                key={`${entry.destination}-${entry.next_hop}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2, delay: idx * 0.03 }}
                className={clsx(
                  'border-t border-surface-border-light hover:bg-surface-hover/50 transition',
                  idx % 2 === 0 ? 'bg-surface-card' : 'bg-surface-panel'
                )}
              >
                <td className="px-3 py-1.5 text-text-primary font-mono">
                  {entry.destination}
                </td>
                <td className="px-3 py-1.5 text-text-secondary font-mono">
                  {entry.next_hop || entry.next_hop_id || '—'}
                </td>
                <td className="px-3 py-1.5 text-right font-mono font-medium" style={{ color }}>
                  {typeof entry.metric === 'number'
                    ? entry.metric.toLocaleString()
                    : entry.metric}
                </td>
              </motion.tr>
            ))}
          </AnimatePresence>
        </tbody>
      </table>

      {/* Extra columns for BGP */}
      {protocol === 'BGP' && entries.some((e) => e.as_path) && (
        <div className="border-t border-surface-border px-3 py-2">
          <p className="text-[10px] text-text-secondary font-semibold uppercase mb-1">
            AS Path Details
          </p>
          {entries.map((e) => (
            <div key={e.destination} className="flex justify-between text-[10px] py-0.5">
              <span className="text-text-secondary font-mono">{e.destination}</span>
              <span className="text-purple-600 font-mono">{e.as_path || '—'}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
