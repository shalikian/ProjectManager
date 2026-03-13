import React, { useCallback, useMemo, useRef } from 'react'
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  Connection,
  addEdge,
  EdgeTypes,
  OnConnectStart,
  OnConnectEnd
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useFlowStore } from '../store/flow-store'
import { buildNodeTypes } from './nodes/nodeTypeRegistry'
import TypedEdge from './TypedEdge'
import { validateConnection, buildTypedEdgeData } from '../utils/connection-utils'
import type { NodeDefinition } from '../../../shared/types'

const SNAP_GRID: [number, number] = [16, 16]

/** Currently registered plugin definitions passed from outside, or empty array. */
const EMPTY_DEFINITIONS: NodeDefinition[] = []

/** Edge types registered with React Flow. */
const EDGE_TYPES: EdgeTypes = { typed: TypedEdge }

/** CSS class applied to handles that are invalid drop targets during drag. */
const INVALID_HANDLE_CLASS = 'handle-invalid-target'

/** Adds/removes the invalid-target class on all handles during a connection drag. */
function applyHandleHighlight(active: boolean): void {
  const handles = document.querySelectorAll('.react-flow__handle')
  handles.forEach(el => {
    if (active) {
      el.classList.add(INVALID_HANDLE_CLASS)
    } else {
      el.classList.remove(INVALID_HANDLE_CLASS)
    }
  })
}

export default function Canvas(): React.JSX.Element {
  const { nodes, edges, onNodesChange, onEdgesChange, setEdges } = useFlowStore()
  const isDraggingRef = useRef(false)

  const isValidConnection = useCallback(
    (connection: Connection) => validateConnection(connection, nodes, edges),
    [nodes, edges]
  )

  const onConnect = useCallback(
    (connection: Connection) => {
      const edgeData = buildTypedEdgeData(connection, nodes)
      setEdges(eds =>
        addEdge(
          {
            ...connection,
            type: 'typed',
            animated: true,
            data: edgeData
          },
          eds
        )
      )
    },
    [nodes, setEdges]
  )

  const onConnectStart: OnConnectStart = useCallback(() => {
    isDraggingRef.current = true
    applyHandleHighlight(true)
  }, [])

  const onConnectEnd: OnConnectEnd = useCallback(() => {
    isDraggingRef.current = false
    applyHandleHighlight(false)
  }, [])

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
        onConnectStart={onConnectStart}
        onConnectEnd={onConnectEnd}
        isValidConnection={isValidConnection}
        nodeTypes={nodeTypes}
        edgeTypes={EDGE_TYPES}
        defaultEdgeOptions={{ type: 'typed', animated: true }}
        fitView
        colorMode="dark"
        snapToGrid
        snapGrid={SNAP_GRID}
        className="bg-canvas-bg"
        proOptions={{ hideAttribution: true }}
        minZoom={0.1}
        maxZoom={4}
        deleteKeyCode="Delete"
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
