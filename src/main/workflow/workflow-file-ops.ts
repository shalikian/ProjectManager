/**
 * File-system operations for workflow save/load.
 * Isolated here so the IPC handler layer stays thin.
 */

import { dialog, BrowserWindow } from 'electron'
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import type { WorkflowFile, WorkflowIpcResult } from '../../shared/workflow-types'
import { WORKFLOW_EXTENSION } from '../../shared/workflow-types'

const DIALOG_FILTERS = [
  { name: 'NodeGen Workflow', extensions: [WORKFLOW_EXTENSION] },
  { name: 'All Files', extensions: ['*'] }
]

/** Show a save dialog and write the workflow to the chosen path. */
export async function saveWorkflowAs(
  win: BrowserWindow,
  workflow: WorkflowFile
): Promise<WorkflowIpcResult> {
  const { canceled, filePath } = await dialog.showSaveDialog(win, {
    title: 'Save Workflow',
    defaultPath: `${workflow.metadata.name}.${WORKFLOW_EXTENSION}`,
    filters: DIALOG_FILTERS
  })

  if (canceled || !filePath) {
    return { ok: true, cancelled: true }
  }

  return writeWorkflowFile(filePath, workflow)
}

/** Write a workflow directly to a known path (no dialog). */
export function saveWorkflowToPath(
  filePath: string,
  workflow: WorkflowFile
): WorkflowIpcResult {
  return writeWorkflowFile(filePath, workflow)
}

/** Show an open dialog and read the chosen workflow file. */
export async function openWorkflowDialog(
  win: BrowserWindow
): Promise<WorkflowIpcResult> {
  const { canceled, filePaths } = await dialog.showOpenDialog(win, {
    title: 'Open Workflow',
    filters: DIALOG_FILTERS,
    properties: ['openFile']
  })

  if (canceled || filePaths.length === 0) {
    return { ok: true, cancelled: true }
  }

  return readWorkflowFile(filePaths[0])
}

/** Read and parse a workflow file from the given path. */
export function readWorkflowFile(filePath: string): WorkflowIpcResult {
  try {
    const raw = readFileSync(filePath, 'utf-8')
    const workflow = JSON.parse(raw) as WorkflowFile
    return { ok: true, filePath, workflow }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return { ok: false, error: `Failed to read workflow: ${message}` }
  }
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

function writeWorkflowFile(filePath: string, workflow: WorkflowFile): WorkflowIpcResult {
  try {
    const dir = dirname(filePath)
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true })
    }
    writeFileSync(filePath, JSON.stringify(workflow, null, 2), 'utf-8')
    return { ok: true, filePath }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return { ok: false, error: `Failed to save workflow: ${message}` }
  }
}

/** Build the userData directory path for storing app data files. */
export function getAppDataPath(fileName: string): string {
  const { app } = require('electron') as typeof import('electron')
  return join(app.getPath('userData'), fileName)
}
