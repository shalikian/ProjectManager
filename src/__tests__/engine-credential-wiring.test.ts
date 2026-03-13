/**
 * Tests that the execution engine is correctly wired with the credential store's
 * getSecret function via registerEngineHandlers.
 *
 * This guards against regression of the QA finding where registerEngineHandlers
 * was exported but never called in src/main/index.ts.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { registerEngineHandlers } from '../main/engine/ipc-engine-handlers'
import { NodeRegistry } from '../main/plugins/node-registry'
import type { NodeDefinition } from '../shared/types'
import type { WorkflowGraph, WorkflowNode } from '../main/engine/types'

// ─── Helpers ────────────────────────────────────────────────────────────────

function makeIpcMain() {
  const handlers = new Map<string, (...args: unknown[]) => unknown>()
  return {
    handle: vi.fn((channel: string, handler: (...args: unknown[]) => unknown) => {
      handlers.set(channel, handler)
    }),
    invoke: (channel: string, ...args: unknown[]) => {
      const handler = handlers.get(channel)
      if (!handler) throw new Error(`No handler for ${channel}`)
      return handler({} as Electron.IpcMainInvokeEvent, ...args)
    }
  }
}

function makeWebContents() {
  return {
    send: vi.fn(),
    isDestroyed: vi.fn(() => false)
  }
}

function makeNode(id: string, type = id): WorkflowNode {
  return { id, type, parameters: {} }
}

function makeGraph(nodes: WorkflowNode[]): WorkflowGraph {
  return { nodes, edges: [] }
}

function makeNodeDef(id: string, capturedContext: { getSecret?: unknown } = {}): NodeDefinition {
  return {
    id,
    name: id,
    category: 'test',
    inputs: [],
    outputs: [],
    execute: vi.fn().mockImplementation((_inputs, ctx) => {
      capturedContext.getSecret = ctx.getSecret
      return Promise.resolve({})
    })
  }
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('registerEngineHandlers — credential wiring', () => {
  let registry: NodeRegistry

  beforeEach(() => {
    registry = NodeRegistry.getInstance()
    registry.clear()
  })

  // Happy path: getSecret provider is accessible in the execution context
  it('passes the getSecret provider into the node execution context', async () => {
    const ipcMain = makeIpcMain() as unknown as Electron.IpcMain
    const webContents = makeWebContents() as unknown as Electron.WebContents
    const getSecret = vi.fn((key: string) => `secret-for-${key}`)
    const capturedContext: { getSecret?: unknown } = {}
    const def = makeNodeDef('def-a', capturedContext)

    registry.register(def)

    const engine = registerEngineHandlers(ipcMain, webContents, getSecret)
    expect(engine).toBeDefined()

    const graph = makeGraph([makeNode('A', 'def-a')])
    await engine.runAll('run-1', graph)

    expect(typeof capturedContext.getSecret).toBe('function')
    const getSecretFn = capturedContext.getSecret as (key: string) => string | undefined
    expect(getSecretFn('api-key')).toBe('secret-for-api-key')
    expect(getSecret).toHaveBeenCalledWith('api-key')
  })

  // Edge case 1: without getSecret, context.getSecret returns undefined
  it('provides a no-op getSecret when no provider is supplied', async () => {
    const ipcMain = makeIpcMain() as unknown as Electron.IpcMain
    const webContents = makeWebContents() as unknown as Electron.WebContents
    const capturedContext: { getSecret?: unknown } = {}
    const def = makeNodeDef('def-b', capturedContext)

    registry.register(def)

    const engine = registerEngineHandlers(ipcMain, webContents)
    const graph = makeGraph([makeNode('B', 'def-b')])
    await engine.runAll('run-2', graph)

    const getSecretFn = capturedContext.getSecret as (key: string) => string | undefined
    expect(getSecretFn('any-key')).toBeUndefined()
  })

  // Edge case 2: engine returns an ExecutionEngine instance with cancel method
  it('returns an ExecutionEngine with a cancel method', () => {
    const ipcMain = makeIpcMain() as unknown as Electron.IpcMain
    const webContents = makeWebContents() as unknown as Electron.WebContents
    const engine = registerEngineHandlers(ipcMain, webContents)
    expect(typeof engine.cancel).toBe('function')
    expect(typeof engine.runAll).toBe('function')
    expect(typeof engine.runNode).toBe('function')
  })

  // Edge case 3: IPC handlers are registered for ENGINE_RUN and ENGINE_CANCEL
  it('registers IPC handlers for engine run and cancel channels', () => {
    const ipcMain = makeIpcMain() as unknown as Electron.IpcMain
    const webContents = makeWebContents() as unknown as Electron.WebContents
    registerEngineHandlers(ipcMain, webContents)
    // ipcMain.handle should have been called at least 3 times (run, run-node, cancel)
    const ipcMainMock = ipcMain as unknown as ReturnType<typeof makeIpcMain>
    expect(ipcMainMock.handle).toHaveBeenCalledTimes(3)
  })
})
