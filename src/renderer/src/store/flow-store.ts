import { create } from 'zustand'
import {
  Node,
  Edge,
  NodeChange,
  EdgeChange,
  applyNodeChanges,
  applyEdgeChanges
} from '@xyflow/react'
import type { NodeType, NodeExecutionState } from '../../../shared/types'
import { createInitialNodes, createInitialEdges } from './flow-initial-state'
import { buildNewNode, buildNewNodeAtPosition } from './flow-node-factory'
import { useDefinitionStore } from './definition-store'

/** Per-node runtime state: execution status and parameter values. */
export interface NodeRuntimeState {
  executionState: NodeExecutionState
  /** Parameter id -> current value */
  paramValues: Record<string, unknown>
  /** For image-type outputs: data URL or null */
  imagePreviews: Record<string, string | null>
}

interface FlowState {
  nodes: Node[]
  edges: Edge[]
  /** Runtime state keyed by node instance id */
  nodeRuntimeStates: Record<string, NodeRuntimeState>
  /** Currently selected node id, or null */
  selectedNodeId: string | null
  onNodesChange: (changes: NodeChange[]) => void
  onEdgesChange: (changes: EdgeChange[]) => void
  setEdges: (updater: (edges: Edge[]) => Edge[]) => void
  addNode: (type: NodeType) => void
  addNodeAtPosition: (type: NodeType, x: number, y: number) => void
  setSelectedNode: (nodeId: string | null) => void
  setNodeExecutionState: (nodeId: string, state: NodeExecutionState) => void
  setNodeParamValue: (nodeId: string, paramId: string, value: unknown) => void
  setNodeImagePreview: (nodeId: string, outputId: string, dataUrl: string | null) => void
  getOrCreateNodeRuntime: (nodeId: string) => NodeRuntimeState
}

function createDefaultRuntime(): NodeRuntimeState {
  return { executionState: 'idle', paramValues: {}, imagePreviews: {} }
}

export const useFlowStore = create<FlowState>((set, get) => ({
  nodes: createInitialNodes(),
  edges: createInitialEdges(),
  nodeRuntimeStates: {},
  selectedNodeId: null,

  onNodesChange: (changes: NodeChange[]) => {
    set({ nodes: applyNodeChanges(changes, get().nodes) })
  },

  onEdgesChange: (changes: EdgeChange[]) => {
    set({ edges: applyEdgeChanges(changes, get().edges) })
  },

  setEdges: (updater: (edges: Edge[]) => Edge[]) => {
    set({ edges: updater(get().edges) })
  },

  addNode: (type: NodeType) => {
    const definition = useDefinitionStore.getState().getDefinition(type)
    const nodeCount = get().nodes.length
    const newNode = buildNewNode(type, nodeCount, definition)
    set({ nodes: [...get().nodes, newNode], selectedNodeId: newNode.id })
  },

  addNodeAtPosition: (type: NodeType, x: number, y: number) => {
    const definition = useDefinitionStore.getState().getDefinition(type)
    const newNode = buildNewNodeAtPosition(type, x, y, definition)
    set({ nodes: [...get().nodes, newNode], selectedNodeId: newNode.id })
  },

  setSelectedNode: (nodeId: string | null) => {
    set({ selectedNodeId: nodeId })
  },

  getOrCreateNodeRuntime: (nodeId: string): NodeRuntimeState => {
    return get().nodeRuntimeStates[nodeId] ?? createDefaultRuntime()
  },

  setNodeExecutionState: (nodeId: string, state: NodeExecutionState) => {
    const existing = get().nodeRuntimeStates[nodeId] ?? createDefaultRuntime()
    set({
      nodeRuntimeStates: {
        ...get().nodeRuntimeStates,
        [nodeId]: { ...existing, executionState: state }
      }
    })
  },

  setNodeParamValue: (nodeId: string, paramId: string, value: unknown) => {
    const existing = get().nodeRuntimeStates[nodeId] ?? createDefaultRuntime()
    set({
      nodeRuntimeStates: {
        ...get().nodeRuntimeStates,
        [nodeId]: {
          ...existing,
          paramValues: { ...existing.paramValues, [paramId]: value }
        }
      }
    })
  },

  setNodeImagePreview: (nodeId: string, outputId: string, dataUrl: string | null) => {
    const existing = get().nodeRuntimeStates[nodeId] ?? createDefaultRuntime()
    set({
      nodeRuntimeStates: {
        ...get().nodeRuntimeStates,
        [nodeId]: {
          ...existing,
          imagePreviews: { ...existing.imagePreviews, [outputId]: dataUrl }
        }
      }
    })
  }
}))
