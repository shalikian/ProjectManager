/**
 * ExecutionEngine — orchestrates workflow execution in the main process.
 *
 * Responsibilities:
 *  - Topological sort via Kahn's algorithm
 *  - Input-hash caching with downstream invalidation
 *  - AbortController propagation for cancellation
 *  - IPC progress events to renderer
 */

import { NodeRegistry } from '../plugins/node-registry'
import { toposort, upstreamSubgraph } from './toposort'
import { ExecutionCache, computeInputHash } from './cache'
import type { ExecutionContext } from '../../shared/types'
import type {
  WorkflowGraph,
  WorkflowNode,
  WorkflowEdge,
  ProgressEvent
} from './types'

export type ProgressEmitter = (event: ProgressEvent) => void

/** Secrets provider: returns a secret value by key, or undefined. */
export type SecretsProvider = (key: string) => string | undefined

/** Active run state kept for cancellation. */
interface ActiveRun {
  controller: AbortController
}

/**
 * Manages workflow execution.
 * One instance per app; supports concurrent per-node runs.
 */
export class ExecutionEngine {
  private registry: NodeRegistry
  private cache: ExecutionCache
  private activeRuns = new Map<string, ActiveRun>()
  private emitProgress: ProgressEmitter
  private getSecret: SecretsProvider

  constructor(
    emitProgress: ProgressEmitter,
    getSecret?: SecretsProvider,
    registry?: NodeRegistry
  ) {
    this.emitProgress = emitProgress
    this.getSecret = getSecret ?? (() => undefined)
    this.registry = registry ?? NodeRegistry.getInstance()
    this.cache = new ExecutionCache()
  }

  // ─── Public API ──────────────────────────────────────────────────────────────

  /** Execute the entire graph. Returns when all nodes complete or an error occurs. */
  async runAll(runId: string, graph: WorkflowGraph): Promise<void> {
    const controller = new AbortController()
    this.activeRuns.set(runId, { controller })
    try {
      const allNodeIds = graph.nodes.map(n => n.id)
      const adjacency = buildAdjacency(graph.edges)
      const order = toposort({ nodeIds: allNodeIds, edges: adjacency })
      await this.executeOrder(runId, order, graph, adjacency, controller.signal)
    } finally {
      this.activeRuns.delete(runId)
    }
  }

  /**
   * Execute only a specific node and its upstream dependencies.
   * Used by the per-node "Run" button.
   */
  async runNode(runId: string, nodeId: string, graph: WorkflowGraph): Promise<void> {
    const controller = new AbortController()
    this.activeRuns.set(runId, { controller })
    try {
      const allNodeIds = graph.nodes.map(n => n.id)
      const adjacency = buildAdjacency(graph.edges)
      const subgraphIds = upstreamSubgraph(nodeId, allNodeIds, adjacency)
      const subgraphEdges = filterAdjacency(adjacency, subgraphIds)
      const order = toposort({ nodeIds: subgraphIds, edges: subgraphEdges })
      await this.executeOrder(runId, order, graph, adjacency, controller.signal)
    } finally {
      this.activeRuns.delete(runId)
    }
  }

  /** Cancel a running execution by runId. */
  cancel(runId: string): void {
    const run = this.activeRuns.get(runId)
    if (run) {
      run.controller.abort()
    }
  }

  /** Clear the entire cache (e.g. when the graph changes structurally). */
  clearCache(): void {
    this.cache.clear()
  }

  // ─── Internal helpers ─────────────────────────────────────────────────────────

  /**
   * Execute nodes in the given order, resolving inputs from upstream outputs.
   * Handles caching, abort checking, and progress event emission.
   */
  private async executeOrder(
    runId: string,
    order: string[],
    graph: WorkflowGraph,
    adjacency: Map<string, string[]>,
    abortSignal: AbortSignal
  ): Promise<void> {
    const nodeMap = buildNodeMap(graph.nodes)
    const outputMap = new Map<string, Record<string, unknown>>()

    for (const nodeId of order) {
      if (abortSignal.aborted) break

      const node = nodeMap.get(nodeId)
      if (!node) continue

      const resolvedInputs = resolveInputs(nodeId, graph.edges, outputMap)
      const inputHash = computeInputHash(node, resolvedInputs)

      if (this.cache.isHit(nodeId, inputHash)) {
        const cached = this.cache.getOutputs(nodeId) ?? {}
        outputMap.set(nodeId, cached)
        continue
      }

      // Cache miss — invalidate this node and all downstream nodes
      this.cache.invalidateDownstream(nodeId, adjacency)

      await this.executeNode(
        runId, node, resolvedInputs, inputHash, outputMap, abortSignal
      )
    }

    if (!abortSignal.aborted) {
      this.emitProgress({ type: 'run-completed', runId, outputs: collectAllOutputs(outputMap) })
    }
  }

