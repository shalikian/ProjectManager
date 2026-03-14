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
import { useUiStore } from '../store/ui-store'
import { buildNodeTypes } from './nodes/nodeTypeRegistry'
import TypedEdge from './TypedEdge'
import { validateConnection, buildTypedEdgeData } from '../utils/connection-utils'
import type { NodeDefinition } from '../../../shared/types'
import { useCanvasInteractions } from './canvas/useCanvasInteractions'
import ContextMenu from './canvas/ContextMenu'
import TabSearch from './canvas/TabSearch'
import WorkflowController from './workflow/WorkflowController'

const SNAP_GRID: [number, number] = [16, 16]

/** Style for the in-progress connection line while dragging. Matches the final edge style. */
const CONNECTION_LINE_STYLE: React.CSSProperties = {
  stroke: '#666666',
  strokeWidth: 1.5
}

/** Duration in ms for the connection-rejected animation. */
const REJECTION_ANIMATION_MS = 350

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

/**
 * Applies the connection-rejected CSS class to the given element for a brief
 * duration, producing the shake animation defined in globals.css.
 */
export function triggerRejectionAnimation(el: HTMLElement, durationMs: number): void {
  el.classList.add('connection-rejected')
  setTimeout(() => {
    el.classList.remove('connection-rejected')
  }, durationMs)
}

export default function Canvas(): React.JSX.Element {
  const { nodes, edges, onNodesChange, onEdgesChange, setEdges } = useFlowStore()
  const { showMiniMap } = useUiStore()
  const isDraggingRef = useRef(false)
  const connectionAcceptedRef = useRef(false)
  const canvasWrapperRef = useRef<HTMLDivElement>(null)

  const interactions = useCanvasInteractions(canvasWrapperRef)

  const isValidConnection = useCallback(
    (connection: Connection) => validateConnection(connection, nodes, edges),
    [nodes, edges]
  )

  const onConnect = useCallback(
    (connection: Connection) => {
      connectionAcceptedRef.current = true
      const edgeData = buildTypedEdgeData(connection, nodes)
      setEdges(eds =>
        addEdge(
          {
            ...connection,
            type: 'typed',
            animated: false,
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
    connectionAcceptedRef.current = false
    applyHandleHighlight(true)
  }, [])

  const onConnectEnd: OnConnectEnd = useCallback(() => {
    isDraggingRef.current = false
    applyHandleHighlight(false)
    if (!connectionAcceptedRef.current && canvasWrapperRef.current) {
      triggerRejectionAnimation(canvasWrapperRef.current, REJECTION_ANIMATION_MS)
    }
    connectionAcceptedRef.current = false
  }, [])

  const nodeTypes = useMemo(() => buildNodeTypes(EMPTY_DEFINITIONS), [])

  return (
    <div
      className="w-full h-full"
      data-testid="canvas"
      ref={canvasWrapperRef}
      onDragOver={interactions.handleDragOver}
      onDrop={interactions.handleDrop}
      onContextMenu={interactions.handleContextMenu}
      onMouseMove={interactions.handleMouseMove}
      onKeyDown={interactions.handleKeyDown}
      tabIndex={0}
    >
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
        defaultEdgeOptions={{ type: 'typed', animated: false }}
        connectionLineStyle={CONNECTION_LINE_STYLE}
        onNodeClick={interactions.handleNodeClick}
        onPaneClick={interactions.handlePaneClick}
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
        <Background variant={BackgroundVariant.Dots} gap={16} size={0.5} color="#1f1f1f" />
        <Controls
          showInteractive={false}
          style={{ transform: 'scale(0.85)', transformOrigin: 'bottom left' }}
        />
        {showMiniMap && (
          <MiniMap
            nodeColor="#313244"
            maskColor="rgba(13, 13, 13, 0.8)"
            style={{ background: '#141414' }}
          />
        )}
        <WorkflowController />
      </ReactFlow>

      {interactions.contextMenu && (
        <ContextMenu
          position={interactions.contextMenu}
          onAddNode={interactions.handleAddNodeFromMenu}
          onClose={interactions.closeContextMenu}
        />
      )}

      {interactions.tabSearch.open && (
        <TabSearch
          canvasX={interactions.tabSearch.canvasX}
          canvasY={interactions.tabSearch.canvasY}
          onAddNode={interactions.handleAddNodeFromMenu}
          onClose={interactions.closeTabSearch}
        />
      )}
    </div>
  )
}
