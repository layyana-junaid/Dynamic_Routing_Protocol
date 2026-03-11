import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  Square,
  Gauge,
} from 'lucide-react';
import clsx from 'clsx';
import useSimulation from '../../hooks/useSimulation';
import useSimulationStore from '../../store/simulationStore';

export default function SimulationControls() {
  const simState = useSimulationStore((s) => s.simState);
  const speed = useSimulationStore((s) => s.speed);
  const { start, pause, stop, step, reset, changeSpeed } = useSimulation();

  const isRunning = simState === 'running';
  const isIdle = simState === 'idle';

  return (
    <div className="flex items-center gap-1.5">
      {/* Play / Pause */}
      {isRunning ? (
        <CtrlBtn icon={Pause} title="Pause" onClick={pause} />
      ) : (
        <CtrlBtn icon={Play} title="Start" onClick={start} accent />
      )}

      {/* Step */}
      <CtrlBtn icon={SkipForward} title="Step" onClick={step} />

      {/* Stop */}
      <CtrlBtn icon={Square} title="Stop" onClick={stop} disabled={isIdle} />

      {/* Reset */}
      <CtrlBtn icon={RotateCcw} title="Reset" onClick={reset} />

      {/* Speed control */}
      <div className="flex items-center gap-1.5 ml-2 pl-2 border-l border-surface-border">
        <Gauge size={13} className="text-text-tertiary" />
        <select
          value={speed}
          onChange={(e) => changeSpeed(Number(e.target.value))}
          className="bg-surface-card border border-surface-border rounded px-1.5 py-0.5 text-[11px] text-text-primary focus:outline-none"
        >
          <option value={2}>0.5×</option>
          <option value={1}>1×</option>
          <option value={0.5}>2×</option>
          <option value={0.25}>4×</option>
        </select>
      </div>
    </div>
  );
}

function CtrlBtn({ icon: Icon, title, onClick, disabled, accent }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={clsx(
        'p-1.5 rounded-lg transition',
        disabled && 'opacity-30 cursor-not-allowed',
        accent
          ? 'bg-accent-primary/10 text-accent-primary hover:bg-accent-primary/20'
          : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
      )}
    >
      <Icon size={15} />
    </button>
  );
}
