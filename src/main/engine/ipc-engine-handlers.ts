/**
 * IPC handlers for the execution engine.
 * Bridges renderer requests to the ExecutionEngine running in the main process.
 */

import { IpcMain, WebContents } from 'electron'
import { IPC_CHANNELS } from '../../shared/ipc-channels'
import { ExecutionEngine } from './execution-engine'
import type { EngineRunRequest, EngineRunNodeRequest, ProgressEvent } from './types'

/**
 * Register engine IPC handlers and wire up progress event forwarding.
 *
 * @param ipcMain     Electron ipcMain instance
 * @param webContents WebContents of the renderer window for pushing progress events
 * @param getSecret   Optional secrets provider injected into the engine
 */
export function registerEngineHandlers(
  ipcMain: IpcMain,
  webContents: WebContents,
  getSecret?: (key: string) => string | undefined
): ExecutionEngine {
  const emitProgress = buildProgressEmitter(webContents)
  const engine = new ExecutionEngine(emitProgress, getSecret)

  ipcMain.handle(IPC_CHANNELS.ENGINE_RUN, async (_event, req: EngineRunRequest) => {
    await engine.runAll(req.runId, req.graph)
    return { ok: true }
  })

  ipcMain.handle(IPC_CHANNELS.ENGINE_RUN_NODE, async (_event, req: EngineRunNodeRequest) => {
    await engine.runNode(req.runId, req.nodeId, req.graph)
    return { ok: true }
  })

  ipcMain.handle(IPC_CHANNELS.ENGINE_CANCEL, (_event, runId: string) => {
    engine.cancel(runId)
    return { ok: true }
  })

  return engine
}

/** Build a progress emitter that forwards events to the renderer via IPC. */
function buildProgressEmitter(webContents: WebContents): (event: ProgressEvent) => void {
  return (event: ProgressEvent) => {
    if (!webContents.isDestroyed()) {
      webContents.send(IPC_CHANNELS.ENGINE_PROGRESS, event)
    }
  }
}
