import { create } from 'zustand'
import type { NodeDefinition } from '../../../shared/types'

/**
 * Built-in node definitions for the 3 legacy node types.
 * These provide metadata (ports, parameters) so that GenericNode and
 * PropertiesPanel can render them consistently with plugin nodes.
 *
 * The `execute` function is a no-op placeholder — actual execution
 * happens in the main process via IPC.
 */
const BUILT_IN_DEFINITIONS: NodeDefinition[] = [
  {
    id: 'imageSource',
    name: 'Image Source',
    category: 'Source',
    description: 'Load an image from disk',
    inputs: [],
    outputs: [{ id: 'image', label: 'Image', type: 'IMAGE' }],
    parameters: [],
    execute: async () => ({})
  },
  {
    id: 'filter',
    name: 'Filter',
    category: 'Filter',
    description: 'Apply image filters and adjustments',
    inputs: [{ id: 'input', label: 'Input', type: 'IMAGE' }],
    outputs: [{ id: 'output', label: 'Output', type: 'IMAGE' }],
    parameters: [],
    execute: async () => ({})
  },
  {
    id: 'output',
    name: 'Output',
    category: 'Output',
    description: 'Export the result image',
    inputs: [{ id: 'input', label: 'Input', type: 'IMAGE' }],
    outputs: [],
    parameters: [],
    execute: async () => ({})
  }
]

interface DefinitionState {
  /** All known definitions: built-in + plugin. */
  definitions: NodeDefinition[]
  /** Replace the set of plugin definitions (merges with built-ins). */
  setPluginDefinitions: (defs: NodeDefinition[]) => void
  /** Look up a definition by its type id. */
  getDefinition: (typeId: string) => NodeDefinition | undefined
}

export const useDefinitionStore = create<DefinitionState>((set, get) => ({
  definitions: [...BUILT_IN_DEFINITIONS],

  setPluginDefinitions: (pluginDefs: NodeDefinition[]) => {
    const builtInIds = new Set(BUILT_IN_DEFINITIONS.map(d => d.id))
    const unique = pluginDefs.filter(d => !builtInIds.has(d.id))
    set({ definitions: [...BUILT_IN_DEFINITIONS, ...unique] })
  },

  getDefinition: (typeId: string) => {
    return get().definitions.find(d => d.id === typeId)
  }
}))
