/**
 * Protocol color and display constants.
 */

export const PROTOCOLS = ['RIP', 'OSPF', 'EIGRP', 'BGP'];

export const PROTOCOL_COLORS = {
  RIP:   '#22c55e',
  OSPF:  '#3b82f6',
  EIGRP: '#f59e0b',
  BGP:   '#a855f7',
};

export const PROTOCOL_INFO = {
  RIP: {
    name: 'RIP',
    fullName: 'Routing Information Protocol',
    type: 'Distance Vector',
    metric: 'Hop Count',
    color: '#22c55e',
    description: 'Simple distance-vector protocol using hop count as metric (max 15 hops).',
  },
  OSPF: {
    name: 'OSPF',
    fullName: 'Open Shortest Path First',
    type: 'Link State',
    metric: 'Cost (BW)',
    color: '#3b82f6',
    description: 'Link-state protocol using Dijkstra\'s SPF algorithm with cost metric.',
  },
  EIGRP: {
    name: 'EIGRP',
    fullName: 'Enhanced Interior Gateway Routing Protocol',
    type: 'Advanced Distance Vector',
    metric: 'Composite (BW + Delay)',
    color: '#f59e0b',
    description: 'Hybrid protocol using DUAL algorithm with composite metric and feasible successors.',
  },
  BGP: {
    name: 'BGP',
    fullName: 'Border Gateway Protocol',
    type: 'Path Vector',
    metric: 'AS Path Length',
    color: '#a855f7',
    description: 'Path-vector inter-AS protocol using AS_PATH for loop prevention.',
  },
};

export const PACKET_COLORS = {
  RIP_UPDATE:   '#22c55e',
  LSA:          '#3b82f6',
  EIGRP_UPDATE: '#f59e0b',
  EIGRP_QUERY:  '#ef4444',
  BGP_UPDATE:   '#a855f7',
  BGP_WITHDRAW: '#ef4444',
};

export const SIM_STATES = {
  idle:      { label: 'Idle',      color: '#9ca3af' },
  running:   { label: 'Running',   color: '#22c55e' },
  paused:    { label: 'Paused',    color: '#f59e0b' },
  converged: { label: 'Converged', color: '#3b82f6' },
  stopped:   { label: 'Stopped',   color: '#ef4444' },
};
