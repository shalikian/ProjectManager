/**
 * Public API of the execution engine module.
 */

export { ExecutionEngine, buildAdjacency } from './execution-engine'
export { registerEngineHandlers } from './ipc-engine-handlers'
export { toposort, upstreamSubgraph } from './toposort'
export { ExecutionCache, computeInputHash } from './cache'
export type {
  WorkflowNode,
  WorkflowEdge,
  WorkflowGraph,
  ProgressEvent,
  ProgressEventType,
  EngineRunRequest,
  EngineRunNodeRequest
} from './types'
