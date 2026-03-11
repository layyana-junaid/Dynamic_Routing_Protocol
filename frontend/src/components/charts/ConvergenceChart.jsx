import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import useSimulationStore from '../../store/simulationStore';
import { PROTOCOL_COLORS } from '../../utils/constants';

export default function ConvergenceChart() {
  const metricsHistory = useSimulationStore((s) => s.metricsHistory);
  const protocol = useSimulationStore((s) => s.selectedProtocol);
  const color = PROTOCOL_COLORS[protocol] || '#818cf8';

  const data = metricsHistory.map((m) => ({
    step: m.step,
    time: m.convergence_time || 0,
    converged: m.converged ? 1 : 0,
  }));

  return (
    <div className="h-full flex flex-col">
      <h5 className="text-[10px] font-semibold text-text-secondary uppercase tracking-wider mb-1 px-1">
        Convergence Time
      </h5>
      <div className="flex-1 bg-surface-card border border-surface-border rounded-xl p-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="convGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.15} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="step"
              tick={{ fontSize: 9, fill: '#9ca3af' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 9, fill: '#9ca3af' }}
              axisLine={false}
              tickLine={false}
              width={32}
            />
            <Tooltip
              contentStyle={{
                background: '#ffffff',
                border: '1px solid #d8dee9',
                borderRadius: 8,
                fontSize: 11,
              }}
              labelStyle={{ color: '#1f2937' }}
            />
            <Area
              type="monotone"
              dataKey="time"
              stroke={color}
              fillOpacity={1}
              fill="url(#convGrad)"
              strokeWidth={1.5}
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
