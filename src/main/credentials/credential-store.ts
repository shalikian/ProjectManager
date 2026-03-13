/**
 * CredentialStore — secure credential storage using Electron safeStorage.
 *
 * Responsibilities:
 *  - Encrypt values with safeStorage.encryptString() before persisting
 *  - Store encrypted blobs (base64) in userData/credentials.json
 *  - Decrypt values only in the main process via getSecret()
 *  - Fall back gracefully when safeStorage is unavailable
 */

import { app, safeStorage } from 'electron'
import { join } from 'path'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'

/** Shape of the on-disk credentials file. Values are base64-encoded encrypted buffers. */
type CredentialFile = Record<string, string>

/** Result of a credential save operation. */
export interface SaveResult {
  ok: boolean
  error?: string
}

/** Result of a test-connection operation. */
export interface TestResult {
  ok: boolean
  message: string
}

/**
 * Manages encrypted credential storage for the application.
 * All encryption/decryption occurs in the main process only.
 */
export class CredentialStore {
  private filePath: string
  private cache: Map<string, string> = new Map()
  private loaded = false

  constructor(filePath?: string) {
    this.filePath = filePath ?? getDefaultCredentialPath()
  }

  // ─── Public API ──────────────────────────────────────────────────────────────

  /**
   * Save a credential by key. Encrypts the value before persisting.
   * Returns SaveResult with ok=false and error if encryption is unavailable.
   */
  save(key: string, value: string): SaveResult {
    if (!safeStorage.isEncryptionAvailable()) {
      return { ok: false, error: 'safeStorage encryption is not available on this system' }
    }
    try {
      const encrypted = safeStorage.encryptString(value)
      const blob = encrypted.toString('base64')
      this.ensureLoaded()
      this.cache.set(key, blob)
      this.persist()
      return { ok: true }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      return { ok: false, error: `Failed to encrypt credential: ${message}` }
    }
  }

  /**
   * Retrieve and decrypt a credential by key.
   * Returns undefined if the key doesn't exist or decryption fails.
   */
  getSecret(key: string): string | undefined {
    this.ensureLoaded()
    const blob = this.cache.get(key)
    if (!blob) return undefined
    return this.decryptBlob(blob)
  }

  /**
   * List all stored credential keys. Never returns values.
   */
  listKeys(): string[] {
    this.ensureLoaded()
    return Array.from(this.cache.keys())
  }

  /**
   * Delete a stored credential by key.
   */
  delete(key: string): boolean {
    this.ensureLoaded()
    const existed = this.cache.delete(key)
    if (existed) this.persist()
    return existed
  }

  /**
   * Returns whether a key exists in the store.
   */
  has(key: string): boolean {
    this.ensureLoaded()
    return this.cache.has(key)
  }

  // ─── Internal helpers ─────────────────────────────────────────────────────────

  private ensureLoaded(): void {
    if (this.loaded) return
    this.loaded = true
    this.loadFromDisk()
  }

  private loadFromDisk(): void {
    if (!existsSync(this.filePath)) return
    try {
      const raw = readFileSync(this.filePath, 'utf-8')
      const data: CredentialFile = JSON.parse(raw)
      for (const [key, blob] of Object.entries(data)) {
        if (typeof blob === 'string') {
          this.cache.set(key, blob)
        }
      }
    } catch {
      // Corrupt or unreadable file — start fresh
      this.cache.clear()
    }
  }

  private persist(): void {
    const data: CredentialFile = {}
    for (const [key, blob] of this.cache.entries()) {
      data[key] = blob
    }
    const dir = join(this.filePath, '..')
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
    writeFileSync(this.filePath, JSON.stringify(data, null, 2), 'utf-8')
  }

  private decryptBlob(blob: string): string | undefined {
    if (!safeStorage.isEncryptionAvailable()) return undefined
    try {
      const buffer = Buffer.from(blob, 'base64')
      return safeStorage.decryptString(buffer)
    } catch {
      return undefined
    }
  }
}

// ─── Module-level singleton ────────────────────────────────────────────────────

let instance: CredentialStore | null = null

/** Returns the shared CredentialStore instance. */
export function getCredentialStore(): CredentialStore {
  if (!instance) {
    instance = new CredentialStore()
  }
  return instance
}

/** Reset the singleton (for testing purposes only). */
export function resetCredentialStore(): void {
  instance = null
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getDefaultCredentialPath(): string {
  try {
    const userData = app.getPath('userData')
    return join(userData, 'credentials.json')
  } catch {
    // Fallback for testing or early access
    return join(process.cwd(), 'credentials.json')
  }
}
