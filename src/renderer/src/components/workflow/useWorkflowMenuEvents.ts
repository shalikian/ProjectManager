/**
 * Hook that wires up menu-triggered IPC events (Save, Open, New, etc.)
 * to the workflow action handlers.
 *
 * Must be called once at the Layout level inside a ReactFlowProvider.
 */

import { useEffect } from 'react'
import { IPC_CHANNELS } from '../../../../shared/ipc-channels'
import type { WorkflowActions } from './useWorkflow'
import type { WorkflowIpcResult } from '../../../../shared/workflow-types'

export function useWorkflowMenuEvents(actions: WorkflowActions): void {
  const { save, saveAs, open, newWorkflow } = actions

  useEffect(() => {
    const handleSave = (): void => { save() }
    const handleSaveAs = (): void => { saveAs() }
    const handleOpen = (): void => { open() }
    const handleNew = (): void => { newWorkflow() }
    const handleOpenRecent = (result: WorkflowIpcResult): void => {
      if (result?.ok && !result.cancelled && result.filePath) {
        open(result.filePath)
      }
    }

    const ipc = window.electron.ipcRenderer
    ipc.on(IPC_CHANNELS.WORKFLOW_MENU_SAVE, handleSave)
    ipc.on(IPC_CHANNELS.WORKFLOW_MENU_SAVE_AS, handleSaveAs)
    ipc.on(IPC_CHANNELS.WORKFLOW_MENU_OPEN, handleOpen)
    ipc.on(IPC_CHANNELS.WORKFLOW_MENU_NEW, handleNew)
    ipc.on(IPC_CHANNELS.WORKFLOW_MENU_OPEN_RECENT, handleOpenRecent as (...args: unknown[]) => void)

    return () => {
      ipc.off(IPC_CHANNELS.WORKFLOW_MENU_SAVE, handleSave)
      ipc.off(IPC_CHANNELS.WORKFLOW_MENU_SAVE_AS, handleSaveAs)
      ipc.off(IPC_CHANNELS.WORKFLOW_MENU_OPEN, handleOpen)
      ipc.off(IPC_CHANNELS.WORKFLOW_MENU_NEW, handleNew)
      ipc.off(IPC_CHANNELS.WORKFLOW_MENU_OPEN_RECENT, handleOpenRecent as (...args: unknown[]) => void)
    }
  }, [save, saveAs, open, newWorkflow])
}
