import { describe, it, expect } from 'vitest'

/**
 * Tests for the vertex-ai plugin helpers module.
 * We load the CommonJS module directly.
 */
// eslint-disable-next-line @typescript-eslint/no-require-imports
const helpers = require('../../plugins/vertex-ai/helpers') as {
  requireApiKey: (ctx: unknown) => string
  base64ToBuffer: (b64: string) => Buffer
  reportProgress: (ctx: unknown, pct: number, msg?: string) => void
  checkAbort: (ctx: unknown) => void
  formatApiError: (err: unknown) => string
}

// ─── requireApiKey ────────────────────────────────────────────────────────────

describe('requireApiKey', () => {
  it('returns the key when context provides GOOGLE_API_KEY', () => {
    const ctx = { getSecret: (k: string) => (k === 'GOOGLE_API_KEY' ? 'my-key' : undefined) }
    expect(helpers.requireApiKey(ctx)).toBe('my-key')
  })

  it('throws a user-friendly error when getSecret returns undefined', () => {
    const ctx = { getSecret: () => undefined }
    expect(() => helpers.requireApiKey(ctx)).toThrow(/Configure Google credentials/)
  })

  it('throws when context is null', () => {
    expect(() => helpers.requireApiKey(null)).toThrow(/Configure Google credentials/)
  })

  it('throws when context has no getSecret function', () => {
    expect(() => helpers.requireApiKey({})).toThrow(/Configure Google credentials/)
  })
})

// ─── base64ToBuffer ───────────────────────────────────────────────────────────

describe('base64ToBuffer', () => {
  it('converts a base64 string to a Buffer', () => {
    const original = 'hello world'
    const b64 = Buffer.from(original).toString('base64')
    const result = helpers.base64ToBuffer(b64)
    expect(Buffer.isBuffer(result)).toBe(true)
    expect(result.toString('utf8')).toBe(original)
  })

  it('returns an empty buffer for an empty string', () => {
    const result = helpers.base64ToBuffer('')
    expect(Buffer.isBuffer(result)).toBe(true)
    expect(result.length).toBe(0)
  })
})

// ─── reportProgress ───────────────────────────────────────────────────────────

describe('reportProgress', () => {
  it('calls context.reportProgress with percent and message', () => {
    const calls: [number, string | undefined][] = []
    const ctx = { reportProgress: (pct: number, msg?: string) => calls.push([pct, msg]) }
    helpers.reportProgress(ctx, 50, 'halfway')
    expect(calls).toEqual([[50, 'halfway']])
  })

  it('does not throw when context is undefined', () => {
    expect(() => helpers.reportProgress(undefined, 10)).not.toThrow()
  })

  it('does not throw when context has no reportProgress', () => {
    expect(() => helpers.reportProgress({}, 20, 'test')).not.toThrow()
  })
})

// ─── checkAbort ──────────────────────────────────────────────────────────────

describe('checkAbort', () => {
  it('does not throw when abortSignal is not aborted', () => {
    const ctrl = new AbortController()
    expect(() => helpers.checkAbort({ abortSignal: ctrl.signal })).not.toThrow()
  })

  it('throws when abortSignal is already aborted', () => {
    const ctrl = new AbortController()
    ctrl.abort()
    expect(() => helpers.checkAbort({ abortSignal: ctrl.signal })).toThrow(/cancel/)
  })

  it('does not throw when context is null', () => {
    expect(() => helpers.checkAbort(null)).not.toThrow()
  })

  it('does not throw when context has no abortSignal', () => {
    expect(() => helpers.checkAbort({})).not.toThrow()
  })
})

// ─── formatApiError ───────────────────────────────────────────────────────────

describe('formatApiError', () => {
  it('returns a safety message when error message contains SAFETY', () => {
    const result = helpers.formatApiError({ message: 'SAFETY filter triggered' })
    expect(result).toMatch(/safety filter/i)
  })

  it('returns the error message for generic errors', () => {
    const result = helpers.formatApiError({ message: 'Network timeout' })
    expect(result).toBe('Network timeout')
  })

  it('returns "Unknown error" for null/undefined', () => {
    expect(helpers.formatApiError(null)).toBe('Unknown error')
    expect(helpers.formatApiError(undefined)).toBe('Unknown error')
  })

  it('returns the string directly when error is a string', () => {
    expect(helpers.formatApiError('rate limit exceeded')).toBe('rate limit exceeded')
  })

  it('handles safety keyword in message', () => {
    const result = helpers.formatApiError({ message: 'Request was blocked' })
    expect(result).toMatch(/safety filter/i)
  })
})
