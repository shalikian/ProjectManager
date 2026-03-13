/**
 * Typed definition of the IPC bridge exposed to the renderer via contextBridge.
 * This file is also referenced by the renderer's global type augmentation.
 */

import type {
  WorkflowFile,
  WorkflowIpcResult,
  RecentFileEntry
} from '../shared/workflow-types'

export type { WorkflowFile, WorkflowIpcResult, RecentFileEntry }

export interface SaveCredentialRequest {
  key: string
  value: string
}

export interface MaskedCredential {
  key: string
  masked: string
}

export interface SaveResult {
  ok: boolean
  error?: string
}

export interface TestResult {
  ok: boolean
  message: string
}

/** Credential management API exposed to the renderer (no secrets returned). */
export interface CredentialsAPI {
  /** Save (encrypt + persist) a credential. Returns ok/error. */
  save: (req: SaveCredentialRequest) => Promise<SaveResult>
  /** List all stored credential keys. Never returns values. */
  list: () => Promise<string[]>
  /** Delete a stored credential by key. */
  delete: (key: string) => Promise<boolean>
  /** Get all credentials as masked display values. */
  getMasked: () => Promise<MaskedCredential[]>
  /** Test connection for a given provider. */
  test: (provider: string) => Promise<TestResult>
}

/** IPC event listener bridge — forwards main-to-renderer events safely. */
export interface IpcListenerBridge {
  on: (channel: string, callback: (...args: unknown[]) => void) => void
  off: (channel: string, callback: (...args: unknown[]) => void) => void
}

/** Workflow save/load API exposed to the renderer. */
export interface WorkflowAPI {
  /** Save the current workflow (uses existing path if known, else prompts). */
  save: (workflow: WorkflowFile) => Promise<WorkflowIpcResult>
  /** Always shows a save-as dialog. */
  saveAs: (workflow: WorkflowFile) => Promise<WorkflowIpcResult>
  /** Open a workflow via dialog (or by path if provided). */
  open: (filePath?: string) => Promise<WorkflowIpcResult>
  /** Get the list of recently opened workflows. */
  getRecent: () => Promise<RecentFileEntry[]>
  /** Update the window title. */
  setTitle: (title: string) => Promise<void>
}

export interface ElectronAPI {
  getVersion: () => Promise<string>
  getPlatform: () => Promise<NodeJS.Platform>
  credentials: CredentialsAPI
  workflow: WorkflowAPI
  ipcRenderer: IpcListenerBridge
}
