import useSimulation from '../../hooks/useSimulation';
import useSimulationStore from '../../store/simulationStore';
import { PROTOCOLS, PROTOCOL_COLORS } from '../../utils/constants';

/**
 * Segmented protocol selector — fits inside the new header.
 */
export default function ProtocolSelector() {
  const selected = useSimulationStore((s) => s.selectedProtocol);
  const { changeProtocol } = useSimulation();

  return (
    <div style={{ display:'flex', alignItems:'center', gap:4, background:'rgba(124,58,237,0.08)', border:'1px solid rgba(124,58,237,0.2)', padding:'3px' }}>
      {PROTOCOLS.map((p) => {
        const active = selected === p;
        const color  = PROTOCOL_COLORS[p] || '#7c3aed';
        return (
          <button
            key={p}
            onClick={() => changeProtocol(p)}
            style={{
              fontFamily:    'Space Mono, monospace',
              fontSize:      9,
              fontWeight:    700,
              letterSpacing: '0.25em',
              textTransform: 'uppercase',
              padding:       '5px 12px',
              cursor:        'pointer',
              transition:    'all 0.15s',
              background:    active ? `${color}22` : 'transparent',
              border:        active ? `1px solid ${color}66` : '1px solid transparent',
              color:         active ? color : '#4a3f6b',
              boxShadow:     active ? `0 0 12px ${color}44` : 'none',
            }}
          >
            {p}
          </button>
        );
      })}
    </div>
  );
}
