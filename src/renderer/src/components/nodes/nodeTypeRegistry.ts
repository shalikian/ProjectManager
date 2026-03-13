import type { NodeTypes } from '@xyflow/react'
import type { NodeDefinition } from '../../../../shared/types'
import GenericNode from './GenericNode'
import ImageSourceNode from './ImageSourceNode'
import FilterNode from './FilterNode'
import OutputNode from './OutputNode'

/** Base node types always registered (legacy hard-coded node types). */
export const BASE_NODE_TYPES: NodeTypes = {
  imageSource: ImageSourceNode,
  filter: FilterNode,
  output: OutputNode
}

/**
 * Builds a merged nodeTypes map from base types plus any NodeDefinitions
 * from the plugin registry. Plugin nodes use GenericNode as their renderer.
 *
 * The type key for plugin nodes is the definition id (e.g. "plugin/blur").
 */
export function buildNodeTypes(definitions: NodeDefinition[]): NodeTypes {
  const pluginTypes: NodeTypes = {}
  for (const def of definitions) {
    pluginTypes[def.id] = GenericNode
  }
  return { ...BASE_NODE_TYPES, ...pluginTypes }
}
