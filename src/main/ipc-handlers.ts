import { IpcMain } from 'electron'
import { IPC_CHANNELS } from '../shared/ipc-channels'

/**
 * Registers all main-process IPC handlers.
 * Each feature area registers its own handlers to keep this file small.
 */
export function registerIpcHandlers(ipcMain: IpcMain): void {
  registerAppHandlers(ipcMain)
}

function registerAppHandlers(ipcMain: IpcMain): void {
  ipcMain.handle(IPC_CHANNELS.APP_GET_VERSION, () => {
    return process.env.npm_package_version ?? '0.0.0'
  })

  ipcMain.handle(IPC_CHANNELS.APP_GET_PLATFORM, () => {
    return process.platform
  })
}
