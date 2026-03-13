import { describe, it, expect } from 'vitest'
import { buildNewNode, buildNewNodeAtPosition } from '../renderer/src/store/flow-node-factory'
import type { NodeType, NodeDefinition } from '../shared/types'

const mockExecute = async (): Promise<Record<string, unknown>> => ({})

const sampleDefinition: NodeDefinition = {
  id: 'utility.text',
  name: 'Text',
  category: 'Utility',
  description: 'Text node',
  inputs: [],
  outputs: [{ id: 'text', label: 'Text', type: 'TEXT' }],
  execute: mockExecute
}

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

  // Edge case 1: all built-in node types get correct labels
  it('assigns correct labels to each built-in node type', () => {
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

  // Plugin node: definition is stored in node.data
  it('stores NodeDefinition in data when provided', () => {
    const node = buildNewNode('utility.text', 0, sampleDefinition)
    expect(node.type).toBe('utility.text')
    expect(node.data.label).toBe('Text')
    expect(node.data.definition).toBe(sampleDefinition)
  })

  // Plugin node: unknown type without definition falls back to type as label
  it('uses type as label for unknown plugin node without definition', () => {
    const node = buildNewNode('some.unknown.node', 0)
    expect(node.data.label).toBe('some.unknown.node')
    expect(node.data.definition).toBeUndefined()
  })
})

describe('buildNewNodeAtPosition', () => {
  // Happy path: creates node at exact position
  it('creates a node at the specified position', () => {
    const node = buildNewNodeAtPosition('filter', 400, 250)
    expect(node.type).toBe('filter')
    expect(node.position.x).toBe(400)
    expect(node.position.y).toBe(250)
    expect(node.data.label).toBe('Filter')
  })

  // Stores definition when provided
  it('stores NodeDefinition in data when provided', () => {
    const node = buildNewNodeAtPosition('utility.text', 100, 200, sampleDefinition)
    expect(node.type).toBe('utility.text')
    expect(node.data.label).toBe('Text')
    expect(node.data.definition).toBe(sampleDefinition)
  })

  // No definition — no data.definition key
  it('does not set data.definition when no definition provided', () => {
    const node = buildNewNodeAtPosition('filter', 0, 0)
    expect(node.data.definition).toBeUndefined()
  })
})
