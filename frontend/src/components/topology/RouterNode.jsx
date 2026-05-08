import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { Server, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import clsx from 'clsx';

/**
 * Custom React Flow node representing a router.
 * Shows router label, IP, AS number, and a status indicator.
 */
function RouterNode({ data, selected }) {
  const { label, ip, status, asNumber, protocolColor } = data;
  const isDown = status === 'down';
  const isSelected = data.selected || selected;

  return (
    <motion.div
      whileHover={{ scale: 1.1, rotateY: 10, rotateX: -5 }}
      transition={{ type: 'spring', stiffness: 300, damping: 10 }}
      className={clsx(
        'relative group flex flex-col items-center justify-center p-3',
        'w-24 h-24 rounded-2xl transition-all duration-500',
        'glass border-2',
        isDown ? 'opacity-30 grayscale' : 'opacity-100',
        isSelected
          ? 'shadow-glow-blue z-10'
          : 'border-surface-border-light hover:border-accent-primary/50'
      )}
      style={{
        borderColor: isSelected ? protocolColor : undefined,
        boxShadow: isSelected ? `0 0 20px ${protocolColor}40` : undefined,
        transformStyle: 'preserve-3d',
      }}
    >
      {/* Decorative corners */}
      <div className="absolute top-1 left-1 w-2 h-2 border-t border-l border-accent-primary opacity-50" />
      <div className="absolute top-1 right-1 w-2 h-2 border-t border-r border-accent-primary opacity-50" />
      <div className="absolute bottom-1 left-1 w-2 h-2 border-b border-l border-accent-primary opacity-50" />
      <div className="absolute bottom-1 right-1 w-2 h-2 border-b border-r border-accent-primary opacity-50" />

      {/* Status Ring */}
      <div 
        className={clsx(
          "absolute inset-0 rounded-2xl border-2 opacity-20",
          !isDown && "animate-pulse"
        )}
        style={{ borderColor: isDown ? '#ef4444' : protocolColor || '#00d2ff' }}
      />

      {/* Main Icon */}
      <div className={clsx(
        "p-2 rounded-xl bg-surface-base border border-surface-border-light mb-1 shadow-inner",
        !isDown && "animate-neon"
      )} style={{ '--glow-color': protocolColor || '#00d2ff' }}>
        {isDown ? <Zap size={18} className="text-accent-warning" /> : <Server size={18} style={{ color: protocolColor || '#00d2ff' }} />}
      </div>

      {/* Text Labels */}
      <div className="flex flex-col items-center">
        <span className="text-[11px] font-bold text-text-primary tracking-widest uppercase">
          {label.replace('Router ', 'R')}
        </span>
        <span className="text-[8px] text-accent-primary font-mono opacity-80">
          {ip}
        </span>
        {asNumber != null && (
          <span className="text-[7px] text-text-tertiary font-mono bg-surface-base px-1.5 rounded-full mt-0.5 border border-surface-border-light">
            AS-{asNumber}
          </span>
        )}
      </div>

      {/* Handles */}
      <Handle type="target" position={Position.Top} className="!opacity-0" />
      <Handle type="source" position={Position.Top} id="top" className="!opacity-0" />
      <Handle type="target" position={Position.Bottom} id="t-bottom" className="!opacity-0" />
      <Handle type="source" position={Position.Bottom} id="bottom" className="!opacity-0" />
      <Handle type="target" position={Position.Left} id="t-left" className="!opacity-0" />
      <Handle type="source" position={Position.Left} id="left" className="!opacity-0" />
      <Handle type="target" position={Position.Right} id="t-right" className="!opacity-0" />
      <Handle type="source" position={Position.Right} id="right" className="!opacity-0" />
    </motion.div>
  );
}

export default memo(RouterNode);
