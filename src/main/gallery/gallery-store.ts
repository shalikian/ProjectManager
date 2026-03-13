/**
 * Gallery storage service.
 * Handles saving images + metadata to disk and scanning output directories.
 */

import { app } from 'electron'
import { join } from 'path'
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync, unlinkSync } from 'fs'
import { createHash } from 'crypto'
import type { GalleryItem, GalleryItemMetadata, GallerySaveRequest, GallerySaveResult, GalleryListResult } from '../../shared/gallery-types'

const DEFAULT_OUTPUT_SUBDIR = 'NodeGen/outputs'
const SETTINGS_KEY = 'galleryOutputDir'
const SETTINGS_FILE = 'gallery-settings.json'
const THUMB_WIDTH = 200

/** Load persisted gallery settings (output directory). */
function loadSettings(settingsPath: string): Record<string, unknown> {
  try {
    if (existsSync(settingsPath)) {
      return JSON.parse(readFileSync(settingsPath, 'utf-8')) as Record<string, unknown>
    }
  } catch {
    // ignore
  }
  return {}
}

/** Persist gallery settings to disk. */
function saveSettings(settingsPath: string, settings: Record<string, unknown>): void {
  try {
    writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf-8')
  } catch {
    // ignore
  }
}

/** Get the default output directory path. */
function defaultOutputDir(): string {
  return join(app.getPath('home'), DEFAULT_OUTPUT_SUBDIR)
}

/** Build the settings file path in userData. */
function getSettingsPath(): string {
  return join(app.getPath('userData'), SETTINGS_FILE)
}

/** Ensure a directory exists, creating it if needed. */
export function ensureDir(dirPath: string): void {
  if (!existsSync(dirPath)) {
    mkdirSync(dirPath, { recursive: true })
  }
}

/** Build the filename stem for a gallery item. */
function buildFileStem(model: string, timestamp: string, hash: string): string {
  const safeName = model.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 40)
  const safeTs = timestamp.replace(/[^0-9T]/g, '').substring(0, 15)
  const shortHash = hash.substring(0, 6)
  return `${safeName}_${safeTs}_${shortHash}`
}

/** Compute a short content hash for the image data. */
function computeHash(base64Data: string): string {
  return createHash('sha256').update(base64Data.substring(0, 1024)).digest('hex')
}

/** Parse a gallery item from its file path and metadata JSON. */
export function parseGalleryItem(
  pngPath: string,
  thumbPath: string,
  metaPath: string
): GalleryItem | null {
  try {
    const metaRaw = readFileSync(metaPath, 'utf-8')
    const metadata = JSON.parse(metaRaw) as GalleryItemMetadata
    const stem = pngPath.replace(/\.png$/, '').split(/[\\/]/).pop() ?? ''
    return { id: stem, filePath: pngPath, metaPath, thumbPath, metadata }
  } catch {
    return null
  }
}

/** Scan output directory, return all valid gallery items sorted newest-first. */
export function scanOutputDir(outputDir: string): GalleryItem[] {
  if (!existsSync(outputDir)) return []

  const items: GalleryItem[] = []
  let files: string[]
  try {
    files = readdirSync(outputDir)
  } catch {
    return []
  }

  const pngFiles = files.filter(f => f.endsWith('.png') && !f.endsWith('_thumb.png'))
  for (const pngFile of pngFiles) {
    const stem = pngFile.replace(/\.png$/, '')
    const pngPath = join(outputDir, pngFile)
    const thumbPath = join(outputDir, `${stem}_thumb.png`)
    const metaPath = join(outputDir, `${stem}.json`)
    if (!existsSync(metaPath)) continue
    const item = parseGalleryItem(pngPath, thumbPath, metaPath)
    if (item) items.push(item)
  }

  // Sort newest-first by timestamp in metadata
  items.sort((a, b) => {
    const ta = a.metadata.timestamp ?? ''
    const tb = b.metadata.timestamp ?? ''
    return tb.localeCompare(ta)
  })

  return items
}

/** Load thumbnail as data URL, handle missing thumb file gracefully. */
export function loadThumbDataUrl(thumbPath: string, mainPath: string): string {
  const srcPath = existsSync(thumbPath) ? thumbPath : mainPath
  try {
    const buf = readFileSync(srcPath)
    return `data:image/png;base64,${buf.toString('base64')}`
  } catch {
    return ''
  }
}

/** Save a generated image and its metadata to the output directory. */
export function saveGalleryImage(
  outputDir: string,
  req: GallerySaveRequest
): GallerySaveResult {
  try {
    ensureDir(outputDir)
    const hash = computeHash(req.imageBase64)
    const ts = req.metadata.timestamp || new Date().toISOString()
    const stem = buildFileStem(req.metadata.model, ts, hash)

    const pngPath = join(outputDir, `${stem}.png`)
    const thumbPath = join(outputDir, `${stem}_thumb.png`)
    const metaPath = join(outputDir, `${stem}.json`)

    const imgBuf = Buffer.from(req.imageBase64, 'base64')
    writeFileSync(pngPath, imgBuf)
    writeFileSync(metaPath, JSON.stringify(req.metadata, null, 2), 'utf-8')

    // Write thumb — use same data for now (thumbnail generation without native deps)
    writeThumbnailData(thumbPath, imgBuf)

    const item = parseGalleryItem(pngPath, thumbPath, metaPath)
    if (!item) return { ok: false, error: 'Failed to parse saved item' }

    item.thumbDataUrl = loadThumbDataUrl(thumbPath, pngPath)
    return { ok: true, item }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return { ok: false, error: msg }
  }
}

/** Write thumbnail data — stores the full image as thumb since we lack native resize. */
function writeThumbnailData(thumbPath: string, imgBuf: Buffer): void {
  try {
    writeFileSync(thumbPath, imgBuf)
  } catch {
    // non-critical, thumb missing is handled gracefully
  }
}

/** Delete a gallery item (PNG, thumb, JSON). */
export function deleteGalleryItem(item: GalleryItem): boolean {
  let deleted = false
  for (const p of [item.filePath, item.thumbPath, item.metaPath]) {
    try {
      if (existsSync(p)) {
        unlinkSync(p)
        deleted = true
      }
    } catch {
      // continue
    }
  }
  return deleted
}

// ─── Settings ─────────────────────────────────────────────────────────────────

export function getOutputDir(): string {
  const settings = loadSettings(getSettingsPath())
  return (typeof settings[SETTINGS_KEY] === 'string' ? settings[SETTINGS_KEY] : defaultOutputDir()) as string
}

export function setOutputDir(dir: string): void {
  const settings = loadSettings(getSettingsPath())
  settings[SETTINGS_KEY] = dir
  saveSettings(getSettingsPath(), settings)
}

/** List all gallery items from the configured output directory. */
export function listGalleryItems(): GalleryListResult {
  try {
    const outputDir = getOutputDir()
    const items = scanOutputDir(outputDir)
    const withThumbs = items.map(item => ({
      ...item,
      thumbDataUrl: loadThumbDataUrl(item.thumbPath, item.filePath)
    }))
    return { ok: true, items: withThumbs }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return { ok: false, items: [], error: msg }
  }
}

/** Convenience: width constant exported for tests. */
export const THUMBNAIL_WIDTH = THUMB_WIDTH
