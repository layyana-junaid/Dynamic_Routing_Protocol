import { useMemo, useCallback } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useReactFlow,
  ReactFlowProvider,
} from 'reactflow';
import 'reactflow/dist/style.css';

import useSimulationStore from '../../store/simulationStore';
import RouterNode from './RouterNode';
import AnimatedEdge from './AnimatedEdge';
import PacketOverlay from './PacketOverlay';
import { PROTOCOL_COLORS } from '../../utils/constants';

const nodeTypes = { routerNode: RouterNode };
const edgeTypes = { animatedEdge: AnimatedEdge };

function TopologyFlow() {
  const topology = useSimulationStore((s) => s.topology);
  const linkStatuses = useSimulationStore((s) => s.linkStatuses);
  const selectedProtocol = useSimulationStore((s) => s.selectedProtocol);
  const selectedRouter = useSimulationStore((s) => s.selectedRouter);
  const setSelectedRouter = useSimulationStore((s) => s.setSelectedRouter);
  const animations = useSimulationStore((s) => s.animations);

  const protocolColor = PROTOCOL_COLORS[selectedProtocol] || '#6366f1';

  // Build React Flow nodes from topology data
  const nodes = useMemo(() => {
    if (!topology?.routers) return [];
    return topology.routers.map((r) => ({
      id: r.id,
      type: 'routerNode',
      position: { x: r.position.x, y: r.position.y },
      data: {
        label: r.label,
        ip: r.ip,
        status: r.status,
        asNumber: r.as_number,
        selected: r.id === selectedRouter,
        protocolColor,
      },
    }));
  }, [topology, selectedRouter, protocolColor]);

  // Build React Flow edges from topology data
  const edges = useMemo(() => {
    if (!topology?.links) return [];
    return topology.links.map((l) => {
      const status = linkStatuses[l.id] || l.status;
      return {
        id: l.id,
        source: l.source,
        target: l.target,
        type: 'animatedEdge',
        data: {
          cost: l.cost,
          status,
          source: l.source,
          target: l.target,
          protocolColor,
        },
      };
    });
  }, [topology, linkStatuses, protocolColor]);

  const onNodeClick = useCallback(
    (_, node) => setSelectedRouter(node.id),
    [setSelectedRouter]
  );

  const onPaneClick = useCallback(
    () => setSelectedRouter(null),
    [setSelectedRouter]
  );

  return (
    <div className="w-full h-full relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        fitView
        fitViewOptions={{ padding: 0.5 }}
        minZoom={0.2}
        maxZoom={1.5}
        defaultEdgeOptions={{ type: 'animatedEdge' }}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant="dots" gap={40} size={1} color="rgba(0, 210, 255, 0.1)" />
        <Controls
          showInteractive={false}
          className="!bottom-4 !left-4"
        />
        <MiniMap
          nodeColor={(n) => n.data?.selected ? protocolColor : '#1f2937'}
          className="!bottom-4 !right-4"
          style={{ width: 140, height: 90 }}
        />
      </ReactFlow>

      {/* Packet animation overlay */}
      <PacketOverlay nodes={nodes} animations={animations} />
    </div>
  );
}

export default function TopologyCanvas() {
  return (
    <ReactFlowProvider>
      <TopologyFlow />
    </ReactFlowProvider>
  );
}
