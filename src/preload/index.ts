import { contextBridge, ipcRenderer } from 'electron'
import { IPC_CHANNELS } from '../shared/ipc-channels'
import type { ElectronAPI, SaveCredentialRequest } from './types'

/** Channels that the renderer is allowed to listen on. */
const ALLOWED_LISTENER_CHANNELS = ['app:open-settings']

const api: ElectronAPI = {
  getVersion: () => ipcRenderer.invoke(IPC_CHANNELS.APP_GET_VERSION),
  getPlatform: () => ipcRenderer.invoke(IPC_CHANNELS.APP_GET_PLATFORM),
  credentials: {
    save: (req: SaveCredentialRequest) =>
      ipcRenderer.invoke(IPC_CHANNELS.CREDENTIALS_SAVE, req),
    list: () =>
      ipcRenderer.invoke(IPC_CHANNELS.CREDENTIALS_LIST),
    delete: (key: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.CREDENTIALS_DELETE, { key }),
    getMasked: () =>
      ipcRenderer.invoke(IPC_CHANNELS.CREDENTIALS_GET_MASKED),
    test: (provider: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.CREDENTIALS_TEST, { provider })
  },
  ipcRenderer: {
    on: (channel: string, callback: (...args: unknown[]) => void) => {
      if (!ALLOWED_LISTENER_CHANNELS.includes(channel)) return
      ipcRenderer.on(channel, (_event, ...args) => callback(...args))
    },
    off: (channel: string, callback: (...args: unknown[]) => void) => {
      if (!ALLOWED_LISTENER_CHANNELS.includes(channel)) return
      ipcRenderer.off(channel, callback as Parameters<typeof ipcRenderer.off>[1])
    }
  }
}

contextBridge.exposeInMainWorld('electron', api)
