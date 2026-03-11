import { memo } from 'react';
import { getStraightPath } from 'reactflow';

/**
 * Custom React Flow edge with:
 * - cost label at midpoint
 * - red dashed style when link is down
 * - protocol-colored highlight
 */
function AnimatedEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  data,
  style,
}) {
  const isDown = data?.status === 'down';
  const cost = data?.cost;

  const [edgePath, labelX, labelY] = getStraightPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
  });

  const strokeColor = isDown ? '#ef4444' : '#b0b8c4';

  return (
    <g>
      {/* Main edge line */}
      <path
        id={id}
        className="react-flow__edge-path"
        d={edgePath}
        style={{
          stroke: strokeColor,
          strokeWidth: isDown ? 1.5 : 1.5,
          strokeDasharray: isDown ? '6,4' : 'none',
          opacity: isDown ? 0.5 : 0.7,
          fill: 'none',
          ...style,
        }}
      />

      {/* Wider invisible path for easier mouse targeting */}
      <path
        d={edgePath}
        style={{
          stroke: 'transparent',
          strokeWidth: 20,
          fill: 'none',
        }}
      />

      {/* Cost badge */}
      {cost != null && (
        <foreignObject
          x={labelX - 14}
          y={labelY - 10}
          width={28}
          height={20}
          className="pointer-events-none"
        >
          <div className="flex items-center justify-center w-full h-full">
            <span
              className="text-[10px] font-mono px-1 rounded-md bg-surface-card/90 text-text-secondary shadow-soft"
              style={isDown ? { color: '#ef4444', textDecoration: 'line-through' } : undefined}
            >
              {cost}
            </span>
          </div>
        </foreignObject>
      )}
    </g>
  );
}

export default memo(AnimatedEdge);
