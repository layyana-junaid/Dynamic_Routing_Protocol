import { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRightLeft,
  AlertTriangle,
  CheckCircle2,
  Radio,
  Link2,
} from 'lucide-react';
import useSimulationStore from '../../store/simulationStore';
import { PROTOCOL_COLORS } from '../../utils/constants';

const EVENT_ICONS = {
  route_update: ArrowRightLeft,
  link_status: Link2,
  convergence: CheckCircle2,
  packet_animation: Radio,
  metrics_update: null,
};

const EVENT_COLORS = {
  add: '#22c55e',
  update: '#f59e0b',
  remove: '#ef4444',
  down: '#ef4444',
  up: '#22c55e',
  init: '#9ca3af',
};

export default function EventLog() {
  const events = useSimulationStore((s) => s.events);
  const scrollRef = useRef(null);

  // Filter out metrics_update (too noisy) and packet_animation events
  const displayEvents = events.filter(
    (e) => e.type !== 'metrics_update' && e.type !== 'packet_animation'
  );

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [displayEvents.length]);

  return (
    <div ref={scrollRef} className="h-full overflow-y-auto px-3 py-2 space-y-0.5">
      {displayEvents.length === 0 ? (
        <p className="text-xs text-text-muted italic text-center py-6">
          No events yet — start or step the simulation
        </p>
      ) : (
        <AnimatePresence initial={false}>
          {displayEvents.slice(0, 100).map((event, idx) => (
            <EventRow key={idx} event={event} />
          ))}
        </AnimatePresence>
      )}
    </div>
  );
}

function EventRow({ event }) {
  const Icon = EVENT_ICONS[event.type] || AlertTriangle;
  if (!Icon) return null;

  const action = event.action || event.status || event.type;
  const color = EVENT_COLORS[action] || '#94a3b8';

  let message = '';
  switch (event.type) {
    case 'route_update':
      message = `${event.router_id}: ${event.action} route to ${event.destination} via ${event.next_hop || '—'} (metric ${event.metric})`;
      break;
    case 'link_status':
      message = `Link ${event.source}—${event.target} is ${event.status}`;
      break;
    case 'convergence':
      message = `${event.protocol} converged at step ${event.step} (${event.time_ms}ms)`;
      break;
    default:
      message = JSON.stringify(event).slice(0, 120);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-start gap-2 py-1 px-2 rounded-md hover:bg-surface-hover/50 transition text-[11px]"
    >
      <Icon size={12} style={{ color, marginTop: 2, flexShrink: 0 }} />
      <span className="text-text-secondary leading-relaxed">{message}</span>
    </motion.div>
  );
}
