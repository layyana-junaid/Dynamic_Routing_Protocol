import { motion, AnimatePresence } from 'framer-motion';
import { useViewport } from 'reactflow';

/**
 * Renders animated packet dots travelling between routers.
 * Overlaid on the React Flow canvas with pointer-events disabled.
 */
export default function PacketOverlay({ nodes, animations }) {
  const viewport = useViewport();

  const getScreenPos = (nodeId) => {
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return null;
    const nx = node.position.x + 36; // half node width
    const ny = node.position.y + 36; // half node height
    return {
      x: nx * viewport.zoom + viewport.x,
      y: ny * viewport.zoom + viewport.y,
    };
  };

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
      <AnimatePresence>
        {animations.map((anim) => {
          const from = getScreenPos(anim.from);
          const to = getScreenPos(anim.to);
          if (!from || !to) return null;

          return (
            <motion.div
              key={anim.id}
              className="absolute rounded-full"
              style={{
                width: 8 * viewport.zoom,
                height: 8 * viewport.zoom,
                backgroundColor: anim.color || '#4f6df5',
                boxShadow: `0 0 ${8 * viewport.zoom}px ${(anim.color || '#4f6df5')}40`,
              }}
              initial={{ x: from.x - 4, y: from.y - 4, opacity: 0, scale: 0.5 }}
              animate={{ x: to.x - 4, y: to.y - 4, opacity: [0, 0.9, 0.9, 0], scale: [0.5, 1, 1, 0.5] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5, ease: 'easeInOut' }}
            />
          );
        })}
      </AnimatePresence>

      {/* Labels on active animations */}
      <AnimatePresence>
        {animations.map((anim) => {
          const from = getScreenPos(anim.from);
          const to = getScreenPos(anim.to);
          if (!from || !to || !anim.label) return null;
          const mx = (from.x + to.x) / 2;
          const my = (from.y + to.y) / 2 - 14;

          return (
            <motion.div
              key={`label-${anim.id}`}
              className="absolute text-[9px] font-mono px-1.5 py-0.5 rounded-md bg-surface-card/95 shadow-soft border border-surface-border-light whitespace-nowrap"
              style={{ color: anim.color || '#4f6df5' }}
              initial={{ x: mx - 30, y: my, opacity: 0 }}
              animate={{ x: mx - 30, y: my, opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {anim.label}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
