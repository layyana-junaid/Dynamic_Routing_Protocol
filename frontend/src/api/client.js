/**
 * API client — thin wrappers around fetch for the FastAPI backend.
 */

const BASE = '';  // proxied via Vite in dev

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`);
  return res.json();
}

// ── Topology ──────────────────────────────────────────────────────────

export const listTopologies   = () => request('/api/topology/list');
export const getTopology      = (id) => request(`/api/topology/${id}`);
export const loadTopology     = (id) => request(`/api/topology/load/${id}`, { method: 'POST' });
export const failLink         = (id) => request(`/api/topology/link/${id}/fail`, { method: 'POST' });
export const recoverLink      = (id) => request(`/api/topology/link/${id}/recover`, { method: 'POST' });
export const updateLinkCost   = (id, cost) => request(`/api/topology/link/${id}/cost?cost=${cost}`, { method: 'POST' });

// ── Simulation ────────────────────────────────────────────────────────

export const getSimState      = () => request('/api/simulation/state');
export const setProtocol      = (p) => request(`/api/simulation/protocol/${p}`, { method: 'POST' });
export const setSpeed         = (s) => request(`/api/simulation/speed?speed=${s}`, { method: 'POST' });
export const startSim         = () => request('/api/simulation/start', { method: 'POST' });
export const pauseSim         = () => request('/api/simulation/pause', { method: 'POST' });
export const stopSim          = () => request('/api/simulation/stop', { method: 'POST' });
export const stepSim          = () => request('/api/simulation/step', { method: 'POST' });
export const resetSim         = () => request('/api/simulation/reset', { method: 'POST' });
export const runComparison    = (linkId) => request(`/api/simulation/compare${linkId ? `?fail_link_id=${linkId}` : ''}`, { method: 'POST' });
export const getRoutingTable  = (rid) => request(`/api/simulation/routing-table/${rid}`);
export const getAllTables      = () => request('/api/simulation/routing-tables');
export const getEvents        = () => request('/api/simulation/events');

// ── Metrics ───────────────────────────────────────────────────────────

export const getMetrics       = () => request('/api/metrics/current');
export const getMetricsHistory = () => request('/api/metrics/history');

// ── Health ────────────────────────────────────────────────────────────

export const healthCheck      = () => request('/api/health');
