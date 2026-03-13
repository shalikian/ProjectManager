/**
 * General application types shared across main, preload, and renderer processes.
 */

export interface AppInfo {
  version: string
  platform: NodeJS.Platform
}

/** Generic data payload attached to a React Flow node. */
export interface NodeData {
  label: string
  [key: string]: unknown
}

/** Built-in node type identifiers used by the initial scaffold nodes. */
export type NodeType = 'imageSource' | 'filter' | 'output' | 'custom'
