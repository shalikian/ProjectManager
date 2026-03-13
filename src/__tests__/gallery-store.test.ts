/**
 * Tests for the gallery main-process store (pure logic, no Electron deps).
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { join } from 'path'
import { tmpdir } from 'os'
import { mkdtempSync, writeFileSync, mkdirSync, existsSync } from 'fs'

// We import only pure functions that don't need Electron app.getPath
import {
  ensureDir,
  parseGalleryItem,
  scanOutputDir,
  loadThumbDataUrl,
  saveGalleryImage,
  deleteGalleryItem,
  THUMBNAIL_WIDTH
} from '../main/gallery/gallery-store'

let tmpDir: string

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), 'gallery-test-'))
})

afterEach(() => {
  // cleanup is done by OS temp management
})

// ─── Happy path ───────────────────────────────────────────────────────────────

describe('ensureDir', () => {
  it('creates a directory that does not exist', () => {
    const newDir = join(tmpDir, 'new-subdir')
    expect(existsSync(newDir)).toBe(false)
    ensureDir(newDir)
    expect(existsSync(newDir)).toBe(true)
  })

  it('is idempotent — does not throw if directory already exists', () => {
    expect(() => ensureDir(tmpDir)).not.toThrow()
  })
})

describe('parseGalleryItem', () => {
  it('happy path: parses a valid png+json pair', () => {
    const stem = 'imagen4_20260313T120000_abc123'
    const pngPath = join(tmpDir, `${stem}.png`)
    const thumbPath = join(tmpDir, `${stem}_thumb.png`)
    const metaPath = join(tmpDir, `${stem}.json`)

    const metadata = {
      prompt: 'a beautiful landscape',
      model: 'imagen-4',
      params: { width: 512, height: 512 },
      timestamp: '2026-03-13T12:00:00.000Z'
    }
    writeFileSync(pngPath, Buffer.from('fakepng'))
    writeFileSync(metaPath, JSON.stringify(metadata))

    const item = parseGalleryItem(pngPath, thumbPath, metaPath)
    expect(item).not.toBeNull()
    expect(item!.id).toBe(stem)
    expect(item!.filePath).toBe(pngPath)
    expect(item!.metaPath).toBe(metaPath)
    expect(item!.metadata.prompt).toBe('a beautiful landscape')
    expect(item!.metadata.model).toBe('imagen-4')
  })

  it('edge case: returns null if meta JSON is missing', () => {
    const stem = 'no_meta'
    const pngPath = join(tmpDir, `${stem}.png`)
    const thumbPath = join(tmpDir, `${stem}_thumb.png`)
    const metaPath = join(tmpDir, `${stem}.json`)
    writeFileSync(pngPath, Buffer.from('fakepng'))
    // metaPath intentionally not created

    const item = parseGalleryItem(pngPath, thumbPath, metaPath)
    expect(item).toBeNull()
  })

  it('edge case: returns null if meta JSON is malformed', () => {
    const stem = 'bad_meta'
    const pngPath = join(tmpDir, `${stem}.png`)
    const thumbPath = join(tmpDir, `${stem}_thumb.png`)
    const metaPath = join(tmpDir, `${stem}.json`)
    writeFileSync(pngPath, Buffer.from('fakepng'))
    writeFileSync(metaPath, 'NOT_VALID_JSON')

    const item = parseGalleryItem(pngPath, thumbPath, metaPath)
    expect(item).toBeNull()
  })
})

describe('scanOutputDir', () => {
  it('happy path: scans directory and returns items sorted newest-first', () => {
    const makeItem = (stem: string, ts: string): void => {
      writeFileSync(join(tmpDir, `${stem}.png`), Buffer.from('img'))
      writeFileSync(
        join(tmpDir, `${stem}.json`),
        JSON.stringify({ prompt: stem, model: 'test', params: {}, timestamp: ts })
      )
    }

    makeItem('item_a', '2026-03-13T10:00:00.000Z')
    makeItem('item_b', '2026-03-13T12:00:00.000Z')
    makeItem('item_c', '2026-03-13T11:00:00.000Z')

    const items = scanOutputDir(tmpDir)
    expect(items.length).toBe(3)
    // Sorted newest-first
    expect(items[0].metadata.timestamp).toBe('2026-03-13T12:00:00.000Z')
    expect(items[2].metadata.timestamp).toBe('2026-03-13T10:00:00.000Z')
  })

  it('edge case: returns empty array when directory does not exist', () => {
    const missing = join(tmpDir, 'nonexistent')
    const items = scanOutputDir(missing)
    expect(items).toEqual([])
  })

  it('edge case: skips png files that have no companion json', () => {
    writeFileSync(join(tmpDir, 'orphan.png'), Buffer.from('img'))
    const items = scanOutputDir(tmpDir)
    expect(items).toEqual([])
  })

  it('edge case: skips thumbnail files (ending in _thumb.png)', () => {
    const stem = 'real_image'
    writeFileSync(join(tmpDir, `${stem}.png`), Buffer.from('img'))
    writeFileSync(join(tmpDir, `${stem}_thumb.png`), Buffer.from('thumb'))
    writeFileSync(
      join(tmpDir, `${stem}.json`),
      JSON.stringify({ prompt: 'p', model: 'm', params: {}, timestamp: '2026-01-01T00:00:00Z' })
    )
    const items = scanOutputDir(tmpDir)
    // Only the main image, not the thumb
    expect(items.length).toBe(1)
    expect(items[0].id).toBe(stem)
  })
})

describe('loadThumbDataUrl', () => {
  it('returns a data:image/png;base64 string for an existing file', () => {
    const pngPath = join(tmpDir, 'test.png')
    writeFileSync(pngPath, Buffer.from('fakepngdata'))
    const result = loadThumbDataUrl(pngPath, pngPath)
    expect(result).toMatch(/^data:image\/png;base64,/)
  })

  it('falls back to mainPath if thumbPath does not exist', () => {
    const mainPath = join(tmpDir, 'main.png')
    const thumbPath = join(tmpDir, 'missing_thumb.png')
    writeFileSync(mainPath, Buffer.from('maindata'))
    const result = loadThumbDataUrl(thumbPath, mainPath)
    expect(result).toMatch(/^data:image\/png;base64,/)
    expect(result).toContain(Buffer.from('maindata').toString('base64'))
  })

  it('returns empty string if both files are missing', () => {
    const result = loadThumbDataUrl(
      join(tmpDir, 'nothumb.png'),
      join(tmpDir, 'nomain.png')
    )
    expect(result).toBe('')
  })
})

describe('saveGalleryImage', () => {
  it('happy path: saves png, thumb, and json files', () => {
    const imgData = Buffer.from('fakepngcontent')
    const result = saveGalleryImage(tmpDir, {
      imageBase64: imgData.toString('base64'),
      metadata: {
        prompt: 'test prompt',
        model: 'imagen-test',
        params: { width: 512 },
        timestamp: '2026-03-13T12:00:00.000Z'
      }
    })

    expect(result.ok).toBe(true)
    expect(result.item).toBeDefined()
    expect(result.item!.metadata.prompt).toBe('test prompt')
    expect(existsSync(result.item!.filePath)).toBe(true)
    expect(existsSync(result.item!.metaPath)).toBe(true)
  })

  it('creates the output directory if it does not exist', () => {
    const subDir = join(tmpDir, 'auto-created')
    expect(existsSync(subDir)).toBe(false)

    const imgData = Buffer.from('fakepng')
    const result = saveGalleryImage(subDir, {
      imageBase64: imgData.toString('base64'),
      metadata: {
        prompt: 'dir creation test',
        model: 'test',
        params: {},
        timestamp: new Date().toISOString()
      }
    })

    expect(result.ok).toBe(true)
    expect(existsSync(subDir)).toBe(true)
  })
})

describe('deleteGalleryItem', () => {
  it('happy path: deletes all three files', () => {
    const stem = 'to_delete'
    const pngPath = join(tmpDir, `${stem}.png`)
    const thumbPath = join(tmpDir, `${stem}_thumb.png`)
    const metaPath = join(tmpDir, `${stem}.json`)
    writeFileSync(pngPath, Buffer.from('img'))
    writeFileSync(thumbPath, Buffer.from('thumb'))
    writeFileSync(metaPath, JSON.stringify({ prompt: '', model: '', params: {}, timestamp: '' }))

    const item = parseGalleryItem(pngPath, thumbPath, metaPath)!
    const deleted = deleteGalleryItem(item)
    expect(deleted).toBe(true)
    expect(existsSync(pngPath)).toBe(false)
    expect(existsSync(metaPath)).toBe(false)
  })

  it('edge case: does not throw if files are already missing', () => {
    const item = {
      id: 'ghost',
      filePath: join(tmpDir, 'ghost.png'),
      thumbPath: join(tmpDir, 'ghost_thumb.png'),
      metaPath: join(tmpDir, 'ghost.json'),
      metadata: { prompt: '', model: '', params: {}, timestamp: '' }
    }
    expect(() => deleteGalleryItem(item)).not.toThrow()
  })
})

describe('THUMBNAIL_WIDTH', () => {
  it('exports a positive integer constant', () => {
    expect(typeof THUMBNAIL_WIDTH).toBe('number')
    expect(THUMBNAIL_WIDTH).toBeGreaterThan(0)
  })
})
