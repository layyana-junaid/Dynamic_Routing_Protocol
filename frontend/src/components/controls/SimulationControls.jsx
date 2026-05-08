import { Play, Pause, RotateCcw, SkipForward, Square, Gauge } from 'lucide-react';
import useSimulation from '../../hooks/useSimulation';
import useSimulationStore from '../../store/simulationStore';

export default function SimulationControls() {
  const simState = useSimulationStore((s) => s.simState);
  const speed    = useSimulationStore((s) => s.speed);
  const { start, pause, stop, step, reset, changeSpeed } = useSimulation();

  const isRunning = simState === 'running';
  const isIdle    = simState === 'idle';

  return (
    <div style={{ display:'flex', alignItems:'center', gap:4 }}>
      {isRunning
        ? <CtrlBtn Icon={Pause} title="Pause" onClick={pause} />
        : <CtrlBtn Icon={Play}  title="Start" onClick={start} accent />
      }
      <CtrlBtn Icon={SkipForward} title="Step"  onClick={step} />
      <CtrlBtn Icon={Square}      title="Stop"  onClick={stop}  disabled={isIdle} />
      <CtrlBtn Icon={RotateCcw}   title="Reset" onClick={reset} />

      {/* Speed */}
      <div style={{ display:'flex', alignItems:'center', gap:6, marginLeft:8, paddingLeft:8, borderLeft:'1px solid rgba(124,58,237,0.2)' }}>
        <Gauge size={12} style={{ color:'#4a3f6b' }} />
        <select
          value={speed}
          onChange={(e) => changeSpeed(Number(e.target.value))}
          style={{
            fontFamily:  'Space Mono, monospace',
            fontSize:    9,
            background:  'rgba(124,58,237,0.08)',
            border:      '1px solid rgba(124,58,237,0.25)',
            color:       '#9d8ec4',
            padding:     '3px 6px',
            cursor:      'pointer',
            outline:     'none',
          }}
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

function CtrlBtn({ Icon, title, onClick, disabled, accent }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{
        display:    'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width:      30,
        height:     30,
        background: accent ? 'rgba(124,58,237,0.15)' : 'transparent',
        border:     accent ? '1px solid rgba(124,58,237,0.4)' : '1px solid rgba(124,58,237,0.15)',
        color:      accent ? '#9d4edd' : '#4a3f6b',
        cursor:     disabled ? 'not-allowed' : 'pointer',
        opacity:    disabled ? 0.3 : 1,
        transition: 'all 0.15s',
      }}
      onMouseEnter={e => { if (!disabled) { e.currentTarget.style.color='#e040fb'; e.currentTarget.style.borderColor='rgba(224,64,251,0.5)'; } }}
      onMouseLeave={e => { e.currentTarget.style.color = accent ? '#9d4edd' : '#4a3f6b'; e.currentTarget.style.borderColor = accent ? 'rgba(124,58,237,0.4)' : 'rgba(124,58,237,0.15)'; }}
    >
      <Icon size={14} />
    </button>
  );
}
