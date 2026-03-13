import { contextBridge, ipcRenderer } from 'electron'
import { IPC_CHANNELS } from '../shared/ipc-channels'
import type { ElectronAPI, SaveCredentialRequest, WorkflowFile } from './types'

/** Channels that the renderer is allowed to listen on. */
const ALLOWED_LISTENER_CHANNELS = [
  'app:open-settings',
  IPC_CHANNELS.WORKFLOW_MENU_SAVE,
  IPC_CHANNELS.WORKFLOW_MENU_SAVE_AS,
  IPC_CHANNELS.WORKFLOW_MENU_OPEN,
  IPC_CHANNELS.WORKFLOW_MENU_NEW,
  IPC_CHANNELS.WORKFLOW_MENU_OPEN_RECENT
]

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
  workflow: {
    save: (workflow: WorkflowFile) =>
      ipcRenderer.invoke(IPC_CHANNELS.WORKFLOW_SAVE, workflow),
    saveAs: (workflow: WorkflowFile) =>
      ipcRenderer.invoke(IPC_CHANNELS.WORKFLOW_SAVE_AS, workflow),
    open: (filePath?: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.WORKFLOW_OPEN, filePath),
    getRecent: () =>
      ipcRenderer.invoke(IPC_CHANNELS.WORKFLOW_GET_RECENT),
    setTitle: (title: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.WORKFLOW_SET_TITLE, title)
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
