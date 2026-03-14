/**
 * Typed definition of the IPC bridge exposed to the renderer via contextBridge.
 * This file is also referenced by the renderer's global type augmentation.
 */

import type {
  WorkflowFile,
  WorkflowIpcResult,
  RecentFileEntry
} from '../shared/workflow-types'

import type {
  GalleryItem,
  GallerySaveRequest,
  GallerySaveResult,
  GalleryListResult
} from '../shared/gallery-types'

export type { WorkflowFile, WorkflowIpcResult, RecentFileEntry }
export type { GalleryItem, GallerySaveRequest, GallerySaveResult, GalleryListResult }

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

/** Node registry API exposed to the renderer. */
export interface NodesAPI {
  /** Fetch all registered NodeDefinition objects from the main process registry. */
  listAll: () => Promise<unknown[]>
  /**
   * Subscribe to registry-changed events.
   * The callback is invoked with the full updated list of definitions.
   * Returns a cleanup function that removes the listener.
   */
  onRegistryChanged: (cb: (definitions: unknown[]) => void) => () => void
}

/** Gallery / auto-save API exposed to the renderer. */
export interface GalleryAPI {
  /** List all gallery items from the output directory. */
  list: () => Promise<GalleryListResult>
  /** Save a generated image and return the gallery item. */
  saveImage: (req: GallerySaveRequest) => Promise<GallerySaveResult>
  /** Delete a gallery item (removes PNG, thumb, JSON). */
  delete: (item: GalleryItem) => Promise<{ ok: boolean; error?: string }>
  /** Reveal a file in the OS file explorer. */
  openFolder: (filePath: string) => Promise<{ ok: boolean; error?: string }>
  /** Copy image data URL to clipboard. */
  copyToClipboard: (dataUrl: string) => Promise<{ ok: boolean; error?: string }>
  /** Get the current output directory path. */
  getOutputDir: () => Promise<string>
  /** Set the output directory (shows dialog if dir is omitted). */
  setOutputDir: (dir?: string) => Promise<{ ok: boolean; dir?: string; cancelled?: boolean; error?: string }>
  /** Subscribe to gallery:item-saved push events. */
  onItemSaved: (callback: (item: GalleryItem) => void) => () => void
}

/** Image import result returned from main process. */
export interface ImageLoadResult {
  dataUrl: string
  fileName: string
}

/** Image import API exposed to the renderer. */
export interface ImageAPI {
  /** Open a file dialog filtered to PNG/JPG/WebP and return the image as a data URL. */
  openDialog: () => Promise<ImageLoadResult | null>
  /** Read image data from the system clipboard. */
  readClipboard: () => Promise<ImageLoadResult | null>
}

export interface ElectronAPI {
  getVersion: () => Promise<string>
  getPlatform: () => Promise<NodeJS.Platform>
  credentials: CredentialsAPI
  workflow: WorkflowAPI
  nodes: NodesAPI
  image: ImageAPI
  gallery: GalleryAPI
  ipcRenderer: IpcListenerBridge
}
