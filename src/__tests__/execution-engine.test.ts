import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ExecutionEngine, buildAdjacency } from '../main/engine/execution-engine'
import { toposort, upstreamSubgraph } from '../main/engine/toposort'
import { ExecutionCache, computeInputHash } from '../main/engine/cache'
import { NodeRegistry } from '../main/plugins/node-registry'
import type { NodeDefinition } from '../shared/types'
import type { WorkflowGraph, WorkflowNode, WorkflowEdge } from '../main/engine/types'

// ─── Helpers ────────────────────────────────────────────────────────────────

function makeNode(id: string, type = id): WorkflowNode {
  return { id, type, parameters: {} }
}

function makeEdge(source: string, target: string, handle = 'out'): WorkflowEdge {
  return {
    id: `${source}-${target}`,
    source,
    sourceHandle: handle,
    target,
    targetHandle: handle
  }
}

function makeNodeDef(id: string, outputValue: unknown = {}): NodeDefinition {
  return {
    id,
    name: id,
    category: 'test',
    inputs: [],
    outputs: [],
    execute: vi.fn().mockResolvedValue(outputValue)
  }
}

function makeGraph(
  nodes: WorkflowNode[],
  edges: WorkflowEdge[] = []
): WorkflowGraph {
  return { nodes, edges }
}

// ─── Toposort tests ──────────────────────────────────────────────────────────

describe('toposort', () => {
  it('sorts a linear chain A→B→C into correct execution order', () => {
    const edges = new Map([['A', ['B']], ['B', ['C']]])
    const result = toposort({ nodeIds: ['A', 'B', 'C'], edges })
    expect(result.indexOf('A')).toBeLessThan(result.indexOf('B'))
    expect(result.indexOf('B')).toBeLessThan(result.indexOf('C'))
  })

  it('handles a graph with no edges (all independent nodes)', () => {
    const edges = new Map<string, string[]>()
    const result = toposort({ nodeIds: ['X', 'Y', 'Z'], edges })
    expect(result).toHaveLength(3)
    expect(result).toEqual(expect.arrayContaining(['X', 'Y', 'Z']))
  })

  it('throws a descriptive error when a cycle is detected', () => {
    const edges = new Map([['A', ['B']], ['B', ['A']]])
    expect(() => toposort({ nodeIds: ['A', 'B'], edges })).toThrow(/[Cc]ycle/)
  })

  it('handles a diamond graph (A→B, A→C, B→D, C→D)', () => {
    const edges = new Map([['A', ['B', 'C']], ['B', ['D']], ['C', ['D']]])
    const result = toposort({ nodeIds: ['A', 'B', 'C', 'D'], edges })
    expect(result.indexOf('A')).toBeLessThan(result.indexOf('D'))
    expect(result.indexOf('B')).toBeLessThan(result.indexOf('D'))
    expect(result.indexOf('C')).toBeLessThan(result.indexOf('D'))
  })

  it('throws when a 3-node cycle is present (A→B→C→A)', () => {
    const edges = new Map([['A', ['B']], ['B', ['C']], ['C', ['A']]])
    expect(() => toposort({ nodeIds: ['A', 'B', 'C'], edges })).toThrow(/[Cc]ycle/)
  })
})

// ─── upstreamSubgraph tests ──────────────────────────────────────────────────

describe('upstreamSubgraph', () => {
  it('returns only the target node when it has no deps', () => {
    const edges = new Map<string, string[]>()
    const result = upstreamSubgraph('C', ['A', 'B', 'C'], edges)
    expect(result).toEqual(['C'])
  })

  it('returns the full chain upstream of the target', () => {
    const edges = new Map([['A', ['B']], ['B', ['C']]])
    const result = upstreamSubgraph('C', ['A', 'B', 'C'], edges)
    expect(result).toContain('A')
    expect(result).toContain('B')
    expect(result).toContain('C')
    expect(result).toHaveLength(3)
  })

  it('excludes nodes not in the upstream path', () => {
    // A→B→D, C→D — ask for upstream of B (only A and B, not C)
    const edges = new Map([['A', ['B']], ['C', ['D']], ['B', ['D']]])
    const result = upstreamSubgraph('B', ['A', 'B', 'C', 'D'], edges)
    expect(result).toContain('A')
    expect(result).toContain('B')
    expect(result).not.toContain('C')
    expect(result).not.toContain('D')
  })
})

// ─── ExecutionCache tests ─────────────────────────────────────────────────────

