import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import useSimulationStore from '../../store/simulationStore';

export default function PacketLossChart() {
  const metricsHistory = useSimulationStore((s) => s.metricsHistory);

  const data = metricsHistory.map((m) => ({
    step: m.step,
    loss: m.packet_loss || 0,
  }));

  return (
    <div className="h-full flex flex-col">
      <h5 className="text-[10px] font-semibold text-text-secondary uppercase tracking-wider mb-1 px-1">
        Packet Loss
      </h5>
      <div className="flex-1 bg-surface-card border border-surface-border rounded-xl p-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
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
              width={25}
            />
            <Tooltip
              contentStyle={{
                background: 'rgba(13, 11, 30, 0.98)',
                border: '1px solid rgba(239, 68, 68, 0.5)',
                borderRadius: 8,
                fontSize: 10,
                boxShadow: '0 0 15px rgba(239, 68, 68, 0.2)',
              }}
              itemStyle={{ color: '#ef4444', fontWeight: 'bold' }}
              labelStyle={{ color: '#9d8ec4', marginBottom: 4, fontSize: 9 }}
            />
            <Line
              type="stepAfter"
              dataKey="loss"
              stroke="#ef4444"
              strokeWidth={1.5}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
