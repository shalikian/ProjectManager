/**
 * Shared types used across main, preload, and renderer processes.
 */

/** Minimal execution context passed to node execute functions. */
export interface ExecutionContext {
  /** Report incremental progress for this node (0–100). */
  reportProgress: (percent: number, message?: string) => void
  /** Retrieve a named secret (API key, credential, etc.). */
  getSecret: (key: string) => string | undefined
  /** AbortSignal that fires when the run is cancelled. */
  abortSignal: AbortSignal
}

export interface AppInfo {
  version: string
  platform: NodeJS.Platform
}

export interface NodeData {
  label: string
  [key: string]: unknown
}

/**
 * Built-in node type identifiers.
 * Plugin nodes use their definition id (e.g. 'utility.text') which is
 * not listed here — the type is intentionally broadened to string so
 * the flow store and factory can handle dynamic plugin node types.
 */
export type NodeType = 'imageSource' | 'filter' | 'output' | 'custom' | string

// ─── Port Type System ─────────────────────────────────────────────────────────

/** Describes a named, color-coded port type. */
export interface PortType {
  id: string
  label: string
  color: string
}

/** Registry of all built-in port types. */
export const PORT_TYPE_REGISTRY: Record<string, PortType> = {
  IMAGE: { id: 'IMAGE', label: 'Image', color: '#64B5F6' },
  TEXT: { id: 'TEXT', label: 'Text', color: '#81C784' },
  NUMBER: { id: 'NUMBER', label: 'Number', color: '#FFB74D' },
  JSON: { id: 'JSON', label: 'JSON', color: '#CE93D8' },
  ANY: { id: 'ANY', label: 'Any', color: '#9E9E9E' }
}

/** Resolves a port type id to its PortType, falling back to ANY. */
export function resolvePortType(typeId: string): PortType {
  return PORT_TYPE_REGISTRY[typeId] ?? PORT_TYPE_REGISTRY.ANY
}

/**
 * Returns true if a source port type is compatible with a target port type.
 * Rules:
 *   - ANY source can connect to any target.
 *   - ANY target can accept any source.
 *   - Otherwise, both types must match.
 */
export function isTypeCompatible(sourceTypeId: string, targetTypeId: string): boolean {
  if (sourceTypeId === 'ANY' || targetTypeId === 'ANY') return true
  return sourceTypeId === targetTypeId
}

// ─── Plugin / Node Definition types ──────────────────────────────────────────

/** Describes a single input or output port on a node. */
export interface PortDefinition {
  id: string
  label: string
  type: string
}

/** Describes a parameter (inline widget) on a node. */
export type ParameterType =
  | 'text'
  | 'number'
  | 'slider'
  | 'toggle'
  | 'select'
  | 'textarea'

export interface SelectOption {
  value: string
  label: string
}

export interface ParameterDefinition {
  id: string
  label: string
  type: ParameterType
  default?: unknown
  /** For slider and number: min value */
  min?: number
  /** For slider and number: max value */
  max?: number
  /** For slider: step size */
  step?: number
  /** For select: available options */
  options?: SelectOption[]
}

/** Execution state for a node instance. */
export type NodeExecutionState = 'idle' | 'running' | 'completed' | 'error'

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
  parameters?: ParameterDefinition[]
  /** Optional pixel width override. Defaults to 280. */
  width?: number
  execute: (
    inputs: Record<string, unknown>,
    context?: ExecutionContext
  ) => Promise<Record<string, unknown>> | Record<string, unknown>
}
