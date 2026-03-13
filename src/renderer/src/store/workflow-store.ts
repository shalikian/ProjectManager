/**
 * Zustand store for workflow serialization state.
 * Tracks dirty state, current file path, and workflow metadata.
 */

import { create } from 'zustand'
import type { RecentFileEntry } from '../../../shared/workflow-types'

interface WorkflowState {
  /** True when there are unsaved changes. */
  isDirty: boolean
  /** Current file path, or null for unsaved new workflow. */
  currentFilePath: string | null
  /** Display name of the current workflow. */
  workflowName: string
  /** Cached recent files list. */
  recentFiles: RecentFileEntry[]

  setDirty: (dirty: boolean) => void
  setCurrentFilePath: (path: string | null) => void
  setWorkflowName: (name: string) => void
  setRecentFiles: (files: RecentFileEntry[]) => void
  /** Mark workflow as saved (clears dirty, sets path and name). */
  onSaved: (filePath: string, name: string) => void
  /** Reset to a clean new workflow. */
  resetToNew: () => void
}

const DEFAULT_WORKFLOW_NAME = 'Untitled'

export const useWorkflowStore = create<WorkflowState>(set => ({
  isDirty: false,
  currentFilePath: null,
  workflowName: DEFAULT_WORKFLOW_NAME,
  recentFiles: [],

  setDirty: (dirty: boolean) => set({ isDirty: dirty }),

  setCurrentFilePath: (path: string | null) => set({ currentFilePath: path }),

  setWorkflowName: (name: string) => set({ workflowName: name }),

  setRecentFiles: (files: RecentFileEntry[]) => set({ recentFiles: files }),

  onSaved: (filePath: string, name: string) =>
    set({ isDirty: false, currentFilePath: filePath, workflowName: name }),

  resetToNew: () =>
    set({
      isDirty: false,
      currentFilePath: null,
      workflowName: DEFAULT_WORKFLOW_NAME
    })
}))
