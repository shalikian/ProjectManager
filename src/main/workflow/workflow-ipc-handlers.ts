/**
 * IPC handlers for workflow save/load operations.
 * Registered on the main process; called from the renderer via preload.
 */

import { IpcMain, BrowserWindow, Menu } from 'electron'
import { join } from 'path'
import { IPC_CHANNELS } from '../../shared/ipc-channels'
import type { WorkflowFile, WorkflowIpcResult, RecentFileEntry } from '../../shared/workflow-types'
import { saveWorkflowAs, saveWorkflowToPath, openWorkflowDialog, readWorkflowFile } from './workflow-file-ops'
import { loadRecentFiles, addRecentFile } from './recent-files'

const RECENT_FILES_NAME = 'recent-workflows.json'

/** Tracks the current open file path per window (keyed by window id). */
const currentFilePaths = new Map<number, string>()

/** Returns the userData path for recent files storage. */
function getRecentFilesPath(): string {
  const { app } = require('electron') as typeof import('electron')
  return join(app.getPath('userData'), RECENT_FILES_NAME)
}

/** Gets the focused BrowserWindow, or null if none. */
function getFocusedWindow(): BrowserWindow | null {
  return BrowserWindow.getFocusedWindow()
}

/**
 * Register all workflow-related IPC handlers.
 */
export function registerWorkflowHandlers(ipcMain: IpcMain): void {
  registerSaveHandler(ipcMain)
  registerSaveAsHandler(ipcMain)
  registerOpenHandler(ipcMain)
  registerGetRecentHandler(ipcMain)
  registerSetTitleHandler(ipcMain)
}

// ─── Handler registrations ────────────────────────────────────────────────────

function registerSaveHandler(ipcMain: IpcMain): void {
  ipcMain.handle(
    IPC_CHANNELS.WORKFLOW_SAVE,
    async (_event, workflow: WorkflowFile): Promise<WorkflowIpcResult> => {
      const win = getFocusedWindow()
      if (!win) return { ok: false, error: 'No window available' }

      const existingPath = currentFilePaths.get(win.id)
      if (!existingPath) {
        return handleSaveAs(win, workflow)
      }

      const result = saveWorkflowToPath(existingPath, workflow)
      if (result.ok && result.filePath) {
        onFileSaved(win, result.filePath, workflow.metadata.name)
      }
      return result
    }
  )
}

function registerSaveAsHandler(ipcMain: IpcMain): void {
  ipcMain.handle(
    IPC_CHANNELS.WORKFLOW_SAVE_AS,
    async (_event, workflow: WorkflowFile): Promise<WorkflowIpcResult> => {
      const win = getFocusedWindow()
      if (!win) return { ok: false, error: 'No window available' }
      return handleSaveAs(win, workflow)
    }
  )
}

function registerOpenHandler(ipcMain: IpcMain): void {
  ipcMain.handle(
    IPC_CHANNELS.WORKFLOW_OPEN,
    async (_event, filePath?: string): Promise<WorkflowIpcResult> => {
      const win = getFocusedWindow()
      if (!win) return { ok: false, error: 'No window available' }

      const result = filePath
        ? readWorkflowFile(filePath)
        : await openWorkflowDialog(win)

      if (result.ok && !result.cancelled && result.filePath && result.workflow) {
        onFileOpened(win, result.filePath, result.workflow.metadata.name)
      }
      return result
    }
  )
}

function registerGetRecentHandler(ipcMain: IpcMain): void {
  ipcMain.handle(
    IPC_CHANNELS.WORKFLOW_GET_RECENT,
    (): RecentFileEntry[] => {
      return loadRecentFiles(getRecentFilesPath())
    }
  )
}

