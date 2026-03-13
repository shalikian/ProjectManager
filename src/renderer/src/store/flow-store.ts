import { create } from 'zustand'
import {
  Node,
  Edge,
  NodeChange,
  EdgeChange,
  applyNodeChanges,
  applyEdgeChanges
} from '@xyflow/react'
import type { NodeType } from '../../../shared/types'
import { createInitialNodes, createInitialEdges } from './flow-initial-state'
import { buildNewNode } from './flow-node-factory'

interface FlowState {
  nodes: Node[]
  edges: Edge[]
  onNodesChange: (changes: NodeChange[]) => void
  onEdgesChange: (changes: EdgeChange[]) => void
  setEdges: (updater: (edges: Edge[]) => Edge[]) => void
  addNode: (type: NodeType) => void
}

export const useFlowStore = create<FlowState>((set, get) => ({
  nodes: createInitialNodes(),
  edges: createInitialEdges(),

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
  }
}))
