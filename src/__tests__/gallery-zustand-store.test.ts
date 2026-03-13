/**
 * Tests for the renderer-side gallery Zustand store.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { useGalleryStore } from '../renderer/src/store/gallery-store'
import type { GalleryItem } from '../shared/gallery-types'

function makeItem(id: string, timestamp = '2026-01-01T00:00:00Z'): GalleryItem {
  return {
    id,
    filePath: `/output/${id}.png`,
    thumbPath: `/output/${id}_thumb.png`,
    metaPath: `/output/${id}.json`,
    metadata: {
      prompt: `Prompt for ${id}`,
      model: 'test-model',
      params: {},
      timestamp
    }
  }
}

describe('useGalleryStore', () => {
  beforeEach(() => {
    useGalleryStore.setState({
      items: [],
      galleryOpen: false,
      previewItem: null,
      outputDir: '',
      loading: false,
      error: null
    })
  })

  // Happy path: initial state is clean
  it('initializes with correct default state', () => {
    const state = useGalleryStore.getState()
    expect(state.items).toEqual([])
    expect(state.galleryOpen).toBe(false)
    expect(state.previewItem).toBeNull()
    expect(state.outputDir).toBe('')
    expect(state.loading).toBe(false)
    expect(state.error).toBeNull()
  })

  // Happy path: setItems replaces the list
  it('setItems replaces the items array', () => {
    const { setItems } = useGalleryStore.getState()
    const items = [makeItem('a'), makeItem('b')]
    setItems(items)
    expect(useGalleryStore.getState().items).toHaveLength(2)
    expect(useGalleryStore.getState().items[0].id).toBe('a')
  })

  // Happy path: prependItem adds to front, deduplicates
  it('prependItem adds a new item to the front', () => {
    const { setItems, prependItem } = useGalleryStore.getState()
    setItems([makeItem('a'), makeItem('b')])
    prependItem(makeItem('c'))
    const items = useGalleryStore.getState().items
    expect(items[0].id).toBe('c')
    expect(items).toHaveLength(3)
  })

  it('prependItem deduplicates by id', () => {
    const { setItems, prependItem } = useGalleryStore.getState()
    setItems([makeItem('a'), makeItem('b')])
    prependItem(makeItem('a')) // same id, move to front
    const items = useGalleryStore.getState().items
    expect(items).toHaveLength(2)
    expect(items[0].id).toBe('a')
  })

  // Edge case: removeItem removes by id
  it('removeItem removes the item with matching id', () => {
    const { setItems, removeItem } = useGalleryStore.getState()
    setItems([makeItem('x'), makeItem('y'), makeItem('z')])
    removeItem('y')
    const items = useGalleryStore.getState().items
    expect(items).toHaveLength(2)
    expect(items.find(i => i.id === 'y')).toBeUndefined()
  })

  it('removeItem does not throw if id does not exist', () => {
    const { setItems, removeItem } = useGalleryStore.getState()
    setItems([makeItem('a')])
    expect(() => removeItem('nonexistent')).not.toThrow()
    expect(useGalleryStore.getState().items).toHaveLength(1)
  })

  // Edge case: toggleGallery flips open state
  it('toggleGallery opens and closes the gallery', () => {
    const { toggleGallery } = useGalleryStore.getState()
    expect(useGalleryStore.getState().galleryOpen).toBe(false)
    toggleGallery()
    expect(useGalleryStore.getState().galleryOpen).toBe(true)
    toggleGallery()
    expect(useGalleryStore.getState().galleryOpen).toBe(false)
  })

  // Edge case: setGalleryOpen sets explicitly
  it('setGalleryOpen sets gallery visibility explicitly', () => {
    const { setGalleryOpen } = useGalleryStore.getState()
    setGalleryOpen(true)
    expect(useGalleryStore.getState().galleryOpen).toBe(true)
    setGalleryOpen(false)
    expect(useGalleryStore.getState().galleryOpen).toBe(false)
  })

  // Happy path: preview open/close
  it('openPreview sets previewItem and closePreview clears it', () => {
    const { openPreview, closePreview } = useGalleryStore.getState()
    const item = makeItem('preview-test')
    openPreview(item)
    expect(useGalleryStore.getState().previewItem).toEqual(item)
    closePreview()
    expect(useGalleryStore.getState().previewItem).toBeNull()
  })

  // Edge case: setOutputDir updates the directory
  it('setOutputDir updates the outputDir string', () => {
    const { setOutputDir } = useGalleryStore.getState()
    setOutputDir('/custom/output/path')
    expect(useGalleryStore.getState().outputDir).toBe('/custom/output/path')
  })

  // Edge case: setError and setLoading
  it('setError and setLoading update their respective fields', () => {
    const { setError, setLoading } = useGalleryStore.getState()
    setLoading(true)
    expect(useGalleryStore.getState().loading).toBe(true)
    setError('Something failed')
    expect(useGalleryStore.getState().error).toBe('Something failed')
    setError(null)
    expect(useGalleryStore.getState().error).toBeNull()
  })
})
