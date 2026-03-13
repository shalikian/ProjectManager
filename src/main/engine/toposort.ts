/**
 * Kahn's algorithm for topological sorting and cycle detection.
 *
 * Given a list of node ids and a map of edges (source → target),
 * returns the nodes in topological execution order.
 * Throws if the graph contains a cycle.
 */

export interface ToposortInput {
  nodeIds: string[]
  /** adjacency list: nodeId → set of node ids it must run before */
  edges: Map<string, string[]>
}

/**
 * Run Kahn's algorithm on the provided graph.
 *
 * @returns Ordered array of node ids (sources first, sinks last).
 * @throws  Error with a descriptive message if a cycle is detected.
 */
export function toposort(input: ToposortInput): string[] {
  const { nodeIds, edges } = input

  // Build in-degree map and adjacency list
  const inDegree = buildInDegreeMap(nodeIds, edges)
  const adjacency = buildAdjacency(nodeIds, edges)

  // Initialise the queue with nodes that have no incoming edges
  const queue: string[] = []
  for (const id of nodeIds) {
    if (inDegree.get(id) === 0) {
      queue.push(id)
    }
  }

  const sorted: string[] = []

  while (queue.length > 0) {
    const node = queue.shift()!
    sorted.push(node)

    const neighbours = adjacency.get(node) ?? []
    for (const neighbour of neighbours) {
      const degree = (inDegree.get(neighbour) ?? 0) - 1
      inDegree.set(neighbour, degree)
      if (degree === 0) {
        queue.push(neighbour)
      }
    }
  }

  if (sorted.length !== nodeIds.length) {
    const remaining = nodeIds.filter(id => !sorted.includes(id))
    throw new Error(
      `Cycle detected in workflow graph. Nodes involved: ${remaining.join(', ')}`
    )
  }

  return sorted
}

/** Build a map of nodeId → in-degree (number of incoming edges). */
function buildInDegreeMap(
  nodeIds: string[],
  edges: Map<string, string[]>
): Map<string, number> {
  const inDegree = new Map<string, number>()
  for (const id of nodeIds) {
    inDegree.set(id, 0)
  }
  for (const targets of edges.values()) {
    for (const target of targets) {
      inDegree.set(target, (inDegree.get(target) ?? 0) + 1)
    }
  }
  return inDegree
}

/** Build an adjacency list: nodeId → list of node ids it points to. */
function buildAdjacency(
  nodeIds: string[],
  edges: Map<string, string[]>
): Map<string, string[]> {
  const adjacency = new Map<string, string[]>()
  for (const id of nodeIds) {
    adjacency.set(id, [])
  }
  for (const [source, targets] of edges.entries()) {
    adjacency.set(source, [...targets])
  }
  return adjacency
}

/**
 * Extract only the subgraph of upstream dependencies for a given target node.
 * Returns the set of node ids that must execute before (and including) the target.
 */
export function upstreamSubgraph(
  targetNodeId: string,
  allNodeIds: string[],
  edges: Map<string, string[]>
): string[] {
  // Build reverse adjacency: target → sources
  const reverseAdj = buildReverseAdjacency(allNodeIds, edges)

  // BFS from targetNodeId backwards
  const visited = new Set<string>()
  const queue = [targetNodeId]

  while (queue.length > 0) {
    const current = queue.shift()!
    if (visited.has(current)) continue
    visited.add(current)
    const parents = reverseAdj.get(current) ?? []
    for (const parent of parents) {
      if (!visited.has(parent)) {
        queue.push(parent)
      }
    }
  }

  return Array.from(visited)
}

/** Build a reverse adjacency map: nodeId → list of node ids that point to it. */
function buildReverseAdjacency(
  nodeIds: string[],
  edges: Map<string, string[]>
): Map<string, string[]> {
  const reverse = new Map<string, string[]>()
  for (const id of nodeIds) {
    reverse.set(id, [])
  }
  for (const [source, targets] of edges.entries()) {
    for (const target of targets) {
      const existing = reverse.get(target) ?? []
      existing.push(source)
      reverse.set(target, existing)
    }
  }
  return reverse
}
