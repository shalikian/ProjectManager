import { IpcMain, dialog, clipboard, nativeImage, BrowserWindow } from 'electron'
import { readFileSync } from 'fs'
import { IPC_CHANNELS } from '../../shared/ipc-channels'

/** Accepted image file extensions for the open dialog. */
const IMAGE_FILTERS = [
  { name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'webp'] }
]

export interface ImageLoadResult {
  dataUrl: string
  fileName: string
}

/**
 * Read an image file from disk and return its data URL.
 * Returns null if the file cannot be read or is not a valid image.
 */
function readImageFile(filePath: string): ImageLoadResult | null {
  try {
    const img = nativeImage.createFromPath(filePath)
    if (img.isEmpty()) return null
    const dataUrl = img.toDataURL()
    const fileName = filePath.replace(/\\/g, '/').split('/').pop() ?? 'image'
    return { dataUrl, fileName }
  } catch (err) {
    console.error('[image] Failed to read image file:', err)
    return null
  }
}

/**
 * Registers image-related IPC handlers:
 * - image:open-dialog — opens a file picker filtered to images
 * - image:read-clipboard — reads image data from the system clipboard
 */
export function registerImageHandlers(ipcMain: IpcMain): void {
  ipcMain.handle(IPC_CHANNELS.IMAGE_OPEN_DIALOG, async () => {
    const win = BrowserWindow.getFocusedWindow()
    const result = await dialog.showOpenDialog(win ?? {}, {
      title: 'Import Image',
      filters: IMAGE_FILTERS,
      properties: ['openFile']
    })

    if (result.canceled || result.filePaths.length === 0) return null
    return readImageFile(result.filePaths[0])
  })

  ipcMain.handle(IPC_CHANNELS.IMAGE_READ_CLIPBOARD, () => {
    try {
      const img = clipboard.readImage()
      if (img.isEmpty()) return null
      return { dataUrl: img.toDataURL(), fileName: 'clipboard' } as ImageLoadResult
    } catch (err) {
      console.error('[image] Failed to read clipboard image:', err)
      return null
    }
  })
}
