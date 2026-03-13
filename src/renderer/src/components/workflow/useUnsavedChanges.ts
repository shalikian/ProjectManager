/**
 * Hook that detects changes to nodes/edges and marks the workflow as dirty.
 * Syncs the window title with the dirty indicator.
 */

import { useEffect, useRef } from 'react'
import { useFlowStore } from '../../store/flow-store'
import { useWorkflowStore } from '../../store/workflow-store'

/**
 * Watches the flow store for node/edge changes and marks the workflow dirty.
 * Skips the initial mount to avoid false positives on load.
 */
export function useUnsavedChanges(): void {
  const nodes = useFlowStore(state => state.nodes)
  const edges = useFlowStore(state => state.edges)
  const { isDirty, setDirty, workflowName } = useWorkflowStore()
  const isFirstRender = useRef(true)

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    if (!isDirty) {
      setDirty(true)
      setWindowTitleDirty(workflowName, true)
    }
  }, [nodes, edges]) // eslint-disable-line react-hooks/exhaustive-deps

  // Keep title in sync when dirty state or name changes externally
  useEffect(() => {
    setWindowTitleDirty(workflowName, isDirty)
  }, [isDirty, workflowName])
}

function setWindowTitleDirty(name: string, dirty: boolean): void {
  const prefix = dirty ? '* ' : ''
  const title = `${prefix}NodeGen — ${name}`
  document.title = title
  // Update Electron window title if available
  if (window.electron?.workflow?.setTitle) {
    window.electron.workflow.setTitle(title)
  }
}
