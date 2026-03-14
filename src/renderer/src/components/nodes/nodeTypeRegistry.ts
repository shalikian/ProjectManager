import type { NodeTypes } from '@xyflow/react'
import type { NodeDefinition } from '../../../../shared/types'
import GenericNode from './GenericNode'

/**
 * Base node types always registered.
 * All node types (including built-in imageSource, filter, output) now use
 * GenericNode, which renders based on the NodeDefinition in node.data.
 */
export const BASE_NODE_TYPES: NodeTypes = {
  imageSource: GenericNode,
  filter: GenericNode,
  output: GenericNode
}

/**
 * Builds a merged nodeTypes map from base types plus any NodeDefinitions
 * from the plugin registry. All nodes use GenericNode as their renderer.
 *
 * The type key for plugin nodes is the definition id (e.g. "vertex.imagen4").
 */
export function buildNodeTypes(definitions: NodeDefinition[]): NodeTypes {
  const pluginTypes: NodeTypes = {}
  for (const def of definitions) {
    if (!(def.id in BASE_NODE_TYPES)) {
      pluginTypes[def.id] = GenericNode
    }
  }
  return { ...BASE_NODE_TYPES, ...pluginTypes }
}
