import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { Server } from 'lucide-react';
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
    <div
      className={clsx(
        'relative flex flex-col items-center justify-center',
        'w-[72px] h-[72px] rounded-full',
        'bg-surface-card border-2 transition-all duration-300',
        isDown && 'opacity-40',
        isSelected
          ? 'shadow-elevated'
          : 'border-surface-border hover:border-text-tertiary shadow-soft'
      )}
      style={
        isSelected
          ? { borderColor: protocolColor, boxShadow: `0 0 16px ${protocolColor}20` }
          : undefined
      }
    >
      {/* Status dot */}
      <div
        className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-surface-card"
        style={{ backgroundColor: isDown ? '#ef4444' : '#22c55e' }}
      />

      <Server
        size={16}
        className="mb-0.5"
        style={{ color: isSelected ? protocolColor : '#6b7280' }}
      />
      <span className="text-[10px] font-semibold text-text-primary leading-tight">
        {label.replace('Router ', 'R')}
      </span>
      <span className="text-[8px] text-text-tertiary font-mono leading-tight">
        {ip}
      </span>
      {asNumber != null && (
        <span className="text-[7px] text-text-muted leading-tight">
          AS {asNumber}
        </span>
      )}

      {/* Invisible handles on all sides for flexible edge routing */}
      <Handle type="target" position={Position.Top} className="!w-0 !h-0 !border-0 !bg-transparent" />
      <Handle type="source" position={Position.Top} id="top" className="!w-0 !h-0 !border-0 !bg-transparent" />
      <Handle type="target" position={Position.Bottom} id="t-bottom" className="!w-0 !h-0 !border-0 !bg-transparent" />
      <Handle type="source" position={Position.Bottom} id="bottom" className="!w-0 !h-0 !border-0 !bg-transparent" />
      <Handle type="target" position={Position.Left} id="t-left" className="!w-0 !h-0 !border-0 !bg-transparent" />
      <Handle type="source" position={Position.Left} id="left" className="!w-0 !h-0 !border-0 !bg-transparent" />
      <Handle type="target" position={Position.Right} id="t-right" className="!w-0 !h-0 !border-0 !bg-transparent" />
      <Handle type="source" position={Position.Right} id="right" className="!w-0 !h-0 !border-0 !bg-transparent" />
    </div>
  );
}

export default memo(RouterNode);
