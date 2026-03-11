import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import useSimulationStore from '../../store/simulationStore';
import { PROTOCOL_COLORS } from '../../utils/constants';

export default function OverheadChart() {
  const metricsHistory = useSimulationStore((s) => s.metricsHistory);
  const protocol = useSimulationStore((s) => s.selectedProtocol);
  const color = PROTOCOL_COLORS[protocol] || '#818cf8';

  const data = metricsHistory.map((m) => ({
    step: m.step,
    messages: m.control_messages || 0,
  }));

  return (
    <div className="h-full flex flex-col">
      <h5 className="text-[10px] font-semibold text-text-secondary uppercase tracking-wider mb-1 px-1">
        Control Overhead (messages)
      </h5>
      <div className="flex-1 bg-surface-card border border-surface-border rounded-xl p-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
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
              width={30}
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
            <Bar
              dataKey="messages"
              fill={color}
              fillOpacity={0.5}
              radius={[3, 3, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
