import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import { NodeRegistry } from '../main/plugins/node-registry'
import { PluginLoader } from '../main/plugins/plugin-loader'

/** Create a minimal valid JS plugin file that exports a NodeDefinition. */
function writeValidPlugin(dir: string, pluginId: string): string {
  const pluginDir = join(dir, pluginId)
  mkdirSync(pluginDir, { recursive: true })

  const nodeFile = join(pluginDir, 'index.js')
  writeFileSync(
    nodeFile,
    `
module.exports = {
  id: '${pluginId}/test-node',
  name: 'Test Node',
  category: 'test',
  inputs: [],
  outputs: [],
  execute: async () => ({})
}
`
  )

  writeFileSync(
    join(pluginDir, 'package.json'),
    JSON.stringify({ name: pluginId, nodepack: ['index.js'] })
  )

  return pluginDir
}

describe('PluginLoader', () => {
  let tmpDir: string
  let registry: NodeRegistry
  let loader: PluginLoader

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'plugin-loader-test-'))
    registry = NodeRegistry.getInstance()
    registry.clear()
    loader = new PluginLoader(tmpDir, registry)
  })

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true })
    registry.clear()
  })

  // Happy path: valid plugin is loaded and registered
  it('loads a valid plugin and registers its node definition', () => {
    writeValidPlugin(tmpDir, 'my-plugin')
    loader.loadAll()
    const all = registry.listAll()
    expect(all).toHaveLength(1)
    expect(all[0].id).toBe('my-plugin/test-node')
  })

  // Happy path: multiple plugins loaded at once
  it('loads multiple plugins from the plugins directory', () => {
    writeValidPlugin(tmpDir, 'plugin-a')
    writeValidPlugin(tmpDir, 'plugin-b')
    loader.loadAll()
    expect(registry.listAll()).toHaveLength(2)
  })

  // Edge case 1: plugin folder without package.json is silently skipped
  it('skips a plugin folder that has no package.json', () => {
    const badDir = join(tmpDir, 'no-pkg')
    mkdirSync(badDir)
    loader.loadAll()
    expect(registry.listAll()).toHaveLength(0)
  })

  // Edge case 2: package.json without nodepack field is silently skipped
  it('skips a plugin whose package.json has no nodepack field', () => {
    const pluginDir = join(tmpDir, 'no-nodepack')
    mkdirSync(pluginDir)
    writeFileSync(join(pluginDir, 'package.json'), JSON.stringify({ name: 'no-nodepack' }))
    loader.loadAll()
    expect(registry.listAll()).toHaveLength(0)
  })

  // Edge case 3: entry point with missing required field is rejected
  it('rejects a node definition missing the execute field', () => {
    const pluginDir = join(tmpDir, 'bad-plugin')
    mkdirSync(pluginDir)
    const nodeFile = join(pluginDir, 'index.js')
    writeFileSync(
      nodeFile,
      `module.exports = { id: 'bad/node', name: 'Bad', category: 'bad', inputs: [], outputs: [] }`
    )
    writeFileSync(
      join(pluginDir, 'package.json'),
      JSON.stringify({ name: 'bad-plugin', nodepack: ['index.js'] })
    )

    loader.loadAll()
    expect(registry.listAll()).toHaveLength(0)
  })

  // Edge case 4: entry point that exports an array of definitions
  it('loads an entry point exporting an array of definitions', () => {
    const pluginDir = join(tmpDir, 'multi-node')
    mkdirSync(pluginDir)
    writeFileSync(
      join(pluginDir, 'nodes.js'),
      `
module.exports = [
  { id: 'multi/node-1', name: 'Node 1', category: 'test', inputs: [], outputs: [], execute: async () => ({}) },
  { id: 'multi/node-2', name: 'Node 2', category: 'test', inputs: [], outputs: [], execute: async () => ({}) }
]
`
    )
    writeFileSync(
      join(pluginDir, 'package.json'),
      JSON.stringify({ name: 'multi-node', nodepack: ['nodes.js'] })
    )

    loader.loadAll()
    expect(registry.listAll()).toHaveLength(2)
  })

  // Edge case 5: non-existent plugins directory does not throw
  it('does not throw when plugins directory does not exist', () => {
    const nonExistentLoader = new PluginLoader('/path/that/does/not/exist', registry)
    expect(() => nonExistentLoader.loadAll()).not.toThrow()
  })

  // Edge case 6: hot-reload — loadAll can be called twice (simulating reload)
  it('clears and re-registers on a second loadAll call', () => {
    writeValidPlugin(tmpDir, 'reload-plugin')
    loader.loadAll()
    expect(registry.listAll()).toHaveLength(1)

    // Simulate reload: clear and re-scan
    registry.clear()
    loader.loadAll()
    expect(registry.listAll()).toHaveLength(1)
  })
})
