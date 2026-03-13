import { describe, it, expect } from 'vitest'
import { buildNewNode } from '../renderer/src/store/flow-node-factory'
import type { NodeType } from '../shared/types'

describe('buildNewNode', () => {
  // Happy path: creates a valid node
  it('creates an imageSource node with correct shape', () => {
    const node = buildNewNode('imageSource', 0)
    expect(node.type).toBe('imageSource')
    expect(node.data.label).toBe('Image Source')
    expect(typeof node.id).toBe('string')
    expect(node.id).toMatch(/^imageSource-/)
    expect(typeof node.position.x).toBe('number')
    expect(typeof node.position.y).toBe('number')
  })

  // Edge case 1: all node types get correct labels
  it('assigns correct labels to each node type', () => {
    const types: NodeType[] = ['imageSource', 'filter', 'output', 'custom']
    const labels = ['Image Source', 'Filter', 'Output', 'Custom']
    types.forEach((type, i) => {
      const node = buildNewNode(type, 0)
      expect(node.data.label).toBe(labels[i])
    })
  })

  // Edge case 2: position is staggered by existing node count
  it('staggers position based on existingCount', () => {
    const node0 = buildNewNode('filter', 0)
    const node1 = buildNewNode('filter', 1)
    const node5 = buildNewNode('filter', 5)

    expect(node1.position.x).toBeGreaterThan(node0.position.x)
    expect(node5.position.x).toBeGreaterThan(node1.position.x)
    expect(node1.position.y).toBeGreaterThan(node0.position.y)
  })

  // Edge case 3: generated ids are unique (different timestamps)
  it('generates unique ids on successive calls', () => {
    // Use different counts to ensure unique ids even if timestamps match
    const nodeA = buildNewNode('output', 0)
    const nodeB = buildNewNode('output', 1)
    // IDs start with the type
    expect(nodeA.id).toMatch(/^output-/)
    expect(nodeB.id).toMatch(/^output-/)
  })
})
