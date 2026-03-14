import { IpcMain, WebContents } from 'electron'
import { IPC_CHANNELS } from '../shared/ipc-channels'
import { NodeRegistry } from './plugins/node-registry'
import type { NodeDefinition } from '../shared/types'

/** Strip all non-serializable properties (functions, etc.) before sending over IPC. */
function toSerializable(def: NodeDefinition): Record<string, unknown> {
  return JSON.parse(JSON.stringify(def))
}

/**
 * Registers all main-process IPC handlers.
 * Each feature area registers its own handlers to keep this file small.
 */
export function registerIpcHandlers(ipcMain: IpcMain): void {
  registerAppHandlers(ipcMain)
  registerNodeHandlers(ipcMain)
}

function registerAppHandlers(ipcMain: IpcMain): void {
  ipcMain.handle(IPC_CHANNELS.APP_GET_VERSION, () => {
    return process.env.npm_package_version ?? '0.0.0'
  })

  ipcMain.handle(IPC_CHANNELS.APP_GET_PLATFORM, () => {
    return process.platform
  })
}

function registerNodeHandlers(ipcMain: IpcMain): void {
  const registry = NodeRegistry.getInstance()

  ipcMain.handle(IPC_CHANNELS.NODES_LIST_ALL, () => {
    return registry.listAll().map(toSerializable)
  })

  ipcMain.handle(IPC_CHANNELS.NODES_GET_BY_ID, (_event, id: string) => {
    const def = registry.getById(id)
    return def ? toSerializable(def) : null
  })
}

/**
 * Push registry-changed events to the renderer whenever the node set changes.
 * Call this after a BrowserWindow is ready so we have a WebContents to send to.
 */
export function setupRegistryPush(webContents: WebContents): void {
  const registry = NodeRegistry.getInstance()
  registry.on('changed', (definitions: NodeDefinition[]) => {
    if (!webContents.isDestroyed()) {
      webContents.send(IPC_CHANNELS.NODES_REGISTRY_CHANGED, definitions.map(toSerializable))
    }
  })
}
