/**
 * Tests for GenericNode data structures, type registry, and flow store extensions.
 * These are unit tests that do not require a DOM environment.
 */
import { describe, it, expect, beforeEach } from 'vitest'
import {
  PORT_TYPE_REGISTRY,
  resolvePortType,
  NodeDefinition
} from '../shared/types'
import { buildNodeTypes, BASE_NODE_TYPES } from '../renderer/src/components/nodes/nodeTypeRegistry'
import { useFlowStore } from '../renderer/src/store/flow-store'

// ─── Helper ──────────────────────────────────────────────────────────────────

function makeDefinition(overrides: Partial<NodeDefinition> = {}): NodeDefinition {
  return {
    id: 'test/node',
    name: 'Test Node',
    category: 'test',
    inputs: [{ id: 'in1', label: 'Input', type: 'IMAGE' }],
    outputs: [{ id: 'out1', label: 'Output', type: 'IMAGE' }],
    parameters: [],
    execute: async () => ({}),
    ...overrides
  }
}

// ─── PORT_TYPE_REGISTRY ───────────────────────────────────────────────────────

describe('PORT_TYPE_REGISTRY', () => {
  it('contains all five built-in port types', () => {
    const keys = Object.keys(PORT_TYPE_REGISTRY)
    expect(keys).toContain('IMAGE')
    expect(keys).toContain('TEXT')
    expect(keys).toContain('NUMBER')
    expect(keys).toContain('JSON')
    expect(keys).toContain('ANY')
  })

  it('each port type has id, label, and color fields', () => {
    for (const pt of Object.values(PORT_TYPE_REGISTRY)) {
      expect(typeof pt.id).toBe('string')
      expect(typeof pt.label).toBe('string')
      expect(typeof pt.color).toBe('string')
      expect(pt.color).toMatch(/^#[0-9A-Fa-f]{6}$/)
    }
  })
})

// ─── resolvePortType ─────────────────────────────────────────────────────────

describe('resolvePortType', () => {
  // Happy path
  it('returns the correct type for a known id', () => {
    const pt = resolvePortType('IMAGE')
    expect(pt.id).toBe('IMAGE')
    expect(pt.color).toBe('#64B5F6')
  })

  // Edge case 1: unknown id falls back to ANY
  it('falls back to ANY for unknown ids', () => {
    const pt = resolvePortType('UNKNOWN_TYPE')
    expect(pt.id).toBe('ANY')
  })

  // Edge case 2: case sensitive — lowercase does not match
  it('is case-sensitive (lowercase does not match)', () => {
    const pt = resolvePortType('image')
    expect(pt.id).toBe('ANY')
  })

  // Edge case 3: empty string falls back to ANY
  it('returns ANY for empty string', () => {
    const pt = resolvePortType('')
    expect(pt.id).toBe('ANY')
  })
})

// ─── buildNodeTypes ──────────────────────────────────────────────────────────

describe('buildNodeTypes', () => {
  // Happy path
  it('includes base node types when passed empty definitions', () => {
    const types = buildNodeTypes([])
    expect(types).toHaveProperty('imageSource')
    expect(types).toHaveProperty('filter')
    expect(types).toHaveProperty('output')
  })

  it('adds plugin definition ids as keys', () => {
    const def = makeDefinition({ id: 'plugin/blur' })
    const types = buildNodeTypes([def])
    expect(types).toHaveProperty('plugin/blur')
  })

  // Edge case 1: multiple definitions all registered
  it('registers all provided definitions', () => {
    const defs = [
      makeDefinition({ id: 'a/node1' }),
      makeDefinition({ id: 'b/node2' }),
      makeDefinition({ id: 'c/node3' })
    ]
    const types = buildNodeTypes(defs)
    expect(types).toHaveProperty('a/node1')
    expect(types).toHaveProperty('b/node2')
    expect(types).toHaveProperty('c/node3')
  })

  // Edge case 2: does not lose base types when definitions provided
  it('preserves base types when definitions are provided', () => {
    const types = buildNodeTypes([makeDefinition({ id: 'x/y' })])
    const baseKeys = Object.keys(BASE_NODE_TYPES)
    for (const key of baseKeys) {
      expect(types).toHaveProperty(key)
    }
  })

  // Edge case 3: definition id can contain slashes
  it('handles definition ids with slashes', () => {
    const def = makeDefinition({ id: 'my-plugin/some/deep/id' })
    const types = buildNodeTypes([def])
    expect(types).toHaveProperty('my-plugin/some/deep/id')
  })
})

// ─── Flow store runtime state ─────────────────────────────────────────────────

describe('useFlowStore runtime state', () => {
  beforeEach(() => {
    // Reset runtime states between tests
    useFlowStore.setState({ nodeRuntimeStates: {} })
  })

  // Happy path
  it('getOrCreateNodeRuntime returns idle state for new node', () => {
    const { getOrCreateNodeRuntime } = useFlowStore.getState()
    const runtime = getOrCreateNodeRuntime('node-abc')
    expect(runtime.executionState).toBe('idle')
    expect(runtime.paramValues).toEqual({})
    expect(runtime.imagePreviews).toEqual({})
  })

  it('setNodeExecutionState updates the state', () => {
    const { setNodeExecutionState } = useFlowStore.getState()
    setNodeExecutionState('node-1', 'running')
    const runtime = useFlowStore.getState().nodeRuntimeStates['node-1']
    expect(runtime.executionState).toBe('running')
  })

  // Edge case 1: setNodeParamValue stores value
  it('setNodeParamValue stores parameter value', () => {
    const { setNodeParamValue } = useFlowStore.getState()
    setNodeParamValue('node-2', 'prompt', 'hello world')
    const runtime = useFlowStore.getState().nodeRuntimeStates['node-2']
    expect(runtime.paramValues['prompt']).toBe('hello world')
  })

  // Edge case 2: setNodeImagePreview stores data URL
  it('setNodeImagePreview stores image data URL', () => {
    const { setNodeImagePreview } = useFlowStore.getState()
    setNodeImagePreview('node-3', 'out1', 'data:image/png;base64,abc')
    const runtime = useFlowStore.getState().nodeRuntimeStates['node-3']
    expect(runtime.imagePreviews['out1']).toBe('data:image/png;base64,abc')
  })

  // Edge case 3: multiple nodes are independent
  it('node runtime states are independent per node', () => {
    const { setNodeExecutionState } = useFlowStore.getState()
    setNodeExecutionState('node-x', 'running')
    setNodeExecutionState('node-y', 'error')
    const states = useFlowStore.getState().nodeRuntimeStates
    expect(states['node-x'].executionState).toBe('running')
    expect(states['node-y'].executionState).toBe('error')
  })

  // Edge case 4: setNodeImagePreview with null clears the preview
  it('setNodeImagePreview with null clears the preview', () => {
    const { setNodeImagePreview } = useFlowStore.getState()
    setNodeImagePreview('node-4', 'out1', 'data:image/png;base64,abc')
    setNodeImagePreview('node-4', 'out1', null)
    const runtime = useFlowStore.getState().nodeRuntimeStates['node-4']
    expect(runtime.imagePreviews['out1']).toBeNull()
  })
})
