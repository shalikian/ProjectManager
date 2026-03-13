/**
 * IPC handlers for gallery / auto-save operations.
 * Registered on the main process.
 */

import { IpcMain, WebContents, shell, clipboard, nativeImage, dialog, BrowserWindow } from 'electron'
import { IPC_CHANNELS } from '../../shared/ipc-channels'
import type { GallerySaveRequest } from '../../shared/gallery-types'
import {
  listGalleryItems,
  saveGalleryImage,
  deleteGalleryItem,
  getOutputDir,
  setOutputDir,
  ensureDir
} from './gallery-store'

/**
 * Register all gallery-related IPC handlers.
 *
 * @param ipcMain     Electron ipcMain instance
 * @param webContents WebContents for pushing gallery:item-saved events
 */
export function registerGalleryHandlers(
  ipcMain: IpcMain,
  webContents: WebContents
): void {
  registerListHandler(ipcMain)
  registerSaveImageHandler(ipcMain, webContents)
  registerDeleteHandler(ipcMain)
  registerOpenFolderHandler(ipcMain)
  registerCopyClipboardHandler(ipcMain)
  registerGetOutputDirHandler(ipcMain)
  registerSetOutputDirHandler(ipcMain)
}

// ─── Handler registrations ────────────────────────────────────────────────────

function registerListHandler(ipcMain: IpcMain): void {
  ipcMain.handle(IPC_CHANNELS.GALLERY_LIST, () => {
    return listGalleryItems()
  })
}

function registerSaveImageHandler(
  ipcMain: IpcMain,
  webContents: WebContents
): void {
  ipcMain.handle(
    IPC_CHANNELS.GALLERY_SAVE_IMAGE,
    async (_event, req: GallerySaveRequest) => {
      const outputDir = getOutputDir()
      ensureDir(outputDir)
      const result = saveGalleryImage(outputDir, req)

      if (result.ok && result.item) {
        pushItemSaved(webContents, result.item)
      }

      return result
    }
  )
}

function registerDeleteHandler(ipcMain: IpcMain): void {
  ipcMain.handle(IPC_CHANNELS.GALLERY_DELETE, (_event, itemJson: string) => {
    try {
      const item = JSON.parse(itemJson)
      const deleted = deleteGalleryItem(item)
      return { ok: deleted }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      return { ok: false, error: msg }
    }
  })
}

function registerOpenFolderHandler(ipcMain: IpcMain): void {
  ipcMain.handle(IPC_CHANNELS.GALLERY_OPEN_FOLDER, (_event, filePath: string) => {
    try {
      shell.showItemInFolder(filePath)
      return { ok: true }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      return { ok: false, error: msg }
    }
  })
}

function registerCopyClipboardHandler(ipcMain: IpcMain): void {
  ipcMain.handle(IPC_CHANNELS.GALLERY_COPY_CLIPBOARD, (_event, dataUrl: string) => {
    try {
      const img = nativeImage.createFromDataURL(dataUrl)
      clipboard.writeImage(img)
      return { ok: true }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      return { ok: false, error: msg }
    }
  })
}

function registerGetOutputDirHandler(ipcMain: IpcMain): void {
  ipcMain.handle(IPC_CHANNELS.GALLERY_GET_OUTPUT_DIR, () => {
    return getOutputDir()
  })
}

function registerSetOutputDirHandler(ipcMain: IpcMain): void {
  ipcMain.handle(
    IPC_CHANNELS.GALLERY_SET_OUTPUT_DIR,
    async (_event, newDir?: string) => {
      try {
        if (newDir) {
          setOutputDir(newDir)
          ensureDir(newDir)
          return { ok: true, dir: newDir }
        }
        // No dir provided: show folder picker dialog
        const win = BrowserWindow.getFocusedWindow()
        if (!win) return { ok: false, error: 'No window available' }
        const result = await dialog.showOpenDialog(win, {
          title: 'Select Output Directory',
          properties: ['openDirectory', 'createDirectory']
        })
        if (result.canceled || !result.filePaths[0]) {
          return { ok: false, cancelled: true }
        }
        const dir = result.filePaths[0]
        setOutputDir(dir)
        ensureDir(dir)
        return { ok: true, dir }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        return { ok: false, error: msg }
      }
    }
  )
}

/** Push a gallery:item-saved event to the renderer. */
function pushItemSaved(webContents: WebContents, item: unknown): void {
  if (!webContents.isDestroyed()) {
    webContents.send(IPC_CHANNELS.GALLERY_ITEM_SAVED, item)
  }
}
