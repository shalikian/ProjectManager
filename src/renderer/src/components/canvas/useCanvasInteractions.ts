import { useCallback, useRef, useState } from 'react'
import { useReactFlow } from '@xyflow/react'
import { useFlowStore } from '../../store/flow-store'
import type { NodeType } from '../../../../shared/types'
import { DRAG_TYPE_NODE } from '../palette/PaletteNodeItem'
import type { ContextMenuPosition } from './ContextMenu'
import type { PaletteEntry } from '../palette/palette-registry'

export interface TabSearchState {
  open: boolean
  canvasX: number
  canvasY: number
}

/**
 * Encapsulates canvas interaction state and event handlers:
 * - Drag-and-drop from palette
 * - Right-click context menu
 * - TAB quick-search overlay
 * - Node selection sync
 */
export function useCanvasInteractions(canvasWrapperRef: React.RefObject<HTMLDivElement>) {
  const { addNodeAtPosition, setSelectedNode } = useFlowStore()
  const { screenToFlowPosition } = useReactFlow()

  const [contextMenu, setContextMenu] = useState<ContextMenuPosition | null>(null)
  const [tabSearch, setTabSearch] = useState<TabSearchState>({ open: false, canvasX: 300, canvasY: 200 })

  // Track last known mouse position for TAB search placement
  const lastMousePos = useRef<{ x: number; y: number }>({ x: 300, y: 200 })

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    lastMousePos.current = { x: e.clientX, y: e.clientY }
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    if (e.dataTransfer.types.includes(DRAG_TYPE_NODE)) {
      e.preventDefault()
      e.dataTransfer.dropEffect = 'copy'
    }
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      const nodeType = e.dataTransfer.getData(DRAG_TYPE_NODE)
      if (!nodeType || !canvasWrapperRef.current) return

      const bounds = canvasWrapperRef.current.getBoundingClientRect()
      const flowPos = screenToFlowPosition({
        x: e.clientX - bounds.left,
        y: e.clientY - bounds.top
      })
      addNodeAtPosition(nodeType as NodeType, flowPos.x, flowPos.y)
    },
    [canvasWrapperRef, screenToFlowPosition, addNodeAtPosition]
  )

  const handleContextMenu = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      e.preventDefault()
      if (!canvasWrapperRef.current) return

      const bounds = canvasWrapperRef.current.getBoundingClientRect()
      const flowPos = screenToFlowPosition({
        x: e.clientX - bounds.left,
        y: e.clientY - bounds.top
      })
      setContextMenu({
        screenX: e.clientX,
        screenY: e.clientY,
        canvasX: flowPos.x,
        canvasY: flowPos.y
      })
    },
    [canvasWrapperRef, screenToFlowPosition]
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'Tab') {
        e.preventDefault()
        if (!canvasWrapperRef.current) return
        const bounds = canvasWrapperRef.current.getBoundingClientRect()
        const flowPos = screenToFlowPosition({
          x: lastMousePos.current.x - bounds.left,
          y: lastMousePos.current.y - bounds.top
        })
        setTabSearch({ open: true, canvasX: flowPos.x, canvasY: flowPos.y })
      }
    },
    [canvasWrapperRef, screenToFlowPosition]
  )

  const handleAddNodeFromMenu = useCallback(
    (entry: PaletteEntry, canvasX: number, canvasY: number) => {
      addNodeAtPosition(entry.type as NodeType, canvasX, canvasY)
    },
    [addNodeAtPosition]
  )

  const closeContextMenu = useCallback(() => setContextMenu(null), [])
  const closeTabSearch = useCallback(
    () => setTabSearch(s => ({ ...s, open: false })),
    []
  )

  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: { id: string }) => {
      setSelectedNode(node.id)
    },
    [setSelectedNode]
  )

  const handlePaneClick = useCallback(() => {
    setSelectedNode(null)
    setContextMenu(null)
  }, [setSelectedNode])

  return {
    contextMenu,
    tabSearch,
    handleMouseMove,
    handleDragOver,
    handleDrop,
    handleContextMenu,
    handleKeyDown,
    handleAddNodeFromMenu,
    closeContextMenu,
    closeTabSearch,
    handleNodeClick,
    handlePaneClick
  }
}
