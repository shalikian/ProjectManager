/**
 * Hook encapsulating all workflow save/load operations for the renderer.
 * Coordinates between React Flow, the flow store, the workflow store, and IPC.
 */

import { useCallback } from 'react'
import { useReactFlow } from '@xyflow/react'
import { useFlowStore } from '../../store/flow-store'
import { useWorkflowStore } from '../../store/workflow-store'
import { serializeWorkflow, validateWorkflowFile, nameFromFilePath } from '../../utils/workflow-serializer'
import type { WorkflowFile } from '../../../../shared/workflow-types'

/** Hook return type */
export interface WorkflowActions {
  save: () => Promise<void>
  saveAs: () => Promise<void>
  open: (filePath?: string) => Promise<void>
  newWorkflow: () => Promise<void>
}

/**
 * Returns workflow action handlers.
 * Must be called inside a ReactFlowProvider context.
 */
export function useWorkflow(): WorkflowActions {
  const rfInstance = useReactFlow()
  const { nodeRuntimeStates } = useFlowStore()
  const {
    workflowName,
    isDirty,
    onSaved,
    resetToNew,
    setDirty,
    setWorkflowName,
    setCurrentFilePath
  } = useWorkflowStore()

  const buildWorkflow = useCallback((): WorkflowFile => {
    return serializeWorkflow(rfInstance, nodeRuntimeStates, workflowName)
  }, [rfInstance, nodeRuntimeStates, workflowName])

  const save = useCallback(async (): Promise<void> => {
    const workflow = buildWorkflow()
    const result = await window.electron.workflow.save(workflow)
    if (result.ok && !result.cancelled && result.filePath) {
      onSaved(result.filePath, workflow.metadata.name)
      updateWindowTitle(workflow.metadata.name, false)
    } else if (!result.ok && result.error) {
      console.error('Save failed:', result.error)
    }
  }, [buildWorkflow, onSaved])

  const saveAs = useCallback(async (): Promise<void> => {
    const workflow = buildWorkflow()
    const result = await window.electron.workflow.saveAs(workflow)
    if (result.ok && !result.cancelled && result.filePath) {
      onSaved(result.filePath, workflow.metadata.name)
      updateWindowTitle(workflow.metadata.name, false)
    } else if (!result.ok && result.error) {
      console.error('Save As failed:', result.error)
    }
  }, [buildWorkflow, onSaved])

  const open = useCallback(async (filePath?: string): Promise<void> => {
    const result = await window.electron.workflow.open(filePath)
    if (result.cancelled || !result.ok) {
      if (result.error) console.error('Open failed:', result.error)
      return
    }
    if (!result.workflow || !result.filePath) return

    const validationError = validateWorkflowFile(result.workflow)
    if (validationError) {
      console.error('Invalid workflow file:', validationError)
      return
    }

    loadWorkflowIntoStore(result.workflow, result.filePath)
  }, [])

  const newWorkflow = useCallback(async (): Promise<void> => {
    if (isDirty) {
      const confirmed = window.confirm(
        'You have unsaved changes. Create a new workflow and discard them?'
      )
      if (!confirmed) return
    }

    clearCanvas()
    resetToNew()
    updateWindowTitle('Untitled', false)
  }, [isDirty, resetToNew])

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  function loadWorkflowIntoStore(workflow: WorkflowFile, filePath: string): void {
    const { setEdges } = useFlowStore.getState()
    const name = nameFromFilePath(filePath)

    // Restore nodes and edges via React Flow instance
    rfInstance.setNodes(workflow.nodes.map(n => ({
      id: n.id,
      type: n.type,
      position: n.position,
      data: n.data
    })))
    rfInstance.setEdges(workflow.edges.map(e => ({
      id: e.id,
      source: e.source,
      target: e.target,
      sourceHandle: e.sourceHandle,
      targetHandle: e.targetHandle,
      type: e.type ?? 'typed',
      animated: true,
      data: e.data ?? {}
    })))
    // Restore viewport
    rfInstance.setViewport(workflow.viewport)

    // Restore parameter values
    restoreParamValues(workflow)

    // Sync store
    setEdges(eds => eds)
    setCurrentFilePath(filePath)
    setWorkflowName(name)
    setDirty(false)
    updateWindowTitle(name, false)
  }

  function restoreParamValues(workflow: WorkflowFile): void {
    const { setNodeParamValue } = useFlowStore.getState()
    for (const node of workflow.nodes) {
      for (const [paramId, value] of Object.entries(node.paramValues)) {
        setNodeParamValue(node.id, paramId, value)
      }
    }
  }

  function clearCanvas(): void {
    rfInstance.setNodes([])
    rfInstance.setEdges([])
  }

  return { save, saveAs, open, newWorkflow }
}

function updateWindowTitle(name: string, dirty: boolean): void {
  const prefix = dirty ? '* ' : ''
  const title = `${prefix}NodeGen — ${name}.nodegen`
  window.electron.workflow.setTitle(title)
  document.title = title
}
