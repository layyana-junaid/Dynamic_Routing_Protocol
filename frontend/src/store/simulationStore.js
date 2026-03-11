import { create } from 'zustand';
import { PROTOCOL_COLORS } from '../utils/constants';

/**
 * Central application state — Zustand store.
 * All simulation data flows through here via WebSocket events and API calls.
 */
const useSimulationStore = create((set, get) => ({
  // ── Topology ──────────────────────────────────────────
  topology: null,
  topologyList: [],

  // ── Protocol ──────────────────────────────────────────
  selectedProtocol: 'OSPF',

  // ── Simulation state ──────────────────────────────────
  simState: 'idle',
  simStep: 0,
  speed: 1.0,

  // ── Selected elements ─────────────────────────────────
  selectedRouter: null,
  selectedLink: null,

  // ── Routing tables ────────────────────────────────────
  routingTables: {},

  // ── Packet animations ─────────────────────────────────
  animations: [],

  // ── Link statuses (overrides from events) ─────────────
  linkStatuses: {},

  // ── Metrics time-series ───────────────────────────────
  metricsHistory: [],
  latestMetrics: {},

  // ── Event log ─────────────────────────────────────────
  events: [],

  // ── Comparison results ────────────────────────────────
  comparisonResults: null,

  // ── Side panel visibility ─────────────────────────────
  showSidebar: true,
  showDetailPanel: true,
  bottomTab: 'log',   // log | metrics | comparison

  // ── Actions ───────────────────────────────────────────

  setTopology: (topology) => set({ topology }),
  setTopologyList: (list) => set({ topologyList: list }),
  setProtocol: (protocol) => set({ selectedProtocol: protocol }),
  setSimState: (simState) => set({ simState }),
  setSimStep: (step) => set({ simStep: step }),
  setSpeed: (speed) => set({ speed }),
  setSelectedRouter: (id) => set({ selectedRouter: id }),
  setSelectedLink: (id) => set({ selectedLink: id }),
  setRoutingTables: (tables) => set({ routingTables: tables }),
  setComparisonResults: (results) => set({ comparisonResults: results }),
  setBottomTab: (tab) => set({ bottomTab: tab }),
  toggleSidebar: () => set((s) => ({ showSidebar: !s.showSidebar })),
  toggleDetailPanel: () => set((s) => ({ showDetailPanel: !s.showDetailPanel })),

  // Process a single WebSocket event
  processEvent: (event) => {
    const state = get();

    switch (event.type) {
      case 'simulation_state':
        set({ simState: event.state });
        break;

      case 'packet_animation':
        set({
          animations: [
            ...state.animations,
            { ...event, createdAt: Date.now() },
          ],
        });
        // Auto-remove after 1.8s
        setTimeout(() => {
          set((s) => ({
            animations: s.animations.filter((a) => a.id !== event.id),
          }));
        }, 1800);
        break;

      case 'route_update':
        set((s) => {
          const tables = { ...s.routingTables };
          if (!tables[event.router_id]) tables[event.router_id] = [];
          // We'll refresh full table from API on selection; for now log it
          return {
            routingTables: tables,
            events: [event, ...s.events].slice(0, 500),
          };
        });
        break;

      case 'link_status':
        set((s) => ({
          linkStatuses: {
            ...s.linkStatuses,
            [event.link_id]: event.status,
          },
          events: [event, ...s.events].slice(0, 500),
        }));
        break;

      case 'convergence':
        set((s) => ({
          simState: 'converged',
          events: [event, ...s.events].slice(0, 500),
        }));
        break;

      case 'metrics_update':
        set((s) => ({
          latestMetrics: event,
          simStep: event.step || s.simStep,
          metricsHistory: [...s.metricsHistory, event].slice(-200),
        }));
        break;

      default:
        set((s) => ({
          events: [event, ...s.events].slice(0, 500),
        }));
    }
  },

  // Clear all simulation state for reset
  resetState: () =>
    set({
      simState: 'idle',
      simStep: 0,
      selectedRouter: null,
      selectedLink: null,
      routingTables: {},
      animations: [],
      linkStatuses: {},
      metricsHistory: [],
      latestMetrics: {},
      events: [],
      comparisonResults: null,
    }),
}));

export default useSimulationStore;
