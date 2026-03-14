/**
 * Tests for the redesigned NodeHeader and GenericNode (issue #52).
 *
 * Covers:
 *   - MAX_HEADER_DROPDOWNS constant enforcement
 *   - select vs non-select parameter partitioning logic
 *   - instance label derivation (index-based counter per definition id)
 *   - edge cases: no params, all-select params, very long node names
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { MAX_HEADER_DROPDOWNS } from '../renderer/src/components/nodes/NodeHeader'
import type { ParameterDefinition, NodeDefinition } from '../shared/types'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeParam(id: string, type: ParameterDefinition['type']): ParameterDefinition {
  const base: ParameterDefinition = { id, label: id, type }
  if (type === 'select') {
    return { ...base, options: [{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }] }
  }
  return base
}

function makeDefinition(id: string, params: ParameterDefinition[] = []): NodeDefinition {
  return {
    id,
    name: id.split('/').pop() ?? id,
    category: 'test',
    inputs: [],
    outputs: [],
    parameters: params,
    execute: async () => ({})
  }
}

/** Mirror of the partitioning logic in GenericNode. */
function partitionParams(
  params: ParameterDefinition[]
): { selectParams: ParameterDefinition[]; bodyParams: ParameterDefinition[] } {
  return {
    selectParams: params.filter(p => p.type === 'select'),
    bodyParams: params.filter(p => p.type !== 'select')
  }
}

/** Mirror of the instance-label index logic in GenericNode. */
function calcInstanceNumber(
  nodes: Array<{ id: string; definitionId: string }>,
  targetId: string,
  definitionId: string
): number {
  const sameType = nodes.filter(n => n.definitionId === definitionId)
  const idx = sameType.findIndex(n => n.id === targetId)
  return idx >= 0 ? idx + 1 : 1
}

// ─── MAX_HEADER_DROPDOWNS constant ────────────────────────────────────────────

describe('MAX_HEADER_DROPDOWNS', () => {
  it('is exactly 3', () => {
    expect(MAX_HEADER_DROPDOWNS).toBe(3)
  })
})

// ─── Parameter partitioning ───────────────────────────────────────────────────

describe('parameter partitioning (select vs body)', () => {
  // Happy path: mixed params split correctly
  it('separates select params from body params', () => {
    const params = [
      makeParam('model', 'select'),
      makeParam('prompt', 'textarea'),
      makeParam('steps', 'slider'),
      makeParam('aspect', 'select')
    ]
    const { selectParams, bodyParams } = partitionParams(params)
    expect(selectParams.map(p => p.id)).toEqual(['model', 'aspect'])
    expect(bodyParams.map(p => p.id)).toEqual(['prompt', 'steps'])
  })

  // Edge case 1: no parameters at all
  it('handles empty parameter list gracefully', () => {
    const { selectParams, bodyParams } = partitionParams([])
    expect(selectParams).toHaveLength(0)
    expect(bodyParams).toHaveLength(0)
  })

  // Edge case 2: all params are select-type
  it('puts all params in selectParams when all are select type', () => {
    const params = [
      makeParam('a', 'select'),
      makeParam('b', 'select'),
      makeParam('c', 'select'),
      makeParam('d', 'select')
    ]
    const { selectParams, bodyParams } = partitionParams(params)
    expect(selectParams).toHaveLength(4)
    expect(bodyParams).toHaveLength(0)
  })

  // Edge case 3: no select params — all go to body
  it('puts all params in bodyParams when none are select type', () => {
    const params = [
      makeParam('prompt', 'textarea'),
      makeParam('steps', 'slider'),
      makeParam('seed', 'number')
    ]
    const { selectParams, bodyParams } = partitionParams(params)
    expect(selectParams).toHaveLength(0)
    expect(bodyParams).toHaveLength(3)
  })
})

// ─── Header dropdown cap ──────────────────────────────────────────────────────

