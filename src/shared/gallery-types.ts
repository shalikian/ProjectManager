/**
 * Shared types for the gallery / auto-save feature.
 * Used across main process, preload, and renderer.
 */

/** Full metadata stored alongside each generated image. */
export interface GalleryItemMetadata {
  prompt: string
  model: string
  /** Generation parameters (e.g. width, height, steps). */
  params: Record<string, unknown>
  timestamp: string
  /** Estimated cost in USD, if known. */
  cost?: number
  /** Workflow run id that produced this image. */
  runId?: string
  /** The node id that produced this image. */
  nodeId?: string
}

/** A single entry in the gallery (loaded from disk). */
export interface GalleryItem {
  /** Unique id derived from the file name (without extension). */
  id: string
  /** Absolute path to the full-resolution PNG. */
  filePath: string
  /** Absolute path to the companion metadata JSON. */
  metaPath: string
  /** Absolute path to the 200px-wide thumbnail PNG. */
  thumbPath: string
  /** data: URI of the thumbnail (loaded on demand). */
  thumbDataUrl?: string
  metadata: GalleryItemMetadata
}

/** Request payload for saving a newly generated image. */
export interface GallerySaveRequest {
  /** Base64-encoded PNG image data (without the data: prefix). */
  imageBase64: string
  metadata: GalleryItemMetadata
}

/** Response from gallery:save-image. */
export interface GallerySaveResult {
  ok: boolean
  item?: GalleryItem
  error?: string
}

/** Response from gallery:list. */
export interface GalleryListResult {
  ok: boolean
  items: GalleryItem[]
  error?: string
}
