/**
 * Tests for connection validation and type compatibility.
 * Covers: isTypeCompatible, validateConnection, buildTypedEdgeData,
 * getSourcePortColor.
 */
import { describe, it, expect } from 'vitest'
import { isTypeCompatible, PORT_TYPE_REGISTRY } from '../shared/types'
import {
  validateConnection,
  buildTypedEdgeData,
  getSourcePortColor
} from '../renderer/src/utils/connection-utils'
import type { Node, Edge, Connection } from '@xyflow/react'
import type { NodeDefinition } from '../shared/types'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeNode(
  id: string,
  inputs: Array<{ id: string; type: string }>,
  outputs: Array<{ id: string; type: string }>
): Node {
  const definition: Partial<NodeDefinition> = {
    id,
    name: id,
    category: 'test',
    inputs: inputs.map(p => ({ id: p.id, label: p.id, type: p.type })),
    outputs: outputs.map(p => ({ id: p.id, label: p.id, type: p.type })),
    execute: async () => ({})
  }

  return {
    id,
    type: 'generic',
    position: { x: 0, y: 0 },
    data: { definition }
  } as Node
}

function makeConnection(
  source: string,
  target: string,
  sourceHandle: string | null = null,
  targetHandle: string | null = null
): Connection {
  return { source, target, sourceHandle, targetHandle }
}

function makeEdge(
  id: string,
  source: string,
  target: string,
  sourceHandle?: string,
  targetHandle?: string
): Edge {
  return {
    id,
    source,
    target,
    sourceHandle: sourceHandle ?? null,
    targetHandle: targetHandle ?? null
  } as Edge
}

// ─── isTypeCompatible ─────────────────────────────────────────────────────────

describe('isTypeCompatible', () => {
  // Happy path: same types are compatible
  it('allows same-type connections (IMAGE → IMAGE)', () => {
    expect(isTypeCompatible('IMAGE', 'IMAGE')).toBe(true)
  })

  it('allows same-type connections (NUMBER → NUMBER)', () => {
    expect(isTypeCompatible('NUMBER', 'NUMBER')).toBe(true)
  })

  // ANY is universal
  it('allows ANY source to connect to any target type', () => {
    expect(isTypeCompatible('ANY', 'IMAGE')).toBe(true)
    expect(isTypeCompatible('ANY', 'NUMBER')).toBe(true)
    expect(isTypeCompatible('ANY', 'TEXT')).toBe(true)
  })

  it('allows any source type to connect to ANY target', () => {
    expect(isTypeCompatible('IMAGE', 'ANY')).toBe(true)
    expect(isTypeCompatible('NUMBER', 'ANY')).toBe(true)
  })

  // Negative: incompatible types
  it('rejects IMAGE → NUMBER connection', () => {
    expect(isTypeCompatible('IMAGE', 'NUMBER')).toBe(false)
  })

  it('rejects TEXT → IMAGE connection', () => {
    expect(isTypeCompatible('TEXT', 'IMAGE')).toBe(false)
  })

  it('rejects JSON → NUMBER connection', () => {
    expect(isTypeCompatible('JSON', 'NUMBER')).toBe(false)
  })
})

// ─── validateConnection ───────────────────────────────────────────────────────

