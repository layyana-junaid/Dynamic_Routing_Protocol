import clsx from 'clsx';
import useSimulation from '../../hooks/useSimulation';
import useSimulationStore from '../../store/simulationStore';
import { PROTOCOLS, PROTOCOL_COLORS } from '../../utils/constants';

/**
 * Segmented pill selector for choosing the active routing protocol.
 */
export default function ProtocolSelector() {
  const selected = useSimulationStore((s) => s.selectedProtocol);
  const { changeProtocol } = useSimulation();

  return (
    <div className="flex items-center bg-surface-hover rounded-xl p-0.5 gap-0.5">
      {PROTOCOLS.map((p) => {
        const active = selected === p;
        const color = PROTOCOL_COLORS[p];
        return (
          <button
            key={p}
            onClick={() => changeProtocol(p)}
            className={clsx(
              'px-3 py-1 rounded-lg text-[11px] font-semibold tracking-wide transition-all duration-200',
              active
                ? 'bg-surface-card shadow-soft'
                : 'text-text-tertiary hover:text-text-primary'
            )}
            style={
              active
                ? { color }
                : undefined
            }
          >
            {p}
          </button>
        );
      })}
    </div>
  );
}
