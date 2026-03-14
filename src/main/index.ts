import { app, shell, BrowserWindow, ipcMain, Menu } from 'electron'
import { join } from 'path'
// Inline @electron-toolkit/utils to avoid top-level app access crash
const is = {
  get dev(): boolean {
    return !app.isPackaged
  }
}
import { registerIpcHandlers, setupRegistryPush } from './ipc-handlers'
import { getCredentialStore, registerCredentialHandlers } from './credentials'
import { registerEngineHandlers } from './engine'
import { registerWorkflowHandlers } from './workflow'
import { registerGalleryHandlers } from './gallery'
import { IPC_CHANNELS } from '../shared/ipc-channels'
import { PluginLoader } from './plugins/plugin-loader'

function createWindow(): BrowserWindow {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    show: false,
    autoHideMenuBar: false,
    backgroundColor: '#1a1a2e',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler(details => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return mainWindow
}

function buildAppMenu(mainWindow: BrowserWindow): Menu {
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: 'File',
      submenu: [
        {
          label: 'New Workflow',
          accelerator: 'CmdOrCtrl+N',
          click: () => mainWindow.webContents.send(IPC_CHANNELS.WORKFLOW_MENU_NEW)
        },
        { type: 'separator' },
        {
          label: 'Open Workflow...',
          accelerator: 'CmdOrCtrl+O',
          click: () => mainWindow.webContents.send(IPC_CHANNELS.WORKFLOW_MENU_OPEN)
        },
        {
          label: 'Open Recent',
          submenu: [{ label: 'No recent files', enabled: false }]
        },
        { type: 'separator' },
        {
          label: 'Save',
          accelerator: 'CmdOrCtrl+S',
          click: () => mainWindow.webContents.send(IPC_CHANNELS.WORKFLOW_MENU_SAVE)
        },
        {
          label: 'Save As...',
          accelerator: 'CmdOrCtrl+Shift+S',
          click: () => mainWindow.webContents.send(IPC_CHANNELS.WORKFLOW_MENU_SAVE_AS)
        },
        { type: 'separator' },
        {
          label: 'Settings',
          accelerator: 'CmdOrCtrl+,',
          click: () => {
            mainWindow.webContents.send('app:open-settings')
          }
        },
        { type: 'separator' },
        { role: 'quit' }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    }
  ]
  return Menu.buildFromTemplate(template)
}

app.whenReady().then(() => {
  app.setAppUserModelId('com.node-image-gen')

  registerIpcHandlers(ipcMain)
  registerWorkflowHandlers(ipcMain)

  const store = getCredentialStore()
  registerCredentialHandlers(ipcMain, store)

  const mainWindow = createWindow()
  if (is.dev) mainWindow.webContents.openDevTools()
  const menu = buildAppMenu(mainWindow)
  Menu.setApplicationMenu(menu)

  registerEngineHandlers(ipcMain, mainWindow.webContents, key => store.getSecret(key))
  registerGalleryHandlers(ipcMain, mainWindow.webContents)

  // Set up registry push so renderer gets notified when plugins load/change
  setupRegistryPush(mainWindow.webContents)

  // Load plugins from the plugins/ directory in the project root
  // __dirname = out/main/ in bundled output, so ../.. reaches project root
  const pluginsDir = is.dev
    ? join(__dirname, '..', '..', 'plugins')
    : join(app.getAppPath(), '..', 'plugins')
  const loader = new PluginLoader(pluginsDir)
  loader.loadAll()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