function registerSetTitleHandler(ipcMain: IpcMain): void {
  ipcMain.handle(
    IPC_CHANNELS.WORKFLOW_SET_TITLE,
    (_event, title: string): void => {
      const win = getFocusedWindow()
      if (win) win.setTitle(title)
    }
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function handleSaveAs(
  win: BrowserWindow,
  workflow: WorkflowFile
): Promise<WorkflowIpcResult> {
  const result = await saveWorkflowAs(win, workflow)
  if (result.ok && !result.cancelled && result.filePath) {
    onFileSaved(win, result.filePath, workflow.metadata.name)
  }
  return result
}

function onFileSaved(win: BrowserWindow, filePath: string, name: string): void {
  currentFilePaths.set(win.id, filePath)
  addRecentFile(filePath, name, getRecentFilesPath())
  rebuildRecentMenu()
}

function onFileOpened(win: BrowserWindow, filePath: string, name: string): void {
  currentFilePaths.set(win.id, filePath)
  addRecentFile(filePath, name, getRecentFilesPath())
  rebuildRecentMenu()
}

/**
 * Rebuild the application menu's recent-files submenu.
 * Called after any open/save operation that changes the recent list.
 */
function rebuildRecentMenu(): void {
  const entries = loadRecentFiles(getRecentFilesPath())
  const recentItems: Electron.MenuItemConstructorOptions[] = entries.map(entry => ({
    label: entry.name,
    click: () => {
      const win = getFocusedWindow()
      if (!win) return
      const result = readWorkflowFile(entry.filePath)
      if (result.ok && result.workflow) {
        onFileOpened(win, entry.filePath, result.workflow.metadata.name)
        win.webContents.send(IPC_CHANNELS.WORKFLOW_MENU_OPEN_RECENT, result)
      }
    }
  }))

  const currentMenu = Menu.getApplicationMenu()
  if (!currentMenu) return

  // Find the File menu and rebuild its submenu with the updated recent list
  const fileMenu = currentMenu.items.find(item => item.label === 'File')
  if (fileMenu?.submenu) {
    updateRecentFilesInMenu(fileMenu.submenu, recentItems)
  }
}

function updateRecentFilesInMenu(
  submenu: Electron.Menu,
  recentItems: Electron.MenuItemConstructorOptions[]
): void {
  const recentIdx = submenu.items.findIndex(item => item.label === 'Open Recent')
  if (recentIdx === -1) return

  const noRecentLabel = 'No recent files'
  const subItems: Electron.MenuItemConstructorOptions[] =
    recentItems.length > 0 ? recentItems : [{ label: noRecentLabel, enabled: false }]

  const newItem: Electron.MenuItemConstructorOptions = {
    label: 'Open Recent',
    submenu: subItems
  }

  // Rebuild the file menu items list with the updated Recent submenu
  const items = submenu.items.map((item, idx) =>
    idx === recentIdx
      ? newItem
      : { label: item.label, role: item.role, type: item.type, click: item.click,
          submenu: item.submenu, accelerator: item.accelerator, enabled: item.enabled }
  )

  const newMenu = Menu.buildFromTemplate(
    items as Electron.MenuItemConstructorOptions[]
  )
  // Replace submenu in place — we rebuild the full app menu
  rebuildAppMenu(newMenu)
}

function rebuildAppMenu(fileSubmenu: Electron.Menu): void {
  const currentMenu = Menu.getApplicationMenu()
  if (!currentMenu) return

  const newTemplate: Electron.MenuItemConstructorOptions[] = currentMenu.items.map(item =>
    item.label === 'File'
      ? { label: 'File', submenu: fileSubmenu }
      : { label: item.label, submenu: item.submenu ?? undefined,
          role: item.role, type: item.type }
  )

  const rebuilt = Menu.buildFromTemplate(newTemplate)
  Menu.setApplicationMenu(rebuilt)
}

/** Returns the currently open file path for a window, or undefined. */
export function getCurrentFilePath(winId: number): string | undefined {
  return currentFilePaths.get(winId)
}

/** Clears the tracked file path for a window (e.g. on New Workflow). */
export function clearCurrentFilePath(winId: number): void {
  currentFilePaths.delete(winId)
}
