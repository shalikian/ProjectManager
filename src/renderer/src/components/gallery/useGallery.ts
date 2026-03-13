/**
 * useGallery — initializes the gallery on mount, wires up IPC push events.
 */

import { useEffect, useCallback } from 'react'
import { useGalleryStore } from '../../store/gallery-store'
import type { GalleryItem } from '../../../../shared/gallery-types'

/** Load all gallery items from the output directory. */
async function fetchGalleryItems(
  setItems: (items: GalleryItem[]) => void,
  setLoading: (loading: boolean) => void,
  setError: (error: string | null) => void
): Promise<void> {
  setLoading(true)
  setError(null)
  try {
    const result = await window.electron.gallery.list()
    if (result.ok) {
      setItems(result.items)
    } else {
      setError(result.error ?? 'Failed to load gallery')
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    setError(msg)
  } finally {
    setLoading(false)
  }
}

/** Load the current output directory. */
async function fetchOutputDir(setOutputDir: (dir: string) => void): Promise<void> {
  try {
    const dir = await window.electron.gallery.getOutputDir()
    setOutputDir(dir)
  } catch {
    // non-critical
  }
}

/** useGallery initializes gallery state and subscribes to push events. */
export function useGallery(): void {
  const { setItems, prependItem, setLoading, setError, setOutputDir } = useGalleryStore()

  const handleItemSaved = useCallback(
    (item: GalleryItem) => {
      prependItem(item)
    },
    [prependItem]
  )

  useEffect(() => {
    fetchGalleryItems(setItems, setLoading, setError)
    fetchOutputDir(setOutputDir)

    const unsubscribe = window.electron.gallery.onItemSaved(handleItemSaved)
    return unsubscribe
  }, [setItems, setLoading, setError, setOutputDir, handleItemSaved])
}

/** useGalleryActions — returns action callbacks for gallery UI. */
export function useGalleryActions() {
  const { removeItem, setOutputDir } = useGalleryStore()

  const openFolder = useCallback(async (filePath: string): Promise<void> => {
    await window.electron.gallery.openFolder(filePath)
  }, [])

  const copyToClipboard = useCallback(async (dataUrl: string): Promise<void> => {
    await window.electron.gallery.copyToClipboard(dataUrl)
  }, [])

  const deleteItem = useCallback(
    async (item: GalleryItem): Promise<void> => {
      const result = await window.electron.gallery.delete(item)
      if (result.ok) removeItem(item.id)
    },
    [removeItem]
  )

  const changeOutputDir = useCallback(
    async (dir?: string): Promise<void> => {
      const result = await window.electron.gallery.setOutputDir(dir)
      if (result.ok && result.dir) setOutputDir(result.dir)
    },
    [setOutputDir]
  )

  return { openFolder, copyToClipboard, deleteItem, changeOutputDir }
}
