/**
 * Gallery Zustand store.
 * Manages the list of gallery items, preview overlay state, and output directory.
 */

import { create } from 'zustand'
import type { GalleryItem } from '../../../shared/gallery-types'

interface GalleryState {
  /** All gallery items, newest-first. */
  items: GalleryItem[]
  /** Whether the gallery panel is visible. */
  galleryOpen: boolean
  /** The item currently shown in the full-resolution preview overlay. */
  previewItem: GalleryItem | null
  /** Current output directory path. */
  outputDir: string
  /** Whether gallery items are being loaded. */
  loading: boolean
  /** Error message from last operation, if any. */
  error: string | null

  // ─── Actions ────────────────────────────────────────────────────────────────
  setItems: (items: GalleryItem[]) => void
  prependItem: (item: GalleryItem) => void
  removeItem: (id: string) => void
  toggleGallery: () => void
  setGalleryOpen: (open: boolean) => void
  openPreview: (item: GalleryItem) => void
  closePreview: () => void
  setOutputDir: (dir: string) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

export const useGalleryStore = create<GalleryState>(set => ({
  items: [],
  galleryOpen: false,
  previewItem: null,
  outputDir: '',
  loading: false,
  error: null,

  setItems: (items) => set({ items }),
  prependItem: (item) =>
    set(state => ({ items: [item, ...state.items.filter(i => i.id !== item.id)] })),
  removeItem: (id) =>
    set(state => ({ items: state.items.filter(i => i.id !== id) })),

  toggleGallery: () => set(state => ({ galleryOpen: !state.galleryOpen })),
  setGalleryOpen: (open) => set({ galleryOpen: open }),

  openPreview: (item) => set({ previewItem: item }),
  closePreview: () => set({ previewItem: null }),

  setOutputDir: (dir) => set({ outputDir: dir }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error })
}))
