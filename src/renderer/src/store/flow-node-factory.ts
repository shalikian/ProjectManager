import { Node } from '@xyflow/react'
import type { NodeType, NodeDefinition } from '../../../shared/types'

const NODE_LABELS: Record<string, string> = {
  imageSource: 'Image Source',
  filter: 'Filter',
  output: 'Output',
  custom: 'Custom'
}

/** Default width for utility nodes (no IMAGE outputs). */
export const UTILITY_NODE_WIDTH = 280

/** Default width for image nodes (has at least one IMAGE output). */
export const IMAGE_NODE_WIDTH = 450

/** Resolve a display label for a node type, using definition name if available. */
function resolveLabel(type: NodeType, definition?: NodeDefinition): string {
  if (definition?.name) return definition.name
  return NODE_LABELS[type] ?? type
}

/**
 * Returns true if the definition has at least one IMAGE-type output port.
 * Used to auto-select the wider 450px node width for image-generation nodes.
 */
export function hasImageOutput(definition: NodeDefinition): boolean {
  return definition.outputs.some(port => port.type === 'IMAGE')
}

/**
 * Resolves the pixel width for a node from its definition.
 * - Explicit `definition.width` takes highest precedence.
 * - Definitions with IMAGE outputs default to IMAGE_NODE_WIDTH (450).
 * - All other nodes default to UTILITY_NODE_WIDTH (280).
 */
export function resolveNodeWidth(definition?: NodeDefinition): number | undefined {
  if (!definition) return undefined
  if (definition.width !== undefined) return definition.width
  return hasImageOutput(definition) ? IMAGE_NODE_WIDTH : UTILITY_NODE_WIDTH
}

/**
 * Builds a new React Flow node at a staggered position.
 * If a NodeDefinition is provided (for plugin nodes), it is stored in
 * node.data.definition so GenericNode can access port/parameter metadata.
 * The node style.width is set based on whether the definition has IMAGE outputs.
 */
export function buildNewNode(
  type: NodeType,
  existingCount: number,
  definition?: NodeDefinition
): Node {
  const offset = existingCount * 20
  const width = resolveNodeWidth(definition)
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
    },
    ...(width !== undefined ? { style: { width } } : {})
  }
}

/**
 * Builds a new React Flow node at the given canvas position.
 * If a NodeDefinition is provided (for plugin nodes), it is stored in
 * node.data.definition so GenericNode can access port/parameter metadata.
 * The node style.width is set based on whether the definition has IMAGE outputs.
 */
export function buildNewNodeAtPosition(
  type: NodeType,
  x: number,
  y: number,
  definition?: NodeDefinition
): Node {
  const width = resolveNodeWidth(definition)
  return {
    id: `${type}-${Date.now()}`,
    type,
    position: { x, y },
    data: {
      label: resolveLabel(type, definition),
      ...(definition ? { definition } : {})
    },
    ...(width !== undefined ? { style: { width } } : {})
  }
}
