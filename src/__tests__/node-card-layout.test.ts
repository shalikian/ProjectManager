/**
 * Tests for the node card layout feature (issue #53):
 * - IMAGE-output nodes default to 450px width
 * - Utility nodes (no IMAGE outputs) default to 280px width
 * - hasImageOutput helper works correctly
 * - resolveNodeWidth respects explicit width and IMAGE detection
 * - buildNewNode / buildNewNodeAtPosition propagate width in style
 */
import { describe, it, expect } from 'vitest'
import {
  hasImageOutput,
  resolveNodeWidth,
  buildNewNode,
  buildNewNodeAtPosition,
  IMAGE_NODE_WIDTH,
  UTILITY_NODE_WIDTH
} from '../renderer/src/store/flow-node-factory'
import type { NodeDefinition } from '../shared/types'

const mockExecute = async (): Promise<Record<string, unknown>> => ({})

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeDefinition(overrides: Partial<NodeDefinition> = {}): NodeDefinition {
  return {
    id: 'test/node',
    name: 'Test Node',
    category: 'test',
    inputs: [],
    outputs: [],
    execute: mockExecute,
    ...overrides
  }
}

// ─── Constants ────────────────────────────────────────────────────────────────

describe('width constants', () => {
  it('IMAGE_NODE_WIDTH is 450', () => {
    expect(IMAGE_NODE_WIDTH).toBe(450)
  })

  it('UTILITY_NODE_WIDTH is 280', () => {
    expect(UTILITY_NODE_WIDTH).toBe(280)
  })
})

// ─── hasImageOutput ───────────────────────────────────────────────────────────

describe('hasImageOutput', () => {
  // Happy path: node with one IMAGE output
  it('returns true when the definition has an IMAGE output', () => {
    const def = makeDefinition({
      outputs: [{ id: 'img', label: 'Image', type: 'IMAGE' }]
    })
    expect(hasImageOutput(def)).toBe(true)
  })

  // Edge case 1: utility node with TEXT output only
  it('returns false when outputs are non-IMAGE', () => {
    const def = makeDefinition({
      outputs: [{ id: 'txt', label: 'Text', type: 'TEXT' }]
    })
    expect(hasImageOutput(def)).toBe(false)
  })

  // Edge case 2: no outputs at all
  it('returns false when outputs array is empty', () => {
    const def = makeDefinition({ outputs: [] })
    expect(hasImageOutput(def)).toBe(false)
  })

  // Edge case 3: mixed outputs — still counts as image node if any are IMAGE
  it('returns true when at least one output is IMAGE among mixed types', () => {
    const def = makeDefinition({
      outputs: [
        { id: 'txt', label: 'Text', type: 'TEXT' },
        { id: 'img', label: 'Image', type: 'IMAGE' }
      ]
    })
    expect(hasImageOutput(def)).toBe(true)
  })
})

// ─── resolveNodeWidth ─────────────────────────────────────────────────────────

describe('resolveNodeWidth', () => {
  // Happy path: IMAGE definition returns 450
  it('returns IMAGE_NODE_WIDTH for a definition with IMAGE output', () => {
    const def = makeDefinition({
      outputs: [{ id: 'img', label: 'Image', type: 'IMAGE' }]
    })
    expect(resolveNodeWidth(def)).toBe(IMAGE_NODE_WIDTH)
  })

  // Edge case 1: utility definition returns 280
  it('returns UTILITY_NODE_WIDTH for a definition with no IMAGE outputs', () => {
    const def = makeDefinition({
      outputs: [{ id: 'txt', label: 'Text', type: 'TEXT' }]
    })
    expect(resolveNodeWidth(def)).toBe(UTILITY_NODE_WIDTH)
  })

  // Edge case 2: explicit width overrides auto-detection
  it('respects explicit definition.width over IMAGE detection', () => {
    const def = makeDefinition({
      outputs: [{ id: 'img', label: 'Image', type: 'IMAGE' }],
      width: 600
    })
    expect(resolveNodeWidth(def)).toBe(600)
  })

  // Edge case 3: no definition returns undefined
  it('returns undefined when no definition is provided', () => {
    expect(resolveNodeWidth(undefined)).toBeUndefined()
  })
})

// ─── buildNewNode width propagation ──────────────────────────────────────────

describe('buildNewNode — width propagation', () => {
  // Happy path: IMAGE node gets style.width = 450
  it('sets style.width to 450 for a definition with IMAGE output', () => {
    const def = makeDefinition({
      outputs: [{ id: 'img', label: 'Image', type: 'IMAGE' }]
    })
    const node = buildNewNode('generic', 0, def)
    expect((node.style as React.CSSProperties | undefined)?.width).toBe(450)
  })

  // Edge case 1: utility node gets style.width = 280
  it('sets style.width to 280 for a utility definition', () => {
    const def = makeDefinition({
      outputs: [{ id: 'txt', label: 'Text', type: 'TEXT' }]
    })
    const node = buildNewNode('utility.text', 0, def)
    expect((node.style as React.CSSProperties | undefined)?.width).toBe(280)
  })

  // Edge case 2: explicit width honored
  it('sets style.width to explicit definition.width when provided', () => {
    const def = makeDefinition({
      outputs: [{ id: 'img', label: 'Image', type: 'IMAGE' }],
      width: 350
    })
    const node = buildNewNode('generic', 0, def)
    expect((node.style as React.CSSProperties | undefined)?.width).toBe(350)
  })

  // Edge case 3: no definition means no style.width
  it('does not set style when no definition is provided', () => {
    const node = buildNewNode('imageSource', 0)
    expect(node.style).toBeUndefined()
  })
})

// ─── buildNewNodeAtPosition width propagation ─────────────────────────────────

describe('buildNewNodeAtPosition — width propagation', () => {
  // Happy path: IMAGE node at given position gets correct width
  it('sets style.width to 450 for IMAGE definition at given position', () => {
    const def = makeDefinition({
      outputs: [{ id: 'img', label: 'Image', type: 'IMAGE' }]
    })
    const node = buildNewNodeAtPosition('generic', 100, 200, def)
    expect(node.position.x).toBe(100)
    expect(node.position.y).toBe(200)
    expect((node.style as React.CSSProperties | undefined)?.width).toBe(450)
  })

  // Edge case 1: utility node at position gets width 280
  it('sets style.width to 280 for utility definition at given position', () => {
    const def = makeDefinition({
      outputs: [{ id: 'txt', label: 'Text', type: 'TEXT' }]
    })
    const node = buildNewNodeAtPosition('utility.text', 50, 75, def)
    expect((node.style as React.CSSProperties | undefined)?.width).toBe(280)
  })

  // Edge case 2: no definition at position — no style
  it('does not set style when no definition is provided', () => {
    const node = buildNewNodeAtPosition('filter', 0, 0)
    expect(node.style).toBeUndefined()
  })

  // Edge case 3: explicit width wins over IMAGE auto-detection
  it('respects explicit definition.width at position', () => {
    const def = makeDefinition({
      outputs: [{ id: 'img', label: 'Image', type: 'IMAGE' }],
      width: 500
    })
    const node = buildNewNodeAtPosition('generic', 0, 0, def)
    expect((node.style as React.CSSProperties | undefined)?.width).toBe(500)
  })
})
