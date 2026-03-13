/**
 * Tests for flow store node selection and position-aware node addition.
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { useFlowStore } from '../renderer/src/store/flow-store'

describe('useFlowStore — selectedNodeId', () => {
  beforeEach(() => {
    useFlowStore.setState({ selectedNodeId: null })
  })

  // Happy path: default is null
  it('initializes with null selectedNodeId', () => {
    const state = useFlowStore.getState()
    expect(state.selectedNodeId).toBeNull()
  })

  // Happy path: setSelectedNode stores the id
  it('setSelectedNode stores the given node id', () => {
    const { setSelectedNode } = useFlowStore.getState()
    setSelectedNode('node-abc')
    expect(useFlowStore.getState().selectedNodeId).toBe('node-abc')
  })

  // Edge case 1: setSelectedNode with null clears the selection
  it('setSelectedNode(null) clears the selection', () => {
    const { setSelectedNode } = useFlowStore.getState()
    setSelectedNode('node-xyz')
    setSelectedNode(null)
    expect(useFlowStore.getState().selectedNodeId).toBeNull()
  })

  // Edge case 2: selecting different nodes replaces the selection
  it('selecting a different node replaces the previous selection', () => {
    const { setSelectedNode } = useFlowStore.getState()
    setSelectedNode('node-1')
    setSelectedNode('node-2')
    expect(useFlowStore.getState().selectedNodeId).toBe('node-2')
  })

  // Edge case 3: addNode sets selectedNodeId to the new node
  it('addNode sets the selectedNodeId to the newly added node', () => {
    const beforeCount = useFlowStore.getState().nodes.length
    const { addNode } = useFlowStore.getState()
    addNode('filter')
    const state = useFlowStore.getState()
    expect(state.nodes.length).toBe(beforeCount + 1)
    const newNode = state.nodes[state.nodes.length - 1]
    expect(state.selectedNodeId).toBe(newNode.id)
  })
})

describe('useFlowStore — addNodeAtPosition', () => {
  beforeEach(() => {
    useFlowStore.setState({ selectedNodeId: null })
  })

  // Happy path: node is created at given position
  it('creates a node at the specified x, y position', () => {
    const beforeCount = useFlowStore.getState().nodes.length
    const { addNodeAtPosition } = useFlowStore.getState()
    addNodeAtPosition('imageSource', 400, 250)

    const state = useFlowStore.getState()
    expect(state.nodes.length).toBe(beforeCount + 1)
    const newNode = state.nodes[state.nodes.length - 1]
    expect(newNode.position.x).toBe(400)
    expect(newNode.position.y).toBe(250)
    expect(newNode.type).toBe('imageSource')
  })

  // Happy path: selectedNodeId is set to the new node
  it('sets selectedNodeId to the newly positioned node', () => {
    const { addNodeAtPosition } = useFlowStore.getState()
    addNodeAtPosition('output', 100, 100)

    const state = useFlowStore.getState()
    const newNode = state.nodes[state.nodes.length - 1]
    expect(state.selectedNodeId).toBe(newNode.id)
  })

  // Edge case 1: position 0,0 is valid
  it('accepts position (0, 0)', () => {
    const { addNodeAtPosition } = useFlowStore.getState()
    addNodeAtPosition('filter', 0, 0)
    const newNode = useFlowStore.getState().nodes.at(-1)
    expect(newNode?.position.x).toBe(0)
    expect(newNode?.position.y).toBe(0)
  })

  // Edge case 2: negative positions are accepted
  it('accepts negative canvas coordinates', () => {
    const { addNodeAtPosition } = useFlowStore.getState()
    addNodeAtPosition('filter', -100, -200)
    const newNode = useFlowStore.getState().nodes.at(-1)
    expect(newNode?.position.x).toBe(-100)
    expect(newNode?.position.y).toBe(-200)
  })

  // Edge case 3: adding multiple nodes at same position is allowed
  it('allows multiple nodes at the same position', () => {
    const { addNodeAtPosition } = useFlowStore.getState()
    addNodeAtPosition('filter', 50, 50)
    addNodeAtPosition('output', 50, 50)
    const state = useFlowStore.getState()
    const at5050 = state.nodes.filter(n => n.position.x === 50 && n.position.y === 50)
    expect(at5050.length).toBeGreaterThanOrEqual(2)
  })
})

describe('buildNewNodeAtPosition', () => {
  it('generates ids prefixed with the node type', () => {
    const { addNodeAtPosition } = useFlowStore.getState()
    addNodeAtPosition('imageSource', 0, 0)
    const newNode = useFlowStore.getState().nodes.at(-1)
    expect(newNode?.id).toMatch(/^imageSource-/)
  })
})