describe('ExecutionCache', () => {
  let cache: ExecutionCache

  beforeEach(() => {
    cache = new ExecutionCache()
  })

  it('returns cache miss when no entry exists', () => {
    expect(cache.isHit('node-1', 'hash123')).toBe(false)
  })

  it('returns cache hit after storing an entry with matching hash', () => {
    cache.set('node-1', 'hash123', { result: 42 })
    expect(cache.isHit('node-1', 'hash123')).toBe(true)
    expect(cache.getOutputs('node-1')).toEqual({ result: 42 })
  })

  it('returns cache miss when hash differs', () => {
    cache.set('node-1', 'hash-old', { result: 1 })
    expect(cache.isHit('node-1', 'hash-new')).toBe(false)
  })

  it('invalidateDownstream removes node and its dependents', () => {
    const adj = new Map([['A', ['B']], ['B', ['C']]])
    cache.set('A', 'h1', {})
    cache.set('B', 'h2', {})
    cache.set('C', 'h3', {})

    cache.invalidateDownstream('A', adj)

    expect(cache.isHit('A', 'h1')).toBe(false)
    expect(cache.isHit('B', 'h2')).toBe(false)
    expect(cache.isHit('C', 'h3')).toBe(false)
  })

  it('invalidateDownstream does not affect nodes outside the path', () => {
    const adj = new Map([['A', ['B']], ['X', ['Y']]])
    cache.set('X', 'hx', {})
    cache.set('Y', 'hy', {})

    cache.invalidateDownstream('A', adj)

    expect(cache.isHit('X', 'hx')).toBe(true)
    expect(cache.isHit('Y', 'hy')).toBe(true)
  })
})

// ─── computeInputHash tests ───────────────────────────────────────────────────

describe('computeInputHash', () => {
  it('produces the same hash for identical inputs and parameters', () => {
    const node = makeNode('n1')
    node.parameters = { brightness: 50 }
    const h1 = computeInputHash(node, { image: 'data:abc' })
    const h2 = computeInputHash(node, { image: 'data:abc' })
    expect(h1).toBe(h2)
  })

  it('produces different hashes when inputs differ', () => {
    const node = makeNode('n1')
    const h1 = computeInputHash(node, { image: 'data:abc' })
    const h2 = computeInputHash(node, { image: 'data:xyz' })
    expect(h1).not.toBe(h2)
  })

  it('produces different hashes when parameters differ', () => {
    const node1 = { ...makeNode('n1'), parameters: { brightness: 10 } }
    const node2 = { ...makeNode('n1'), parameters: { brightness: 20 } }
    const h1 = computeInputHash(node1, {})
    const h2 = computeInputHash(node2, {})
    expect(h1).not.toBe(h2)
  })
})

// ─── ExecutionEngine integration tests ────────────────────────────────────────

