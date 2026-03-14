import { contextBridge, ipcRenderer } from 'electron'
import { IPC_CHANNELS } from '../shared/ipc-channels'
import type { ElectronAPI, SaveCredentialRequest, WorkflowFile, GalleryItem, GallerySaveRequest } from './types'

/** Channels that the renderer is allowed to listen on. */
const ALLOWED_LISTENER_CHANNELS = [
  'app:open-settings',
  'app:toggle-minimap',
  IPC_CHANNELS.WORKFLOW_MENU_SAVE,
  IPC_CHANNELS.WORKFLOW_MENU_SAVE_AS,
  IPC_CHANNELS.WORKFLOW_MENU_OPEN,
  IPC_CHANNELS.WORKFLOW_MENU_NEW,
  IPC_CHANNELS.WORKFLOW_MENU_OPEN_RECENT,
  IPC_CHANNELS.GALLERY_ITEM_SAVED
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
  nodes: {
    listAll: () => ipcRenderer.invoke(IPC_CHANNELS.NODES_LIST_ALL),
    onRegistryChanged: (cb: (definitions: unknown[]) => void) => {
      const listener = (_event: Electron.IpcRendererEvent, defs: unknown[]) => cb(defs)
      ipcRenderer.on(IPC_CHANNELS.NODES_REGISTRY_CHANGED, listener)
      return () => ipcRenderer.off(IPC_CHANNELS.NODES_REGISTRY_CHANGED, listener)
    }
  },
  gallery: {
    list: () => ipcRenderer.invoke(IPC_CHANNELS.GALLERY_LIST),
    saveImage: (req: GallerySaveRequest) =>
      ipcRenderer.invoke(IPC_CHANNELS.GALLERY_SAVE_IMAGE, req),
    delete: (item: GalleryItem) =>
      ipcRenderer.invoke(IPC_CHANNELS.GALLERY_DELETE, JSON.stringify(item)),
    openFolder: (filePath: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.GALLERY_OPEN_FOLDER, filePath),
    copyToClipboard: (dataUrl: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.GALLERY_COPY_CLIPBOARD, dataUrl),
    getOutputDir: () =>
      ipcRenderer.invoke(IPC_CHANNELS.GALLERY_GET_OUTPUT_DIR),
    setOutputDir: (dir?: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.GALLERY_SET_OUTPUT_DIR, dir),
    onItemSaved: (callback: (item: GalleryItem) => void) => {
      const handler = (_event: Electron.IpcRendererEvent, item: GalleryItem): void =>
        callback(item)
      ipcRenderer.on(IPC_CHANNELS.GALLERY_ITEM_SAVED, handler)
      return () => ipcRenderer.off(IPC_CHANNELS.GALLERY_ITEM_SAVED, handler)
    }
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
