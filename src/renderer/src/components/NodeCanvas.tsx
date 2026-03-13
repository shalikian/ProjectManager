import React, { useCallback } from 'react'
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
import ImageSourceNode from './nodes/ImageSourceNode'
import FilterNode from './nodes/FilterNode'
import OutputNode from './nodes/OutputNode'

const nodeTypes = {
  imageSource: ImageSourceNode,
  filter: FilterNode,
  output: OutputNode
}

export default function NodeCanvas(): React.JSX.Element {
  const { nodes, edges, onNodesChange, onEdgesChange, setEdges } = useFlowStore()

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges(eds => addEdge(connection, eds))
    },
    [setEdges]
  )

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        className="bg-canvas-bg"
        proOptions={{ hideAttribution: true }}
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
