import { Node } from '@xyflow/react'
import type { NodeType } from '../../../shared/types'

const NODE_LABELS: Record<NodeType, string> = {
  imageSource: 'Image Source',
  filter: 'Filter',
  output: 'Output',
  custom: 'Custom'
}

/**
 * Builds a new React Flow node at a staggered position.
 */
export function buildNewNode(type: NodeType, existingCount: number): Node {
  const offset = existingCount * 20
  return {
    id: `${type}-${Date.now()}`,
    type,
    position: {
      x: 200 + offset,
      y: 100 + offset
    },
    data: {
      label: NODE_LABELS[type] ?? type
    }
  }
}
