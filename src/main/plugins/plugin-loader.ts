import { existsSync, readdirSync } from 'fs'
import { join, resolve } from 'path'
import chokidar from 'chokidar'
import type { NodeDefinition } from '../../shared/types'
import { NodeRegistry } from './node-registry'
import { validateNodeDefinition } from './plugin-validator'

interface PluginPackageJson {
  name?: string
  nodepack?: string[]
}

/**
 * Discovers, loads, validates, and hot-reloads node-pack plugins
 * found under the `plugins/` directory.
 */
export class PluginLoader {
  private pluginsDir: string
  private registry: NodeRegistry
  private watcher: ReturnType<typeof chokidar.watch> | null = null

  constructor(pluginsDir: string, registry?: NodeRegistry) {
    this.pluginsDir = resolve(pluginsDir)
    this.registry = registry ?? NodeRegistry.getInstance()
  }

  /** Scan plugins directory and load all valid plugins. */
  loadAll(): void {
    if (!existsSync(this.pluginsDir)) {
      console.log(`[PluginLoader] plugins dir not found: ${this.pluginsDir}`)
      return
    }

    const entries = readdirSync(this.pluginsDir, { withFileTypes: true })
    for (const entry of entries) {
      if (entry.isDirectory()) {
        this.loadPlugin(join(this.pluginsDir, entry.name))
      }
    }

    this.registry.notifyChanged()
  }

  /** Load (or reload) a single plugin folder. */
  loadPlugin(pluginDir: string): void {
    const pkgPath = join(pluginDir, 'package.json')
    if (!existsSync(pkgPath)) {
      console.log(`[PluginLoader] Skipping ${pluginDir}: no package.json`)
      return
    }

    let pkg: PluginPackageJson
    try {
      pkg = requireFresh(pkgPath) as PluginPackageJson
    } catch (err) {
      console.error(`[PluginLoader] Failed to read package.json in ${pluginDir}:`, err)
      return
    }

    if (!Array.isArray(pkg.nodepack) || pkg.nodepack.length === 0) {
      console.log(`[PluginLoader] Skipping ${pluginDir}: no "nodepack" field`)
      return
    }

    const pluginName = pkg.name ?? pluginDir
    console.log(`[PluginLoader] Loading plugin: ${pluginName}`)

    for (const entryRelPath of pkg.nodepack) {
      this.loadEntryPoint(pluginDir, entryRelPath)
    }
  }

  private loadEntryPoint(pluginDir: string, entryRelPath: string): void {
    const entryPath = join(pluginDir, entryRelPath)
    if (!existsSync(entryPath)) {
      console.warn(`[PluginLoader] Entry point not found: ${entryPath}`)
      return
    }

    let exported: unknown
    try {
      exported = requireFresh(entryPath)
    } catch (err) {
      console.error(`[PluginLoader] Failed to load ${entryPath}:`, err)
      return
    }

    const candidates = collectDefinitions(exported)
    for (const candidate of candidates) {
      this.tryRegister(candidate, entryPath)
    }
  }

  private tryRegister(candidate: unknown, source: string): void {
    const error = validateNodeDefinition(candidate)
    if (error) {
      console.error(`[PluginLoader] Invalid definition in ${source}: ${error}`)
      return
    }
    const def = candidate as NodeDefinition
    this.registry.register(def)
    console.log(`[PluginLoader] Registered node: ${def.id}`)
  }

  /** Start watching the plugins directory for changes (hot-reload). */
  startWatching(): void {
    if (!existsSync(this.pluginsDir)) {
      console.log(`[PluginLoader] Watch skipped — plugins dir missing: ${this.pluginsDir}`)
      return
    }

    this.watcher = chokidar.watch(this.pluginsDir, {
      ignoreInitial: true,
      depth: 3
    })

    this.watcher.on('change', (filePath: string) => this.handleFileChange(filePath))
    this.watcher.on('add', (filePath: string) => this.handleFileChange(filePath))
    console.log(`[PluginLoader] Watching ${this.pluginsDir} for changes`)
  }

  private handleFileChange(filePath: string): void {
    console.log(`[PluginLoader] File changed: ${filePath} — reloading plugins`)
    this.registry.clear()
    this.loadAll()
  }

  /** Stop watching. */
  async stopWatching(): Promise<void> {
    if (this.watcher) {
      await this.watcher.close()
      this.watcher = null
    }
  }
}

/** Require a module bypassing the Node.js require cache. */
function requireFresh(modulePath: string): unknown {
  const resolved = require.resolve(modulePath)
  delete require.cache[resolved]
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require(resolved)
}

/** Normalise an export value into an array of potential NodeDefinition objects. */
function collectDefinitions(exported: unknown): unknown[] {
  if (!exported || typeof exported !== 'object') return []
  if (Array.isArray(exported)) return exported

  const mod = exported as Record<string, unknown>

  // CommonJS default export pattern: module.exports = def or module.exports.default = def
  if ('default' in mod) {
    const def = mod['default']
    return Array.isArray(def) ? def : [def]
  }

  // Direct object that looks like a definition
  if ('id' in mod) return [mod]

  // Named exports — collect all values
  return Object.values(mod)
}
