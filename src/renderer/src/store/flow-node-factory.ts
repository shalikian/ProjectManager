import { Node } from '@xyflow/react'
import type { NodeType, NodeDefinition } from '../../../shared/types'

const NODE_LABELS: Record<string, string> = {
  imageSource: 'Image Source',
  filter: 'Filter',
  output: 'Output',
  custom: 'Custom'
}

/** Resolve a display label for a node type, using definition name if available. */
function resolveLabel(type: NodeType, definition?: NodeDefinition): string {
  if (definition?.name) return definition.name
  return NODE_LABELS[type] ?? type
}

/**
 * Builds a new React Flow node at a staggered position.
 * If a NodeDefinition is provided (for plugin nodes), it is stored in
 * node.data.definition so GenericNode can access port/parameter metadata.
 */
export function buildNewNode(
  type: NodeType,
  existingCount: number,
  definition?: NodeDefinition
): Node {
  const offset = existingCount * 20
  return {
    id: `${type}-${Date.now()}`,
    type,
    position: {
      x: 200 + offset,
      y: 100 + offset
    },
    data: {
      label: resolveLabel(type, definition),
      ...(definition ? { definition } : {})
    }
  }
}

/**
 * Builds a new React Flow node at the given canvas position.
 * If a NodeDefinition is provided (for plugin nodes), it is stored in
 * node.data.definition so GenericNode can access port/parameter metadata.
 */
export function buildNewNodeAtPosition(
  type: NodeType,
  x: number,
  y: number,
  definition?: NodeDefinition
): Node {
  return {
    id: `${type}-${Date.now()}`,
    type,
    position: { x, y },
    data: {
      label: resolveLabel(type, definition),
      ...(definition ? { definition } : {})
    }
  }
}
