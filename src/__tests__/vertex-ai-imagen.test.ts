import { describe, it, expect, vi } from 'vitest'

/**
 * Tests for the Imagen 4 node.
 * Uses the _executeCore injectable pattern to avoid real SDK calls.
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const imagenNode = require('../../plugins/vertex-ai/imagen') as {
  id: string
  name: string
  category: string
  inputs: Array<{ id: string; label: string; type: string }>
  outputs: Array<{ id: string; label: string; type: string }>
  parameters: Array<{ id: string; type: string; default?: unknown }>
  execute: (inputs: Record<string, unknown>, ctx?: unknown) => Promise<Record<string, unknown>>
  _executeCore: (
    inputs: Record<string, unknown>,
    ctx: unknown,
    predictFn: ((body: unknown) => Promise<unknown>) | undefined
  ) => Promise<Record<string, unknown>>
  _buildImagenRequest: (
    prompt: string,
    inputs: Record<string, unknown>
  ) => { instances: object[]; parameters: object }
  _extractImageBuffers: (response: object) => Buffer[]
}

// ─── Context helper ───────────────────────────────────────────────────────────

function makeContext(overrides: {
  apiKey?: string | null
  aborted?: boolean
} = {}) {
  const ctrl = new AbortController()
  if (overrides.aborted) ctrl.abort()
  // Use null as explicit "no key" sentinel, undefined means "use default test key"
  const resolvedKey = overrides.apiKey === null ? undefined : (overrides.apiKey ?? 'test-key')
  return {
    getSecret: (key: string) => (key === 'GOOGLE_API_KEY' ? resolvedKey : undefined),
    reportProgress: vi.fn(),
    abortSignal: ctrl.signal
  }
}

// ─── Predict function factories ───────────────────────────────────────────────

function makeSuccessPredict(count = 1) {
  const predictions = Array.from({ length: count }, () => ({
    bytesBase64Encoded: Buffer.from('fake-image-bytes').toString('base64')
  }))
  return vi.fn().mockResolvedValue({ predictions })
}

function makeErrorPredict(message: string) {
  return vi.fn().mockRejectedValue(new Error(message))
}

// ─── Node metadata tests ──────────────────────────────────────────────────────

describe('Imagen 4 node — metadata', () => {
  it('has correct id, name, and category', () => {
    expect(imagenNode.id).toBe('vertex.imagen4')
    expect(imagenNode.name).toBe('Imagen 4')
    expect(imagenNode.category).toBe('Google/Image Generation')
  })

  it('has a prompt input port', () => {
    const ids = imagenNode.inputs.map(i => i.id)
    expect(ids).toContain('prompt')
  })

  it('has image and images output ports', () => {
    const ids = imagenNode.outputs.map(o => o.id)
    expect(ids).toContain('image')
    expect(ids).toContain('images')
  })

  it('has required parameters', () => {
    const ids = imagenNode.parameters.map(p => p.id)
    expect(ids).toContain('model')
    expect(ids).toContain('sampleCount')
    expect(ids).toContain('aspectRatio')
    expect(ids).toContain('negativePrompt')
    expect(ids).toContain('seed')
    expect(ids).toContain('safetyFilterLevel')
    expect(ids).toContain('personGeneration')
  })
})

// ─── _buildImagenRequest helper tests ────────────────────────────────────────

describe('Imagen 4 — _buildImagenRequest', () => {
  it('creates request with default parameters', () => {
    const req = imagenNode._buildImagenRequest('a cat', {})
    expect(req.instances).toHaveLength(1)
    expect(req.instances[0]).toMatchObject({ prompt: 'a cat' })
    expect((req.parameters as Record<string, unknown>).sampleCount).toBe(1)
    expect((req.parameters as Record<string, unknown>).aspectRatio).toBe('1:1')
  })

  it('includes negativePrompt when provided', () => {
    const req = imagenNode._buildImagenRequest('a cat', { negativePrompt: 'blurry' })
    expect((req.parameters as Record<string, unknown>).negativePrompt).toBe('blurry')
  })

  it('omits negativePrompt when empty', () => {
    const req = imagenNode._buildImagenRequest('a cat', { negativePrompt: '' })
    expect((req.parameters as Record<string, unknown>).negativePrompt).toBeUndefined()
  })

  it('includes seed when provided', () => {
    const req = imagenNode._buildImagenRequest('a cat', { seed: 42 })
    expect((req.parameters as Record<string, unknown>).seed).toBe(42)
  })

  it('omits seed when empty string', () => {
    const req = imagenNode._buildImagenRequest('a cat', { seed: '' })
    expect((req.parameters as Record<string, unknown>).seed).toBeUndefined()
  })
})

// ─── _extractImageBuffers helper tests ───────────────────────────────────────

describe('Imagen 4 — _extractImageBuffers', () => {
  it('extracts buffers from bytesBase64Encoded predictions', () => {
    const b64 = Buffer.from('img').toString('base64')
    const response = { predictions: [{ bytesBase64Encoded: b64 }] }
    const buffers = imagenNode._extractImageBuffers(response)
    expect(buffers).toHaveLength(1)
    expect(Buffer.isBuffer(buffers[0])).toBe(true)
  })

  it('handles imageBytes field as fallback', () => {
    const b64 = Buffer.from('img2').toString('base64')
    const response = { predictions: [{ imageBytes: b64 }] }
    const buffers = imagenNode._extractImageBuffers(response)
    expect(buffers).toHaveLength(1)
  })

  it('returns empty array when predictions is empty', () => {
    const buffers = imagenNode._extractImageBuffers({ predictions: [] })
    expect(buffers).toHaveLength(0)
  })

  it('skips predictions without image data', () => {
    const response = { predictions: [{ otherField: 'value' }] }
    const buffers = imagenNode._extractImageBuffers(response)
    expect(buffers).toHaveLength(0)
  })
})

// ─── _executeCore tests (happy path + edge cases) ────────────────────────────

describe('Imagen 4 node — executeCore', () => {
  // Happy path: single image
  it('returns image Buffer and images array on success', async () => {
    const ctx = makeContext()
    const predict = makeSuccessPredict(1)
    const result = await imagenNode._executeCore({ prompt: 'a futuristic city' }, ctx, predict)
    expect(Buffer.isBuffer(result.image)).toBe(true)
    expect(Array.isArray(result.images)).toBe(true)
    expect((result.images as Buffer[]).length).toBe(1)
  })

  // Happy path: multiple images (sampleCount)
  it('returns multiple images when sampleCount is 3', async () => {
    const ctx = makeContext()
    const predict = makeSuccessPredict(3)
    const result = await imagenNode._executeCore(
      { prompt: 'test', sampleCount: 3 },
      ctx,
      predict
    )
    expect((result.images as Buffer[]).length).toBe(3)
  })

  // Happy path: progress is reported
  it('calls reportProgress during execution', async () => {
    const ctx = makeContext()
    await imagenNode._executeCore({ prompt: 'test' }, ctx, makeSuccessPredict())
    expect(ctx.reportProgress).toHaveBeenCalledWith(10, expect.any(String))
    expect(ctx.reportProgress).toHaveBeenCalledWith(100, 'Done')
  })

  // Edge case 1: missing API credentials
  it('throws Configure Google credentials when GOOGLE_API_KEY missing', async () => {
    const ctx = makeContext({ apiKey: null })
    await expect(
      imagenNode._executeCore({ prompt: 'test' }, ctx, makeSuccessPredict())
    ).rejects.toThrow(/Configure Google credentials/)
  })

  // Edge case 2: empty/whitespace prompt
  it('throws Prompt is required for whitespace-only prompt', async () => {
    const ctx = makeContext()
    await expect(
      imagenNode._executeCore({ prompt: '   ' }, ctx, makeSuccessPredict())
    ).rejects.toThrow(/Prompt is required/)
  })

  // Edge case 3: cancelled before execution
  it('throws cancel error when abortSignal is already aborted', async () => {
    const ctx = makeContext({ aborted: true })
    await expect(
      imagenNode._executeCore({ prompt: 'test' }, ctx, makeSuccessPredict())
    ).rejects.toThrow(/cancel/)
  })

  // Edge case 4: safety filter block
  it('shows safety filter message when API returns SAFETY error', async () => {
    const ctx = makeContext()
    const predict = makeErrorPredict('SAFETY filter: content policy violation')
    await expect(
      imagenNode._executeCore({ prompt: 'test' }, ctx, predict)
    ).rejects.toThrow(/safety filter/i)
  })

  // Edge case 5: network error is wrapped
  it('wraps generic network errors with Imagen API error prefix', async () => {
    const ctx = makeContext()
    const predict = makeErrorPredict('Connection refused')
    await expect(
      imagenNode._executeCore({ prompt: 'test' }, ctx, predict)
    ).rejects.toThrow(/Imagen API error/)
  })

  // Edge case 6: empty predictions → null image
  it('returns null image when predictions array is empty', async () => {
    const ctx = makeContext()
    const predict = vi.fn().mockResolvedValue({ predictions: [] })
    const result = await imagenNode._executeCore({ prompt: 'test' }, ctx, predict)
    expect(result.image).toBeNull()
    expect((result.images as unknown[]).length).toBe(0)
  })
})
