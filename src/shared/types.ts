/**
 * Shared types used across main, preload, and renderer processes.
 */

export interface AppInfo {
  version: string
  platform: NodeJS.Platform
}

export interface NodeData {
  label: string
  [key: string]: unknown
}

export type NodeType = 'imageSource' | 'filter' | 'output' | 'custom'