  /** Execute a single node, emit progress events, and cache the result. */
  private async executeNode(
    runId: string,
    node: WorkflowNode,
    resolvedInputs: Record<string, unknown>,
    inputHash: string,
    outputMap: Map<string, Record<string, unknown>>,
    abortSignal: AbortSignal
  ): Promise<void> {
    const definition = this.registry.getById(node.type)
    if (!definition) {
      const err = `Node definition not found: ${node.type}`
      this.emitProgress({ type: 'node-error', runId, nodeId: node.id, error: err })
      return
    }

    this.emitProgress({ type: 'node-started', runId, nodeId: node.id })

    const context = this.buildContext(runId, node.id, abortSignal)
    const inputs = mergeParametersIntoInputs(resolvedInputs, node.parameters)

    try {
      const outputs = await definition.execute(inputs, context)
      const result = outputs ?? {}
      this.cache.set(node.id, inputHash, result)
      outputMap.set(node.id, result)
      this.emitProgress({ type: 'node-completed', runId, nodeId: node.id, outputs: result })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      this.emitProgress({ type: 'node-error', runId, nodeId: node.id, error: message })
      throw err
    }
  }

  /** Build the ExecutionContext passed to each node's execute() call. */
  private buildContext(runId: string, nodeId: string, abortSignal: AbortSignal): ExecutionContext {
    return {
      reportProgress: (percent: number, message?: string) => {
        this.emitProgress({ type: 'node-progress', runId, nodeId, percent, message })
      },
      getSecret: this.getSecret,
      abortSignal
    }
  }
}

// ─── Graph utilities ──────────────────────────────────────────────────────────

/** Build adjacency map (source → downstream node ids) from edges. */
export function buildAdjacency(edges: WorkflowEdge[]): Map<string, string[]> {
  const adj = new Map<string, string[]>()
  for (const edge of edges) {
    const existing = adj.get(edge.source) ?? []
    if (!existing.includes(edge.target)) {
      existing.push(edge.target)
    }
    adj.set(edge.source, existing)
  }
  return adj
}

/** Filter an adjacency map to only include nodes in the subgraph. */
function filterAdjacency(
  adjacency: Map<string, string[]>,
  allowedIds: string[]
): Map<string, string[]> {
  const allowed = new Set(allowedIds)
  const filtered = new Map<string, string[]>()
  for (const id of allowedIds) {
    const targets = (adjacency.get(id) ?? []).filter(t => allowed.has(t))
    filtered.set(id, targets)
  }
  return filtered
}

/** Build a lookup map from node id to WorkflowNode. */
function buildNodeMap(nodes: WorkflowNode[]): Map<string, WorkflowNode> {
  const map = new Map<string, WorkflowNode>()
  for (const node of nodes) {
    map.set(node.id, node)
  }
  return map
}

/**
 * Resolve the inputs for a node by reading from upstream output maps.
 * Each edge that targets this node maps sourceHandle output → targetHandle input.
 */
function resolveInputs(
  nodeId: string,
  edges: WorkflowEdge[],
  outputMap: Map<string, Record<string, unknown>>
): Record<string, unknown> {
  const inputs: Record<string, unknown> = {}
  for (const edge of edges) {
    if (edge.target !== nodeId) continue
    const upstreamOutputs = outputMap.get(edge.source)
    if (upstreamOutputs && edge.sourceHandle in upstreamOutputs) {
      inputs[edge.targetHandle] = upstreamOutputs[edge.sourceHandle]
    }
  }
  return inputs
}

/** Merge node parameter values into the resolved inputs object. */
function mergeParametersIntoInputs(
  resolvedInputs: Record<string, unknown>,
  parameters: Record<string, unknown>
): Record<string, unknown> {
  return { ...parameters, ...resolvedInputs }
}

/** Collect all node outputs into a flat map keyed by nodeId. */
function collectAllOutputs(
  outputMap: Map<string, Record<string, unknown>>
): Record<string, unknown> {
  const all: Record<string, unknown> = {}
  for (const [nodeId, outputs] of outputMap.entries()) {
    all[nodeId] = outputs
  }
  return all
}
