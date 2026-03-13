/**
 * Tests for CredentialStore.
 *
 * We mock electron's safeStorage and app to avoid needing a real Electron
 * environment. The store is tested with a temp file path to avoid disk side-effects.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, rmSync, writeFileSync, readFileSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'

// ─── Mock electron module ─────────────────────────────────────────────────────
// Use vi.hoisted so these refs are available when vi.mock factory runs.

const { mockEncryptString, mockDecryptString, mockIsEncryptionAvailable } = vi.hoisted(() => {
  const mockEncryptString = vi.fn((value: string): Buffer => {
    // Simple reversible mock: XOR each char code with 42
    const buf = Buffer.from(value.split('').map(c => c.charCodeAt(0) ^ 42))
    return buf
  })

  const mockDecryptString = vi.fn((buf: Buffer): string => {
    return buf
      .toJSON()
      .data.map((b: number) => String.fromCharCode(b ^ 42))
      .join('')
  })

  const mockIsEncryptionAvailable = vi.fn(() => true)

  return { mockEncryptString, mockDecryptString, mockIsEncryptionAvailable }
})

vi.mock('electron', () => ({
  app: {
    getPath: vi.fn(() => '/mock/userData')
  },
  safeStorage: {
    isEncryptionAvailable: mockIsEncryptionAvailable,
    encryptString: mockEncryptString,
    decryptString: mockDecryptString
  }
}))

// ─── Import after mocking ─────────────────────────────────────────────────────

import { CredentialStore } from '../main/credentials/credential-store'

// ─── Test helpers ─────────────────────────────────────────────────────────────

function makeTempStore(): { store: CredentialStore; dir: string } {
  const dir = mkdtempSync(join(tmpdir(), 'cred-test-'))
  const store = new CredentialStore(join(dir, 'credentials.json'))
  return { store, dir }
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('CredentialStore — happy path', () => {
  let dir: string
  let store: CredentialStore

  beforeEach(() => {
    vi.clearAllMocks()
    ;({ store, dir } = makeTempStore())
  })

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true })
  })

  it('saves and retrieves a credential', () => {
    store.save('my-key', 'my-secret')
    const result = store.getSecret('my-key')
    expect(result).toBe('my-secret')
  })

  it('lists stored keys without revealing values', () => {
    store.save('key-a', 'val-a')
    store.save('key-b', 'val-b')
    const keys = store.listKeys()
    expect(keys).toContain('key-a')
    expect(keys).toContain('key-b')
    expect(keys).toHaveLength(2)
  })

  it('persists credentials across store instances (simulated restart)', () => {
    const filePath = join(dir, 'creds.json')
    const store1 = new CredentialStore(filePath)
    store1.save('persistent-key', 'persistent-value')

    // Create a fresh instance pointing at the same file
    const store2 = new CredentialStore(filePath)
    const result = store2.getSecret('persistent-key')
    expect(result).toBe('persistent-value')
  })

  it('deletes a credential and returns true', () => {
    store.save('to-delete', 'value')
    const deleted = store.delete('to-delete')
    expect(deleted).toBe(true)
    expect(store.getSecret('to-delete')).toBeUndefined()
    expect(store.listKeys()).not.toContain('to-delete')
  })

  it('has() returns true for stored keys and false for missing keys', () => {
    store.save('exists', 'val')
    expect(store.has('exists')).toBe(true)
    expect(store.has('missing')).toBe(false)
  })
})

describe('CredentialStore — edge cases', () => {
  let dir: string
  let store: CredentialStore

  beforeEach(() => {
    vi.clearAllMocks()
    ;({ store, dir } = makeTempStore())
  })

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true })
  })

  // Edge case 1: safeStorage unavailable
  it('returns error when safeStorage is unavailable during save', () => {
    mockIsEncryptionAvailable.mockReturnValueOnce(false)
    const result = store.save('key', 'value')
    expect(result.ok).toBe(false)
    expect(result.error).toMatch(/not available/)
  })

  // Edge case 2: getSecret returns undefined when safeStorage unavailable at read time
  it('getSecret returns undefined when safeStorage unavailable at decrypt time', () => {
    // First save with encryption available
    store.save('key', 'value')
    // Then decrypt with encryption unavailable
    mockIsEncryptionAvailable.mockReturnValueOnce(false)
    const result = store.getSecret('key')
    expect(result).toBeUndefined()
  })

  // Edge case 3: getSecret returns undefined for missing key
  it('getSecret returns undefined for a non-existent key', () => {
    const result = store.getSecret('does-not-exist')
    expect(result).toBeUndefined()
  })

  // Edge case 4: delete returns false for non-existent key
  it('delete returns false for a key that does not exist', () => {
    const result = store.delete('never-saved')
    expect(result).toBe(false)
  })

  // Edge case 5: overwriting a credential with a new value
  it('overwrites an existing credential when saved again', () => {
    store.save('key', 'original')
    store.save('key', 'updated')
    const result = store.getSecret('key')
    expect(result).toBe('updated')
  })

  // Edge case 6: corrupt credentials file — falls back gracefully
  it('starts with empty store when credentials file is corrupt', () => {
    const filePath = join(dir, 'corrupt.json')
    // Write invalid JSON
    writeFileSync(filePath, '{ invalid json }', 'utf-8')
    const corruptStore = new CredentialStore(filePath)
    expect(corruptStore.listKeys()).toHaveLength(0)
    expect(corruptStore.getSecret('any')).toBeUndefined()
  })
})

describe('CredentialStore — encryption calls', () => {
  let dir: string
  let store: CredentialStore

  beforeEach(() => {
    vi.clearAllMocks()
    ;({ store, dir } = makeTempStore())
  })

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true })
  })

  it('calls encryptString when saving a credential', () => {
    store.save('k', 'v')
    expect(mockEncryptString).toHaveBeenCalledWith('v')
  })

  it('calls decryptString when retrieving a credential', () => {
    store.save('k', 'v')
    store.getSecret('k')
    expect(mockDecryptString).toHaveBeenCalledTimes(1)
  })

  it('never stores plaintext value on disk', () => {
    store.save('api-key', 'super-secret')
    // Read the raw file and verify plaintext is not present
    const raw = readFileSync(join(dir, 'credentials.json'), 'utf-8')
    expect(raw).not.toContain('super-secret')
  })
})
