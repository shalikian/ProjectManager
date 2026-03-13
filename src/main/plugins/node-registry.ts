import { EventEmitter } from 'events'
import type { NodeDefinition } from '../../shared/types'

/**
 * Singleton registry that stores all loaded NodeDefinition objects.
 * Emits 'changed' whenever the set of registered nodes is modified.
 */
export class NodeRegistry extends EventEmitter {
  private static instance: NodeRegistry | null = null
  private definitions = new Map<string, NodeDefinition>()

  private constructor() {
    super()
  }

  static getInstance(): NodeRegistry {
    if (!NodeRegistry.instance) {
      NodeRegistry.instance = new NodeRegistry()
    }
    return NodeRegistry.instance
  }

  /** Remove all registered definitions. */
  clear(): void {
    this.definitions.clear()
  }

  /** Register a single definition. Overwrites any existing entry with the same id. */
  register(def: NodeDefinition): void {
    this.definitions.set(def.id, def)
  }

  /** Unregister all definitions that originated from a given plugin id prefix. */
  unregisterByPluginId(pluginId: string): void {
    for (const [key, def] of this.definitions) {
      if (def.id.startsWith(`${pluginId}/`) || def.id === pluginId) {
        this.definitions.delete(key)
      }
    }
  }

  /** Emit a 'changed' event so consumers (e.g. IPC layer) can push updates. */
  notifyChanged(): void {
    this.emit('changed', this.listAll())
  }

  /** Return all registered definitions as an array. */
  listAll(): NodeDefinition[] {
    return Array.from(this.definitions.values())
  }

  /** Return a single definition by id, or undefined if not found. */
  getById(id: string): NodeDefinition | undefined {
    return this.definitions.get(id)
  }

  /** Return all definitions whose category matches the given string. */
  getByCategory(category: string): NodeDefinition[] {
    return this.listAll().filter(d => d.category === category)
  }
}
