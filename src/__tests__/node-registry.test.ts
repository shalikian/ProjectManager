import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NodeRegistry } from '../main/plugins/node-registry'
import type { NodeDefinition } from '../shared/types'

const makeDef = (id: string, category = 'test'): NodeDefinition => ({
  id,
  name: id,
  category,
  inputs: [],
  outputs: [],
  execute: async () => ({})
})

describe('NodeRegistry', () => {
  let registry: NodeRegistry

  beforeEach(() => {
    // Reset singleton state between tests by clearing and re-using the instance
    registry = NodeRegistry.getInstance()
    registry.clear()
  })

  // Happy path: register and retrieve
  it('registers a definition and retrieves it by id', () => {
    const def = makeDef('plugin/node-a')
    registry.register(def)
    expect(registry.getById('plugin/node-a')).toEqual(def)
  })

  it('listAll returns all registered definitions', () => {
    registry.register(makeDef('a'))
    registry.register(makeDef('b'))
    const all = registry.listAll()
    expect(all).toHaveLength(2)
  })

  it('getByCategory filters correctly', () => {
    registry.register(makeDef('cat1/node', 'alpha'))
    registry.register(makeDef('cat2/node', 'beta'))
    expect(registry.getByCategory('alpha')).toHaveLength(1)
    expect(registry.getByCategory('beta')).toHaveLength(1)
    expect(registry.getByCategory('gamma')).toHaveLength(0)
  })

  // Edge case 1: overwriting an existing id
  it('overwrites a definition with the same id on re-register', () => {
    const def1 = { ...makeDef('dup'), name: 'First' }
    const def2 = { ...makeDef('dup'), name: 'Second' }
    registry.register(def1)
    registry.register(def2)
    expect(registry.listAll()).toHaveLength(1)
    expect(registry.getById('dup')?.name).toBe('Second')
  })

  // Edge case 2: getById on unknown id returns undefined
  it('getById returns undefined for unknown id', () => {
    expect(registry.getById('nonexistent')).toBeUndefined()
  })

  // Edge case 3: clear removes all definitions
  it('clear removes all definitions', () => {
    registry.register(makeDef('x'))
    registry.clear()
    expect(registry.listAll()).toHaveLength(0)
  })

  // Edge case 4: notifyChanged emits 'changed' with current list
  it('notifyChanged emits changed event with definitions array', () => {
    const def = makeDef('emit-test')
    registry.register(def)

    const listener = vi.fn()
    registry.on('changed', listener)
    registry.notifyChanged()

    expect(listener).toHaveBeenCalledTimes(1)
    expect(listener).toHaveBeenCalledWith([def])
    registry.off('changed', listener)
  })

  // Edge case 5: unregisterByPluginId removes matching entries
  it('unregisterByPluginId removes definitions with matching prefix', () => {
    registry.register(makeDef('myplugin/node-a'))
    registry.register(makeDef('myplugin/node-b'))
    registry.register(makeDef('other/node-c'))
    registry.unregisterByPluginId('myplugin')
    expect(registry.listAll()).toHaveLength(1)
    expect(registry.getById('other/node-c')).toBeDefined()
  })
})
