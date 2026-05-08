import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity, Cpu, TerminalSquare, Radio,
  PanelLeftClose, PanelLeftOpen, PanelRightClose,
} from 'lucide-react';
import useWebSocket from './hooks/useWebSocket';
import useSimulation from './hooks/useSimulation';
import useSimulationStore from './store/simulationStore';
import Sidebar from './components/layout/Sidebar';
import BottomPanel from './components/layout/BottomPanel';
import TopologyCanvas from './components/topology/TopologyCanvas';
import RouterDetail from './components/panels/RouterDetail';
import SimulationControls from './components/controls/SimulationControls';
import ProtocolSelector from './components/controls/ProtocolSelector';
import { SIM_STATES, PROTOCOL_COLORS } from './utils/constants';

export default function App() {
  useWebSocket();
  const { loadTopologyList, loadTopology } = useSimulation();
  const showSidebar     = useSimulationStore((s) => s.showSidebar);
  const showDetailPanel = useSimulationStore((s) => s.showDetailPanel);
  const toggleSidebar   = useSimulationStore((s) => s.toggleSidebar);
  const toggleDetailPanel = useSimulationStore((s) => s.toggleDetailPanel);
  const selectedRouter  = useSimulationStore((s) => s.selectedRouter);
  const simState        = useSimulationStore((s) => s.simState);
  const simStep         = useSimulationStore((s) => s.simStep);
  const selectedProtocol = useSimulationStore((s) => s.selectedProtocol);

  const stateInfo   = SIM_STATES[simState] || SIM_STATES.idle;
  const protoColor  = PROTOCOL_COLORS[selectedProtocol] || '#7c3aed';

  useEffect(() => {
    loadTopologyList();
    loadTopology('medium_6');
  }, []);

  return (
    /* ── ROOT: flex column, nothing absolute, nothing overlaps ── */
    <div style={{ display:'flex', flexDirection:'column', height:'100vh', width:'100vw', overflow:'hidden' }}>

      {/* ═══════════════════════════════════════════════════════
          HEADER  — spans full width, fixed height
      ═══════════════════════════════════════════════════════ */}
      <header className="app-header" style={{ flexShrink: 0 }}>

        {/* Brand */}
        <span className="wordmark">NETPULSE</span>
        <div className="header-sep" />

        {/* Protocol picker */}
        <ProtocolSelector />
        <div className="header-sep" />

        {/* Live status */}
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div
            className="led"
            style={{
              background: stateInfo.color,
              boxShadow: `0 0 8px ${stateInfo.color}`,
              animation: simState === 'running' ? 'blink 0.8s infinite' : 'blink 2s infinite',
            }}
          />
          <span style={{ fontFamily:'Space Mono', fontSize:9, letterSpacing:'0.3em', textTransform:'uppercase', color:'#9d8ec4' }}>
            {stateInfo.label}
          </span>
          <span style={{ fontFamily:'Space Mono', fontSize:9, color:'#4a3f6b', marginLeft:6 }}>
            STP:{String(simStep).padStart(4,'0')}
          </span>
        </div>

        <div className="header-sep" />
        <SimulationControls />

        {/* Spacer */}
        <div style={{ flex:1 }} />

        {/* Sidebar toggles */}
        <button
          onClick={toggleSidebar}
          className="btn-neon"
          style={{ padding:'6px 10px' }}
          title="Toggle left panel"
        >
          {showSidebar ? <PanelLeftClose size={14} /> : <PanelLeftOpen size={14} />}
        </button>
        <button
          onClick={toggleDetailPanel}
          className="btn-neon"
          style={{ padding:'6px 10px', borderColor:'rgba(224,64,251,0.4)', color:'#e040fb', background:'rgba(224,64,251,0.08)' }}
          title="Toggle right panel"
        >
          <PanelRightClose size={14} />
        </button>
      </header>

      {/* ═══════════════════════════════════════════════════════
          BODY  — flex row, grows to fill remaining space
      ═══════════════════════════════════════════════════════ */}
      <div style={{ flex:1, display:'flex', overflow:'hidden', minHeight:0 }}>

        {/* ── LEFT: Config panel ─────────────────────────────── */}
        <AnimatePresence initial={false}>
          {showSidebar && (
            <motion.aside
              key="sidebar"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: 'easeInOut' }}
              style={{ flexShrink:0, overflow:'hidden', display:'flex', flexDirection:'column', borderRight:'1px solid var(--border-col)' }}
              className="panel"
            >
              <div style={{ width:320, display:'flex', flexDirection:'column', height:'100%' }}>
                <div className="panel-header">
                  <div className="led led-violet" />
                  <span className="panel-label">Control Plane</span>
                  <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:6 }}>
                    <Cpu size={12} style={{ color:'#7c3aed' }} />
                  </div>
                </div>
                <div style={{ flex:1, overflowY:'auto', padding:'12px' }}>
                  <Sidebar />
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* ── CENTER: Canvas + bottom analytics ─────────────── */}
        <div style={{ flex:1, display:'flex', flexDirection:'column', minWidth:0, overflow:'hidden', position:'relative' }}>

          {/* Canvas background layer (dots live here) */}
          <div className="app-canvas" style={{ position:'absolute', inset:0, zIndex:0 }} />

          {/* Topology */}
          <div style={{ flex:1, position:'relative', zIndex:1 }}>
            <TopologyCanvas />
          </div>

          {/* Bottom panel */}
          <div
            style={{ flexShrink:0, height:220, zIndex:2, position:'relative', borderTop:'1px solid var(--border-col)' }}
            className="panel"
          >
            <div className="panel-header">
              <div className="led led-cyan" />
              <span className="panel-label">Data Stream</span>
              <div style={{ marginLeft:'auto', display:'flex', gap:8 }}>
                <span className="tag tag-violet">RIP</span>
                <span className="tag tag-cyan">OSPF</span>
                <span className="tag tag-pink">EIGRP</span>
                <span className="tag tag-green">BGP</span>
              </div>
            </div>
            <div style={{ padding:'8px', height:'calc(100% - 37px)', overflow:'hidden' }}>
              <BottomPanel />
            </div>
          </div>
        </div>

        {/* ── RIGHT: Telemetry panel ─────────────────────────── */}
        <AnimatePresence initial={false}>
          {showDetailPanel && selectedRouter && (
            <motion.aside
              key="detail"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 360, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: 'easeInOut' }}
              style={{ flexShrink:0, overflow:'hidden', display:'flex', flexDirection:'column', borderLeft:'1px solid rgba(224,64,251,0.25)' }}
              className="panel"
            >
              <div style={{ width:360, display:'flex', flexDirection:'column', height:'100%' }}>
                <div className="panel-header" style={{ borderBottomColor:'rgba(224,64,251,0.2)', background:'rgba(224,64,251,0.06)' }}>
                  <div className="led led-pink" />
                  <span className="panel-label" style={{ color:'#e040fb' }}>Node Analysis</span>
                  <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:6 }}>
                    <Activity size={12} style={{ color:'#e040fb' }} />
                  </div>
                </div>
                <div style={{ flex:1, overflowY:'auto', padding:'16px' }}>
                  <RouterDetail />
                </div>
                {/* Gradient accent at bottom */}
                <div style={{ height:2, background:'linear-gradient(90deg, #7c3aed, #e040fb, #00e5ff)', flexShrink:0 }} />
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

      </div>{/* END BODY */}
    </div>/* END ROOT */
  );
}
