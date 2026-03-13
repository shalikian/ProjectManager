/**
 * Types for the workflow execution engine.
 * These are internal to the main process and not exposed to the renderer directly.
 */

/** A node instance in the workflow graph (renderer-facing data). */
export interface WorkflowNode {
  id: string
  /** The NodeDefinition id (used to look up the definition in the registry). */
  type: string
  /** Current parameter values keyed by parameter id. */
  parameters: Record<string, unknown>
}

/** A directed edge from one node's output port to another node's input port. */
export interface WorkflowEdge {
  id: string
  /** The source node instance id. */
  source: string
  /** The source port id on the source node. */
  sourceHandle: string
  /** The target node instance id. */
  target: string
  /** The target port id on the target node. */
  targetHandle: string
}

/** The full graph description passed to the execution engine. */
export interface WorkflowGraph {
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
}

// Re-export shared ExecutionContext for convenience within the engine package.
export type { ExecutionContext } from '../../shared/types'

// ─── IPC progress event payloads ─────────────────────────────────────────────

export type ProgressEventType =
  | 'node-started'
  | 'node-progress'
  | 'node-completed'
  | 'node-error'
  | 'run-completed'

export interface ProgressEvent {
  type: ProgressEventType
  /** The workflow run id (UUID). */
  runId: string
  /** The node instance id (absent for run-completed). */
  nodeId?: string
  /** For node-progress: 0–100. */
  percent?: number
  /** Human-readable status message. */
  message?: string
  /** For node-error: serialised error message. */
  error?: string
  /** For node-completed / run-completed: the output values. */
  outputs?: Record<string, unknown>
}

/** Inputs for an ENGINE_RUN IPC call. */
export interface EngineRunRequest {
  runId: string
  graph: WorkflowGraph
}

/** Inputs for a per-node ENGINE_RUN_NODE IPC call. */
export interface EngineRunNodeRequest {
  runId: string
  /** The target node instance id to run (along with its upstream deps). */
  nodeId: string
  graph: WorkflowGraph
}
