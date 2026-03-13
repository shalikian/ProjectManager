import React, { useCallback, useMemo } from 'react'
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  Connection,
  addEdge
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useFlowStore } from '../store/flow-store'
import { buildNodeTypes } from './nodes/nodeTypeRegistry'
import type { NodeDefinition } from '../../../shared/types'

const SNAP_GRID: [number, number] = [16, 16]

/** Currently registered plugin definitions passed from outside, or empty array. */
const EMPTY_DEFINITIONS: NodeDefinition[] = []

export default function Canvas(): React.JSX.Element {
  const { nodes, edges, onNodesChange, onEdgesChange, setEdges } = useFlowStore()

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges(eds => addEdge(connection, eds))
    },
    [setEdges]
  )

  // Build nodeTypes once from static definitions.
  // In a future iteration this will be driven by the live NodeRegistry.
  const nodeTypes = useMemo(() => buildNodeTypes(EMPTY_DEFINITIONS), [])

  return (
    <div className="w-full h-full" data-testid="canvas">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        colorMode="dark"
        snapToGrid
        snapGrid={SNAP_GRID}
        className="bg-canvas-bg"
        proOptions={{ hideAttribution: true }}
        minZoom={0.1}
        maxZoom={4}
      >
        <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="#313244" />
        <Controls showInteractive={false} />
        <MiniMap
          nodeColor="#313244"
          maskColor="rgba(26, 26, 46, 0.8)"
          style={{ background: '#1e1e2e' }}
        />
      </ReactFlow>
    </div>
  )
}