describe('validateConnection', () => {
  const imageNode = makeNode('node-a', [], [{ id: 'out', type: 'IMAGE' }])
  const imageTargetNode = makeNode('node-b', [{ id: 'in', type: 'IMAGE' }], [])
  const numberTargetNode = makeNode('node-c', [{ id: 'in', type: 'NUMBER' }], [])
  const anySourceNode = makeNode('node-d', [], [{ id: 'out', type: 'ANY' }])
  const anyTargetNode = makeNode('node-e', [{ id: 'in', type: 'ANY' }], [])

  const nodes: Node[] = [imageNode, imageTargetNode, numberTargetNode, anySourceNode, anyTargetNode]

  // Happy path: compatible types
  it('accepts IMAGE output → IMAGE input', () => {
    const conn = makeConnection('node-a', 'node-b', 'out', 'in')
    expect(validateConnection(conn, nodes, [])).toBe(true)
  })

  it('accepts ANY output → IMAGE input', () => {
    const conn = makeConnection('node-d', 'node-b', 'out', 'in')
    expect(validateConnection(conn, nodes, [])).toBe(true)
  })

  it('accepts IMAGE output → ANY input', () => {
    const conn = makeConnection('node-a', 'node-e', 'out', 'in')
    expect(validateConnection(conn, nodes, [])).toBe(true)
  })

  // Edge case 1: incompatible types are rejected
  it('rejects IMAGE output → NUMBER input', () => {
    const conn = makeConnection('node-a', 'node-c', 'out', 'in')
    expect(validateConnection(conn, nodes, [])).toBe(false)
  })

  // Edge case 2: self-connections are rejected
  it('rejects self-connection (source === target)', () => {
    const conn = makeConnection('node-a', 'node-a', 'out', 'in')
    expect(validateConnection(conn, nodes, [])).toBe(false)
  })

  // Edge case 3: duplicate connections are rejected
  it('rejects duplicate connection (same source port → same target port)', () => {
    const existing = makeEdge('e1', 'node-a', 'node-b', 'out', 'in')
    const conn = makeConnection('node-a', 'node-b', 'out', 'in')
    expect(validateConnection(conn, nodes, [existing])).toBe(false)
  })

  // Edge case 4: different handle = not a duplicate
  it('allows a second connection from same source to same target but different handles', () => {
    const imageNode2 = makeNode('node-f', [], [
      { id: 'out1', type: 'IMAGE' },
      { id: 'out2', type: 'IMAGE' }
    ])
    const targetNode2 = makeNode('node-g', [
      { id: 'in1', type: 'IMAGE' },
      { id: 'in2', type: 'IMAGE' }
    ], [])

    const existing = makeEdge('e1', 'node-f', 'node-g', 'out1', 'in1')
    const conn = makeConnection('node-f', 'node-g', 'out2', 'in2')
    const allNodes = [...nodes, imageNode2, targetNode2]
    expect(validateConnection(conn, allNodes, [existing])).toBe(true)
  })

  // Edge case 5: missing nodes are rejected
  it('rejects connection if source node does not exist', () => {
    const conn = makeConnection('nonexistent', 'node-b', 'out', 'in')
    expect(validateConnection(conn, nodes, [])).toBe(false)
  })
})

// ─── buildTypedEdgeData ───────────────────────────────────────────────────────

describe('buildTypedEdgeData', () => {
  const imageSource = makeNode('src', [], [{ id: 'output', type: 'IMAGE' }])
  const nodes: Node[] = [imageSource]

  // Happy path: edge data has the source port color
  it('returns the IMAGE color for an IMAGE source port', () => {
    const conn = makeConnection('src', 'dest', 'output', 'in')
    const data = buildTypedEdgeData(conn, nodes)
    expect(data.color).toBe(PORT_TYPE_REGISTRY.IMAGE.color)
  })

  // Edge case: unknown source node falls back to ANY color
  it('falls back to ANY color when source node is not found', () => {
    const conn = makeConnection('missing', 'dest', 'output', 'in')
    const data = buildTypedEdgeData(conn, nodes)
    expect(data.color).toBe(PORT_TYPE_REGISTRY.ANY.color)
  })
})

// ─── getSourcePortColor ───────────────────────────────────────────────────────

describe('getSourcePortColor', () => {
  // Happy path: returns the correct color for a known port
  it('returns NUMBER color for a NUMBER output port', () => {
    const node = makeNode('n', [], [{ id: 'val', type: 'NUMBER' }])
    const color = getSourcePortColor(node, 'val')
    expect(color).toBe(PORT_TYPE_REGISTRY.NUMBER.color)
  })

  // Edge case: unknown handle id falls back to ANY color
  it('returns ANY color when handle id is not found', () => {
    const node = makeNode('n', [], [{ id: 'val', type: 'IMAGE' }])
    const color = getSourcePortColor(node, 'nonexistent')
    expect(color).toBe(PORT_TYPE_REGISTRY.ANY.color)
  })

  // Edge case: null handle id falls back to ANY color
  it('returns ANY color for null handle id', () => {
    const node = makeNode('n', [], [{ id: 'val', type: 'IMAGE' }])
    const color = getSourcePortColor(node, null)
    expect(color).toBe(PORT_TYPE_REGISTRY.ANY.color)
  })

  // Edge case: node with no definition falls back to ANY color
  it('returns ANY color for a node with no definition', () => {
    const node: Node = {
      id: 'legacy',
      type: 'imageSource',
      position: { x: 0, y: 0 },
      data: { label: 'legacy' }
    } as Node
    const color = getSourcePortColor(node, 'out')
    expect(color).toBe(PORT_TYPE_REGISTRY.ANY.color)
  })
})
