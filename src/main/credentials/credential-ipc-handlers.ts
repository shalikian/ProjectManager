/**
 * IPC handlers for credential management.
 * All credential operations (save, list, delete, test) are handled here
 * in the main process. Secrets never travel to the renderer.
 */

import { IpcMain } from 'electron'
import { IPC_CHANNELS } from '../../shared/ipc-channels'
import type { CredentialStore, SaveResult, TestResult } from './credential-store'

/** Request shape for saving a credential. */
export interface CredentialSaveRequest {
  key: string
  value: string
}

/** Request shape for deleting a credential. */
export interface CredentialDeleteRequest {
  key: string
}

/** Request shape for testing a connection. */
export interface CredentialTestRequest {
  provider: string
}

/** Masked credential entry returned to renderer. */
export interface MaskedCredential {
  key: string
  masked: string
}

/**
 * Register all credential IPC handlers on the main process.
 * Injecting the store allows easy testing without touching disk.
 */
export function registerCredentialHandlers(
  ipcMain: IpcMain,
  store: CredentialStore
): void {
  registerSaveHandler(ipcMain, store)
  registerListHandler(ipcMain, store)
  registerDeleteHandler(ipcMain, store)
  registerGetMaskedHandler(ipcMain, store)
  registerTestHandler(ipcMain, store)
}

// ─── Individual handler registration ────────────────────────────────────────

function registerSaveHandler(ipcMain: IpcMain, store: CredentialStore): void {
  ipcMain.handle(
    IPC_CHANNELS.CREDENTIALS_SAVE,
    (_event, req: CredentialSaveRequest): SaveResult => {
      if (!req.key || typeof req.key !== 'string') {
        return { ok: false, error: 'key is required' }
      }
      if (typeof req.value !== 'string') {
        return { ok: false, error: 'value must be a string' }
      }
      return store.save(req.key, req.value)
    }
  )
}

function registerListHandler(ipcMain: IpcMain, store: CredentialStore): void {
  ipcMain.handle(IPC_CHANNELS.CREDENTIALS_LIST, (): string[] => {
    return store.listKeys()
  })
}

function registerDeleteHandler(ipcMain: IpcMain, store: CredentialStore): void {
  ipcMain.handle(
    IPC_CHANNELS.CREDENTIALS_DELETE,
    (_event, req: CredentialDeleteRequest): boolean => {
      if (!req.key || typeof req.key !== 'string') return false
      return store.delete(req.key)
    }
  )
}

function registerGetMaskedHandler(ipcMain: IpcMain, store: CredentialStore): void {
  ipcMain.handle(
    IPC_CHANNELS.CREDENTIALS_GET_MASKED,
    (): MaskedCredential[] => {
      return store.listKeys().map(key => ({
        key,
        masked: maskValue()
      }))
    }
  )
}

function registerTestHandler(ipcMain: IpcMain, store: CredentialStore): void {
  ipcMain.handle(
    IPC_CHANNELS.CREDENTIALS_TEST,
    async (_event, req: CredentialTestRequest): Promise<TestResult> => {
      return testProviderConnection(req.provider, store)
    }
  )
}

// ─── Provider test logic ──────────────────────────────────────────────────────

async function testProviderConnection(
  provider: string,
  store: CredentialStore
): Promise<TestResult> {
  switch (provider) {
    case 'google-vertex-ai':
      return testGoogleVertexAi(store)
    default:
      return { ok: false, message: `Unknown provider: ${provider}` }
  }
}

async function testGoogleVertexAi(store: CredentialStore): Promise<TestResult> {
  const apiKey = store.getSecret('google-vertex-ai:api-key')
  const projectId = store.getSecret('google-vertex-ai:project-id')
  const region = store.getSecret('google-vertex-ai:region') ?? 'us-central1'

  if (!apiKey && !projectId) {
    return { ok: false, message: 'No credentials configured for Google Vertex AI' }
  }

  try {
    const result = await fetchGoogleVertexModels(apiKey, projectId, region)
    return result
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return { ok: false, message: `Connection failed: ${message}` }
  }
}

async function fetchGoogleVertexModels(
  apiKey: string | undefined,
  projectId: string | undefined,
  region: string
): Promise<TestResult> {
  if (apiKey) {
    return testWithApiKey(apiKey)
  }
  if (projectId) {
    return testWithProjectId(projectId, region)
  }
  return { ok: false, message: 'No valid credentials provided' }
}

async function testWithApiKey(apiKey: string): Promise<TestResult> {
  const url =
    `https://generativelanguage.googleapis.com/v1/models?key=${encodeURIComponent(apiKey)}`
  const resp = await fetch(url)
  if (resp.ok) {
    return { ok: true, message: 'Connection successful — API key is valid' }
  }
  const body = await resp.text().catch(() => '')
  return { ok: false, message: `API returned ${resp.status}: ${body.slice(0, 200)}` }
}

async function testWithProjectId(projectId: string, region: string): Promise<TestResult> {
  const url =
    `https://${region}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${region}/publishers/google/models`
  const resp = await fetch(url)
  if (resp.ok) {
    return { ok: true, message: 'Connection successful — project credentials valid' }
  }
  return { ok: false, message: `API returned ${resp.status} — check project ID and permissions` }
}

// ─── Utilities ────────────────────────────────────────────────────────────────

/** Returns a fixed mask string for display. Never reveals the actual value. */
function maskValue(): string {
  return '••••••••'
}
