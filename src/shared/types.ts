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

// ─── Plugin / Node Definition types ──────────────────────────────────────────

/** Describes a single input or output port on a node. */
export interface PortDefinition {
  id: string
  label: string
  type: string
}

/**
 * Defines a node type that a plugin exports.
 * Required fields: id, name, category, inputs, outputs, execute.
 */
export interface NodeDefinition {
  id: string
  name: string
  category: string
  description?: string
  inputs: PortDefinition[]
  outputs: PortDefinition[]
  execute: (inputs: Record<string, unknown>) => Promise<Record<string, unknown>> | Record<string, unknown>
}