describe('ExecutionEngine', () => {
  let registry: NodeRegistry
  let events: ReturnType<typeof vi.fn>
  let engine: ExecutionEngine

  beforeEach(() => {
    registry = NodeRegistry.getInstance()
    registry.clear()
    events = vi.fn()
    engine = new ExecutionEngine(events, undefined, registry)
  })

  // Happy path: linear chain executes in order and outputs propagate
  it('executes a linear chain and propagates outputs', async () => {
    // Node A outputs { image: 'data:abc' } — edge maps A's 'image' port to B's 'image' input
    const defA = makeNodeDef('defA', { image: 'data:abc' })
    const defB: NodeDefinition = {
      id: 'defB',
      name: 'B',
      category: 'test',
      inputs: [],
      outputs: [],
      execute: vi.fn().mockImplementation((inputs) =>
        Promise.resolve({ processed: inputs['image'] })
      )
    }
    registry.register(defA)
    registry.register(defB)

    // Edge uses 'image' as both sourceHandle and targetHandle
    const edges: WorkflowEdge[] = [
      { id: 'e1', source: 'A', sourceHandle: 'image', target: 'B', targetHandle: 'image' }
    ]
    const graph = makeGraph(
      [makeNode('A', 'defA'), makeNode('B', 'defB')],
      edges
    )

    await engine.runAll('run-1', graph)

    expect(defA.execute).toHaveBeenCalledTimes(1)
    expect(defB.execute).toHaveBeenCalledWith(
      expect.objectContaining({ image: 'data:abc' }),
      expect.any(Object)
    )

    const completedEvents = events.mock.calls
      .map(([e]) => e)
      .filter((e) => e.type === 'node-completed')
    expect(completedEvents).toHaveLength(2)
  })

  // Edge case 1: cycle detection prevents execution
  it('throws before execution when graph contains a cycle', async () => {
    registry.register(makeNodeDef('defA'))
    registry.register(makeNodeDef('defB'))

    const graph = makeGraph(
      [makeNode('A', 'defA'), makeNode('B', 'defB')],
      [makeEdge('A', 'B'), makeEdge('B', 'A')]
    )

    await expect(engine.runAll('run-2', graph)).rejects.toThrow(/[Cc]ycle/)
  })

  // Edge case 2: cache hit skips re-execution on second run
  it('skips re-execution of unchanged nodes on second run', async () => {
    const defA = makeNodeDef('defA', { value: 5 })
    registry.register(defA)

    const graph = makeGraph([makeNode('A', 'defA')])

    await engine.runAll('run-3a', graph)
    await engine.runAll('run-3b', graph)

    // execute should only be called once — second run should hit cache
    expect(defA.execute).toHaveBeenCalledTimes(1)
  })

  // Edge case 3: cancellation stops pending node executions
  it('stops execution when cancel is called mid-run', async () => {
    const defA = makeNodeDef('defA', { value: 1 })
    const defB: NodeDefinition = {
      id: 'defB',
      name: 'B',
      category: 'test',
      inputs: [],
      outputs: [],
      execute: vi.fn().mockImplementation((_inputs, _ctx) => {
        // Cancel the run from inside the node
        engine.cancel('run-cancel')
        return Promise.resolve({ done: true })
      })
    }
    registry.register(defA)
    registry.register(defB)

    const defC = makeNodeDef('defC', {})
    registry.register(defC)

    const graph = makeGraph(
      [makeNode('A', 'defA'), makeNode('B', 'defB'), makeNode('C', 'defC')],
      [makeEdge('A', 'B'), makeEdge('B', 'C')]
    )

    await engine.runAll('run-cancel', graph)

    // C should NOT have been executed because B cancelled the run
    expect(defC.execute).toHaveBeenCalledTimes(0)
  })

  // Edge case 4: per-node run executes only upstream subgraph
  it('runNode executes only the target node and its upstream deps', async () => {
    const defA = makeNodeDef('defA', { v: 1 })
    const defB = makeNodeDef('defB', { v: 2 })
    const defC = makeNodeDef('defC', { v: 3 })
    registry.register(defA)
    registry.register(defB)
    registry.register(defC)

    // A→C, B→C (so running C runs A and B too)
    // Also D is disconnected
    const defD = makeNodeDef('defD', {})
    registry.register(defD)

    const graph = makeGraph(
      [makeNode('A', 'defA'), makeNode('B', 'defB'), makeNode('C', 'defC'), makeNode('D', 'defD')],
      [makeEdge('A', 'C'), makeEdge('B', 'C')]
    )

    await engine.runNode('run-node', 'C', graph)

    expect(defA.execute).toHaveBeenCalledTimes(1)
    expect(defB.execute).toHaveBeenCalledTimes(1)
    expect(defC.execute).toHaveBeenCalledTimes(1)
    expect(defD.execute).toHaveBeenCalledTimes(0)
  })

  // Edge case 5: node not found in registry emits node-error event
  it('emits node-error when node definition is not found in registry', async () => {
    const graph = makeGraph([makeNode('A', 'missing-def')])

    await engine.runAll('run-missing', graph)

    const errorEvents = events.mock.calls
      .map(([e]) => e)
      .filter((e) => e.type === 'node-error')
    expect(errorEvents).toHaveLength(1)
    expect(errorEvents[0].error).toMatch(/missing-def/)
  })

  // Edge case 6: run-completed event fires after successful execution
  it('emits run-completed event after successful execution', async () => {
    registry.register(makeNodeDef('defA', {}))
    const graph = makeGraph([makeNode('A', 'defA')])

    await engine.runAll('run-complete', graph)

    const completedEvents = events.mock.calls
      .map(([e]) => e)
      .filter((e) => e.type === 'run-completed')
    expect(completedEvents).toHaveLength(1)
    expect(completedEvents[0].runId).toBe('run-complete')
  })
})

// ─── buildAdjacency tests ─────────────────────────────────────────────────────

describe('buildAdjacency', () => {
  it('correctly maps source nodes to their target nodes', () => {
    const edges: WorkflowEdge[] = [
      makeEdge('A', 'B'),
      makeEdge('A', 'C'),
      makeEdge('B', 'D')
    ]
    const adj = buildAdjacency(edges)
    expect(adj.get('A')).toEqual(expect.arrayContaining(['B', 'C']))
    expect(adj.get('B')).toEqual(['D'])
    expect(adj.get('C')).toBeUndefined()
  })

  it('deduplicates parallel edges between the same nodes', () => {
    const edges: WorkflowEdge[] = [
      { id: 'e1', source: 'A', sourceHandle: 'out1', target: 'B', targetHandle: 'in1' },
      { id: 'e2', source: 'A', sourceHandle: 'out2', target: 'B', targetHandle: 'in2' }
    ]
    const adj = buildAdjacency(edges)
    expect(adj.get('A')).toHaveLength(1)
    expect(adj.get('A')).toEqual(['B'])
  })
})
