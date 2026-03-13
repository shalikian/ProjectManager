import { describe, it, expect } from 'vitest'
import { createInitialNodes, createInitialEdges } from '../renderer/src/store/flow-initial-state'

describe('createInitialNodes', () => {
  // Happy path: returns expected default nodes
  it('returns three initial nodes with correct types', () => {
    const nodes = createInitialNodes()
    expect(nodes).toHaveLength(3)
    expect(nodes[0].type).toBe('imageSource')
    expect(nodes[1].type).toBe('filter')
    expect(nodes[2].type).toBe('output')
  })

  // Edge case 1: each node has a unique id
  it('all nodes have unique ids', () => {
    const nodes = createInitialNodes()
    const ids = nodes.map(n => n.id)
    const unique = new Set(ids)
    expect(unique.size).toBe(ids.length)
  })

  // Edge case 2: each node has position coordinates
  it('all nodes have valid positions', () => {
    const nodes = createInitialNodes()
    nodes.forEach(node => {
      expect(typeof node.position.x).toBe('number')
      expect(typeof node.position.y).toBe('number')
    })
  })

  // Edge case 3: nodes have non-empty labels
  it('all nodes have labels in data', () => {
    const nodes = createInitialNodes()
    nodes.forEach(node => {
      expect(node.data).toBeDefined()
      expect(typeof (node.data as { label: string }).label).toBe('string')
      expect((node.data as { label: string }).label.length).toBeGreaterThan(0)
    })
  })
})

describe('createInitialEdges', () => {
  // Happy path: edges connect the three default nodes
  it('returns two edges connecting source→filter and filter→output', () => {
    const edges = createInitialEdges()
    expect(edges).toHaveLength(2)
    expect(edges[0].source).toBe('source-1')
    expect(edges[0].target).toBe('filter-1')
    expect(edges[1].source).toBe('filter-1')
    expect(edges[1].target).toBe('output-1')
  })

  // Edge case: edges are animated
  it('edges are animated', () => {
    const edges = createInitialEdges()
    edges.forEach(edge => {
      expect(edge.animated).toBe(true)
    })
  })
})
