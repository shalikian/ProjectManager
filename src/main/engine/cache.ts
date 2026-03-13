/**
 * Input-hash caching for the execution engine.
 *
 * A node's cache entry is valid if its input hash matches the hash
 * computed from the current resolved inputs and parameter values.
 * When a node re-executes (cache miss), all downstream nodes are
 * invalidated so they re-execute too.
 */

import { createHash } from 'crypto'
import type { WorkflowNode } from './types'

export interface CacheEntry {
  inputHash: string
  outputs: Record<string, unknown>
}

/**
 * Manages per-node execution cache for a single workflow run (or across runs).
 * Call `invalidate(nodeId)` to force a node and its dependents to re-execute.
 */
export class ExecutionCache {
  private entries = new Map<string, CacheEntry>()

  /** Check whether a node has a valid cached result for the given inputs. */
  isHit(nodeId: string, inputHash: string): boolean {
    const entry = this.entries.get(nodeId)
    return entry !== undefined && entry.inputHash === inputHash
  }

  /** Retrieve cached outputs for a node (must check isHit first). */
  getOutputs(nodeId: string): Record<string, unknown> | undefined {
    return this.entries.get(nodeId)?.outputs
  }

  /** Store the result of a node execution. */
  set(nodeId: string, inputHash: string, outputs: Record<string, unknown>): void {
    this.entries.set(nodeId, { inputHash, outputs })
  }

  /** Invalidate a node's cache entry (forces re-execution on next run). */
  invalidate(nodeId: string): void {
    this.entries.delete(nodeId)
  }

  /** Clear all cache entries. */
  clear(): void {
    this.entries.clear()
  }

  /**
   * Invalidate a node and all nodes downstream of it.
   *
   * @param nodeId    The node that changed.
   * @param adjacency Source → downstream nodes (same direction as execution).
   */
  invalidateDownstream(nodeId: string, adjacency: Map<string, string[]>): void {
    const visited = new Set<string>()
    const queue = [nodeId]

    while (queue.length > 0) {
      const current = queue.shift()!
      if (visited.has(current)) continue
      visited.add(current)
      this.invalidate(current)

      const downstream = adjacency.get(current) ?? []
      for (const dep of downstream) {
        if (!visited.has(dep)) {
          queue.push(dep)
        }
      }
    }
  }
}

/**
 * Compute a deterministic hash for a node's current inputs.
 * The hash covers both the resolved upstream outputs and the node's parameters.
 */
export function computeInputHash(
  node: WorkflowNode,
  resolvedInputs: Record<string, unknown>
): string {
  const payload = {
    inputs: resolvedInputs,
    parameters: node.parameters
  }
  return createHash('sha256')
    .update(JSON.stringify(payload))
    .digest('hex')
}
