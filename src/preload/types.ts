/**
 * Typed definition of the IPC bridge exposed to the renderer via contextBridge.
 * This file is also referenced by the renderer's global type augmentation.
 */
export interface ElectronAPI {
  getVersion: () => Promise<string>
  getPlatform: () => Promise<NodeJS.Platform>
}
