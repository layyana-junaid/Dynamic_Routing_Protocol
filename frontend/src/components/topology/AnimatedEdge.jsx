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
          x={labelX - 18}
          y={labelY - 12}
          width={36}
          height={24}
          className="pointer-events-none"
        >
          <div className="flex items-center justify-center w-full h-full">
            <span
              className="text-[13px] font-bold font-mono px-2 py-0.5 rounded-md bg-[#16132d] border border-[#7c3aed44] text-[#00e5ff] shadow-[0_0_10px_rgba(0,229,255,0.2)]"
              style={isDown ? { color: '#ef4444', textDecoration: 'line-through', borderColor: '#ef4444' } : undefined}
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
