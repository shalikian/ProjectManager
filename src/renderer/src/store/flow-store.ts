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
import { buildNewNode } from './flow-node-factory'

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
  onNodesChange: (changes: NodeChange[]) => void
  onEdgesChange: (changes: EdgeChange[]) => void
  setEdges: (updater: (edges: Edge[]) => Edge[]) => void
  addNode: (type: NodeType) => void
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
    const nodeCount = get().nodes.length
    const newNode = buildNewNode(type, nodeCount)
    set({ nodes: [...get().nodes, newNode] })
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