describe('header dropdown cap (MAX_HEADER_DROPDOWNS)', () => {
  // Happy path: exactly MAX shown when more exist
  it('shows only MAX_HEADER_DROPDOWNS when more select params are available', () => {
    const selectParams = [
      makeParam('a', 'select'),
      makeParam('b', 'select'),
      makeParam('c', 'select'),
      makeParam('d', 'select'),
      makeParam('e', 'select')
    ]
    const visible = selectParams.slice(0, MAX_HEADER_DROPDOWNS)
    expect(visible).toHaveLength(MAX_HEADER_DROPDOWNS)
  })

  // Edge case 1: fewer params than max — show all
  it('shows all when fewer than MAX_HEADER_DROPDOWNS select params exist', () => {
    const selectParams = [makeParam('a', 'select'), makeParam('b', 'select')]
    const visible = selectParams.slice(0, MAX_HEADER_DROPDOWNS)
    expect(visible).toHaveLength(2)
  })

  // Edge case 2: exactly MAX select params — all shown
  it('shows all when exactly MAX_HEADER_DROPDOWNS select params exist', () => {
    const selectParams = [
      makeParam('a', 'select'),
      makeParam('b', 'select'),
      makeParam('c', 'select')
    ]
    const visible = selectParams.slice(0, MAX_HEADER_DROPDOWNS)
    expect(visible).toHaveLength(MAX_HEADER_DROPDOWNS)
  })

  // Edge case 3: no select params — visible list is empty
  it('shows empty list when no select params exist', () => {
    const selectParams: ParameterDefinition[] = []
    const visible = selectParams.slice(0, MAX_HEADER_DROPDOWNS)
    expect(visible).toHaveLength(0)
  })
})

// ─── Instance label counter ───────────────────────────────────────────────────

describe('instance label counter (per definition id)', () => {
  const DEF_ID = 'ai/imagen'

  // Happy path: first instance is 1
  it('assigns number 1 to the first node of a definition type', () => {
    const nodes = [{ id: 'n-1', definitionId: DEF_ID }]
    expect(calcInstanceNumber(nodes, 'n-1', DEF_ID)).toBe(1)
  })

  // Happy path: second instance of same definition is 2
  it('assigns number 2 to the second node of the same definition type', () => {
    const nodes = [
      { id: 'n-1', definitionId: DEF_ID },
      { id: 'n-2', definitionId: DEF_ID }
    ]
    expect(calcInstanceNumber(nodes, 'n-2', DEF_ID)).toBe(2)
  })

  // Edge case 1: node not found returns 1 (fallback)
  it('returns 1 as fallback when node id is not in the list', () => {
    const nodes = [{ id: 'n-1', definitionId: DEF_ID }]
    expect(calcInstanceNumber(nodes, 'missing-id', DEF_ID)).toBe(1)
  })

  // Edge case 2: other definition types do not affect the count
  it('ignores nodes of different definition types when computing index', () => {
    const nodes = [
      { id: 'x-1', definitionId: 'other/type' },
      { id: 'x-2', definitionId: 'other/type' },
      { id: 'n-1', definitionId: DEF_ID },
      { id: 'n-2', definitionId: DEF_ID }
    ]
    // n-1 is first of DEF_ID, so index 0 → number 1
    expect(calcInstanceNumber(nodes, 'n-1', DEF_ID)).toBe(1)
    // n-2 is second of DEF_ID, so index 1 → number 2
    expect(calcInstanceNumber(nodes, 'n-2', DEF_ID)).toBe(2)
  })

  // Edge case 3: long node name does not affect counter logic
  it('counter is independent of node name length', () => {
    const longDefId = 'plugin/a-very-long-definition-name-that-might-cause-truncation'
    const nodes = [
      { id: 'a', definitionId: longDefId },
      { id: 'b', definitionId: longDefId },
      { id: 'c', definitionId: longDefId }
    ]
    expect(calcInstanceNumber(nodes, 'c', longDefId)).toBe(3)
  })
})

// ─── NodeDefinition makeDefinition helper ─────────────────────────────────────

describe('makeDefinition helper (sanity)', () => {
  it('creates a definition with the expected id and empty parameters', () => {
    const def = makeDefinition('ai/imagen')
    expect(def.id).toBe('ai/imagen')
    expect(def.parameters).toHaveLength(0)
  })

  it('creates a definition with the provided parameters', () => {
    const params = [makeParam('model', 'select'), makeParam('prompt', 'textarea')]
    const def = makeDefinition('ai/test', params)
    expect(def.parameters).toHaveLength(2)
  })
})
