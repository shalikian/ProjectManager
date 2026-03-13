/**
 * Shared types for workflow serialization.
 * Version 1.0.0 format.
 */

/** Format version for backward compatibility. */
export const WORKFLOW_FORMAT_VERSION = '1.0.0'

/** Default file extension for workflow files. */
export const WORKFLOW_EXTENSION = 'nodegen'

/** Maximum number of recent files to store. */
export const MAX_RECENT_FILES = 10

/** A serialized node including its parameter values. */
export interface SerializedNode {
  id: string
  type: string
  position: { x: number; y: number }
  data: Record<string, unknown>
  /** Saved parameter values keyed by param id. */
  paramValues: Record<string, unknown>
}

/** A serialized edge. */
export interface SerializedEdge {
  id: string
  source: string
  target: string
  sourceHandle?: string | null
  targetHandle?: string | null
  type?: string
  data?: Record<string, unknown>
}

/** Viewport state (zoom/pan). */
export interface SerializedViewport {
  x: number
  y: number
  zoom: number
}

/** Top-level workflow file format. */
export interface WorkflowFile {
  version: string
  metadata: WorkflowMetadata
  nodes: SerializedNode[]
  edges: SerializedEdge[]
  viewport: SerializedViewport
}

/** Metadata stored alongside the graph. */
export interface WorkflowMetadata {
  name: string
  created: string
  modified: string
}

/** Result returned from save/open IPC calls. */
export interface WorkflowIpcResult {
  ok: boolean
  filePath?: string
  workflow?: WorkflowFile
  error?: string
  /** When true, the user cancelled the dialog without selecting a file. */
  cancelled?: boolean
}

/** An entry in the recent-files list. */
export interface RecentFileEntry {
  filePath: string
  name: string
  openedAt: string
}
