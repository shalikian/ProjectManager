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

/** MIME types accepted for image file drops. */
const IMAGE_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp']

/** Returns the first image file from a FileList, or null. */
function getFirstImageFile(files: FileList): File | null {
  for (let i = 0; i < files.length; i++) {
    if (IMAGE_MIME_TYPES.includes(files[i].type)) return files[i]
  }
  return null
}

/** Reads a File as a data URL using FileReader. */
function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

/**
 * Encapsulates canvas interaction state and event handlers:
 * - Drag-and-drop from palette and OS file drops
 * - Right-click context menu
 * - TAB quick-search overlay
 * - Clipboard paste (Ctrl+V)
 * - Node selection sync
 */
export function useCanvasInteractions(canvasWrapperRef: React.RefObject<HTMLDivElement>) {
  const { addNodeAtPosition, setSelectedNode, setNodeImagePreview } = useFlowStore()
  const { screenToFlowPosition } = useReactFlow()

  const [contextMenu, setContextMenu] = useState<ContextMenuPosition | null>(null)
  const [tabSearch, setTabSearch] = useState<TabSearchState>({ open: false, canvasX: 300, canvasY: 200 })
  const [isDraggingFile, setIsDraggingFile] = useState(false)

  // Track last known mouse position for TAB search placement
  const lastMousePos = useRef<{ x: number; y: number }>({ x: 300, y: 200 })

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    lastMousePos.current = { x: e.clientX, y: e.clientY }
  }, [])

  /** Creates an imageSource node at position and loads the dataUrl into it. */
  const createImageNodeAt = useCallback(
    (flowX: number, flowY: number, dataUrl: string) => {
      addNodeAtPosition('imageSource' as NodeType, flowX, flowY)
      // The node was just created and auto-selected — get its ID from the store
      const state = useFlowStore.getState()
      const newNodeId = state.selectedNodeId
      if (newNodeId) {
        setNodeImagePreview(newNodeId, 'image', dataUrl)
      }
    },
    [addNodeAtPosition, setNodeImagePreview]
  )

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    // Accept palette node drags
    if (e.dataTransfer.types.includes(DRAG_TYPE_NODE)) {
      e.preventDefault()
      e.dataTransfer.dropEffect = 'copy'
      return
    }
    // Accept image file drags from OS
    if (e.dataTransfer.types.includes('Files')) {
      e.preventDefault()
      e.dataTransfer.dropEffect = 'copy'
      setIsDraggingFile(true)
    }
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    // Only clear when leaving the wrapper itself, not children
    if (e.currentTarget === e.target) {
      setIsDraggingFile(false)
    }
  }, [])

  const handleDrop = useCallback(
    async (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      setIsDraggingFile(false)

      if (!canvasWrapperRef.current) return

      const bounds = canvasWrapperRef.current.getBoundingClientRect()
      const flowPos = screenToFlowPosition({
        x: e.clientX - bounds.left,
        y: e.clientY - bounds.top
      })

      // 1. Check for palette node drag
      const nodeType = e.dataTransfer.getData(DRAG_TYPE_NODE)
      if (nodeType) {
        addNodeAtPosition(nodeType as NodeType, flowPos.x, flowPos.y)
        return
      }

      // 2. Check for image file drop from OS
      const imageFile = getFirstImageFile(e.dataTransfer.files)
      if (imageFile) {
        try {
          const dataUrl = await readFileAsDataUrl(imageFile)
          createImageNodeAt(flowPos.x, flowPos.y, dataUrl)
        } catch (err) {
          console.error('[Canvas] Failed to read dropped image file:', err)
        }
      }
    },
    [canvasWrapperRef, screenToFlowPosition, addNodeAtPosition, createImageNodeAt]
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
    async (e: React.KeyboardEvent<HTMLDivElement>) => {
      // TAB: open quick-search
      if (e.key === 'Tab') {
        e.preventDefault()
        if (!canvasWrapperRef.current) return
        const bounds = canvasWrapperRef.current.getBoundingClientRect()
        const flowPos = screenToFlowPosition({
          x: lastMousePos.current.x - bounds.left,
          y: lastMousePos.current.y - bounds.top
        })
        setTabSearch({ open: true, canvasX: flowPos.x, canvasY: flowPos.y })
        return
      }

      // Ctrl+V / Cmd+V: paste image from clipboard
      if (e.key === 'v' && (e.ctrlKey || e.metaKey)) {
        // Don't intercept if focus is in a text input
        const active = document.activeElement
        if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')) return

        const imageApi = window.electron?.image
        if (!imageApi) return

        const result = await imageApi.readClipboard()
        if (!result) return

        e.preventDefault()
        if (!canvasWrapperRef.current) return
        const bounds = canvasWrapperRef.current.getBoundingClientRect()
        const flowPos = screenToFlowPosition({
          x: bounds.width / 2,
          y: bounds.height / 2
        })
        createImageNodeAt(flowPos.x, flowPos.y, result.dataUrl)
      }
    },
    [canvasWrapperRef, screenToFlowPosition, createImageNodeAt]
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
    isDraggingFile,
    handleMouseMove,
    handleDragOver,
    handleDragLeave,
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
