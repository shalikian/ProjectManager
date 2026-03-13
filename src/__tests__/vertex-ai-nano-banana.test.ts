import { describe, it, expect, vi } from 'vitest'

/**
 * Tests for the Nano Banana (Gemini) node.
 * Uses the _executeCore injectable pattern to avoid real SDK calls.
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const nanoBananaNode = require('../../plugins/vertex-ai/nano-banana') as {
  id: string
  name: string
  category: string
  description: string
  inputs: Array<{ id: string; label: string; type: string }>
  outputs: Array<{ id: string; label: string; type: string }>
  parameters: Array<{ id: string; type: string; default?: unknown }>
  execute: (inputs: Record<string, unknown>, ctx?: unknown) => Promise<Record<string, unknown>>
  _executeCore: (
    inputs: Record<string, unknown>,
    ctx: unknown,
    client: unknown
  ) => Promise<Record<string, unknown>>
  _buildParts: (prompt: string, img?: Buffer) => object[]
  _extractResponse: (resp: object) => { imageBuffer: Buffer | null; responseText: string }
}

// ─── Context helpers ──────────────────────────────────────────────────────────

function makeContext(overrides: {
  apiKey?: string | null
  aborted?: boolean
} = {}) {
  const ctrl = new AbortController()
  if (overrides.aborted) ctrl.abort()
  // Use null as explicit "no key" sentinel, undefined means "use default key"
  const resolvedKey = overrides.apiKey === null ? undefined : (overrides.apiKey ?? 'test-key')
  return {
    getSecret: (key: string) => (key === 'GOOGLE_API_KEY' ? resolvedKey : undefined),
    reportProgress: vi.fn(),
    abortSignal: ctrl.signal
  }
}

// ─── Mock client builders ─────────────────────────────────────────────────────

function makeSuccessClient(imageData = 'fake-image', text = 'A lovely image') {
  return {
    models: {
      generateContent: vi.fn().mockResolvedValue({
        candidates: [
          {
            content: {
              parts: [
                { text },
                {
                  inlineData: {
                    mimeType: 'image/png',
                    data: Buffer.from(imageData).toString('base64')
                  }
                }
              ]
            }
          }
        ]
      })
    }
  }
}

function makeErrorClient(message: string) {
  return {
    models: {
      generateContent: vi.fn().mockRejectedValue(new Error(message))
    }
  }
}

function makeEmptyClient() {
  return {
    models: {
      generateContent: vi.fn().mockResolvedValue({ candidates: [] })
    }
  }
}

// ─── Node metadata tests ──────────────────────────────────────────────────────

describe('Nano Banana node — metadata', () => {
  it('has correct id, name, and category', () => {
    expect(nanoBananaNode.id).toBe('vertex.nano-banana')
    expect(nanoBananaNode.name).toBe('Nano Banana')
    expect(nanoBananaNode.category).toBe('Google/Image Generation')
  })

  it('has prompt and image inputs', () => {
    const ids = nanoBananaNode.inputs.map(i => i.id)
    expect(ids).toContain('prompt')
    expect(ids).toContain('image')
  })

  it('has image and text outputs', () => {
    const ids = nanoBananaNode.outputs.map(o => o.id)
    expect(ids).toContain('image')
    expect(ids).toContain('text')
  })

  it('has model, aspectRatio, and sampleCount parameters', () => {
    const ids = nanoBananaNode.parameters.map(p => p.id)
    expect(ids).toContain('model')
    expect(ids).toContain('aspectRatio')
    expect(ids).toContain('sampleCount')
  })
})

// ─── _buildParts helper tests ─────────────────────────────────────────────────

describe('Nano Banana — _buildParts', () => {
  it('returns text-only parts when no image buffer given', () => {
    const parts = nanoBananaNode._buildParts('hello')
    expect(parts).toHaveLength(1)
    expect(parts[0]).toMatchObject({ text: 'hello' })
  })

  it('includes inlineData part when image buffer provided', () => {
    const buf = Buffer.from('img-data')
    const parts = nanoBananaNode._buildParts('hello', buf)
    expect(parts).toHaveLength(2)
    expect(parts[1]).toMatchObject({ inlineData: { mimeType: 'image/png' } })
  })
})

// ─── _extractResponse helper tests ───────────────────────────────────────────

describe('Nano Banana — _extractResponse', () => {
  it('extracts text and image from valid response', () => {
    const imgB64 = Buffer.from('pixels').toString('base64')
    const response = {
      candidates: [
        {
          content: {
            parts: [
              { text: 'cool image' },
              { inlineData: { mimeType: 'image/png', data: imgB64 } }
            ]
          }
        }
      ]
    }
    const { imageBuffer, responseText } = nanoBananaNode._extractResponse(response)
    expect(Buffer.isBuffer(imageBuffer)).toBe(true)
    expect(responseText).toBe('cool image')
  })

  it('returns null imageBuffer and empty text for empty candidates', () => {
    const { imageBuffer, responseText } = nanoBananaNode._extractResponse({ candidates: [] })
    expect(imageBuffer).toBeNull()
    expect(responseText).toBe('')
  })
})

// ─── _executeCore tests (happy path + edge cases) ────────────────────────────

describe('Nano Banana node — executeCore', () => {
  // Happy path: returns image buffer and text
  it('returns image buffer and text on success', async () => {
    const client = makeSuccessClient()
    const ctx = makeContext()
    const result = await nanoBananaNode._executeCore({ prompt: 'a sunset' }, ctx, client)
    expect(Buffer.isBuffer(result.image)).toBe(true)
    expect(result.text).toBe('A lovely image')
  })

  // Happy path: progress is reported
  it('calls reportProgress during execution', async () => {
    const client = makeSuccessClient()
    const ctx = makeContext()
    await nanoBananaNode._executeCore({ prompt: 'test' }, ctx, client)
    expect(ctx.reportProgress).toHaveBeenCalledWith(10, expect.any(String))
    expect(ctx.reportProgress).toHaveBeenCalledWith(100, 'Done')
  })

  // Edge case 1: missing API credentials
  it('throws Configure Google credentials when GOOGLE_API_KEY is missing', async () => {
    const ctx = makeContext({ apiKey: null })
    await expect(
      nanoBananaNode._executeCore({ prompt: 'test' }, ctx, makeSuccessClient())
    ).rejects.toThrow(/Configure Google credentials/)
  })

  // Edge case 2: empty prompt
  it('throws Prompt is required when prompt is empty', async () => {
    const ctx = makeContext()
    await expect(
      nanoBananaNode._executeCore({ prompt: '' }, ctx, makeSuccessClient())
    ).rejects.toThrow(/Prompt is required/)
  })

  // Edge case 3: aborted before execution starts
  it('throws cancel error when abortSignal is already aborted', async () => {
    const ctx = makeContext({ aborted: true })
    await expect(
      nanoBananaNode._executeCore({ prompt: 'test' }, ctx, makeSuccessClient())
    ).rejects.toThrow(/cancel/)
  })

  // Edge case 4: API returns error
  it('wraps API errors with Nano Banana API error prefix', async () => {
    const client = makeErrorClient('Connection refused')
    const ctx = makeContext()
    await expect(
      nanoBananaNode._executeCore({ prompt: 'test' }, ctx, client)
    ).rejects.toThrow(/Nano Banana API error/)
  })

  // Edge case 5: empty candidates returns null image and empty text
  it('returns null image and empty text when API response has no candidates', async () => {
    const client = makeEmptyClient()
    const ctx = makeContext()
    const result = await nanoBananaNode._executeCore({ prompt: 'test' }, ctx, client)
    expect(result.image).toBeNull()
    expect(result.text).toBe('')
  })

  // Edge case 6: null context gracefully handled (no API key)
  it('throws Configure Google credentials when context is undefined', async () => {
    await expect(
      nanoBananaNode._executeCore({ prompt: 'test' }, undefined, makeSuccessClient())
    ).rejects.toThrow(/Configure Google credentials/)
  })
})
