/**
 * NodeDefinition interface — the primary contract for all node plugins.
 * A node definition provides declarative metadata about the node's ports
 * and parameters, plus an async execute function that performs the work.
 */

import type { ComponentType } from 'react'
import type { PortDefinition } from './port-definition'
import type { ParameterDefinition } from './parameter-definition'
import type { ExecutionContext } from './execution-context'

/**
 * The async function that performs a node's computation.
 * @param inputs - Values arriving on input ports, keyed by port name
 * @param params - Current parameter values, keyed by parameter name
 * @param context - Runtime utilities (progress, secrets, abort, logger)
 * @returns A record of output values keyed by output port name
 */
export type NodeExecuteFunction = (
  inputs: Record<string, unknown>,
  params: Record<string, unknown>,
  context: ExecutionContext
) => Promise<Record<string, unknown>>

/**
 * Full definition of a node type in the plugin system.
 * This interface is the single source of truth for a node's identity,
 * connectivity, configuration, and execution behavior.
 */
export interface NodeDefinition {
  /** Unique identifier for this node type (e.g. "vertex-ai:imagen"). */
  id: string

  /** Semantic version string (e.g. "1.0.0"). */
  version: string

  /** Human-readable display name shown in the palette and on the canvas. */
  name: string

  /**
   * Category for grouping in the node palette
   * (e.g. "Image Generation", "Utilities").
   */
  category: string

  /** Ordered list of input port definitions. */
  inputs: PortDefinition[]

  /** Ordered list of output port definitions. */
  outputs: PortDefinition[]

  /** List of configurable parameters shown in the properties panel. */
  parameters: ParameterDefinition[]

  /** The async function invoked when this node is executed. */
  execute: NodeExecuteFunction

  /**
   * Optional custom React component to render in place of the default
   * node card. If omitted, the default node renderer is used.
   */
  customComponent?: ComponentType<{ id: string; data: Record<string, unknown> }>
}
