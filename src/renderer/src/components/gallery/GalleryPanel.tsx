/**
 * GalleryPanel — bottom panel displaying thumbnail grid of generated images.
 * Uses a CSS grid (no react-virtuoso dep) with lazy rendering for performance.
 */

import React, { useCallback } from 'react'
import { useGalleryStore } from '../../store/gallery-store'
import { useGallery, useGalleryActions } from './useGallery'
import GalleryItemCard from './GalleryItem'
import GalleryPreview from './GalleryPreview'
import type { GalleryItem } from '../../../../shared/gallery-types'

const PANEL_HEIGHT = 260

function GalleryHeader(): React.JSX.Element {
  const { items, outputDir, toggleGallery } = useGalleryStore()
  const { changeOutputDir } = useGalleryActions()

  const handleChangeDir = useCallback(async () => {
    await changeOutputDir()
  }, [changeOutputDir])

  return (
    <div className="flex items-center justify-between px-3 py-1.5 border-b border-canvas-border
                    bg-canvas-surface flex-shrink-0">
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-white">Gallery</span>
        <span className="text-xs text-gray-500">({items.length} images)</span>
        {outputDir && (
          <span
            className="text-xs text-gray-600 truncate max-w-xs"
            title={outputDir}
          >
            {outputDir}
          </span>
        )}
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={handleChangeDir}
          className="px-2 py-0.5 text-xs text-gray-400 hover:text-white
                     border border-canvas-border rounded transition-colors"
          title="Change output directory"
        >
          Change Dir
        </button>
        <button
          onClick={toggleGallery}
          className="text-gray-400 hover:text-white transition-colors text-lg leading-none px-1"
          aria-label="Close gallery"
        >
          &times;
        </button>
      </div>
    </div>
  )
}

function EmptyState(): React.JSX.Element {
  return (
    <div className="flex-1 flex items-center justify-center text-gray-600 text-xs">
      No generated images yet. Run a workflow to see results here.
    </div>
  )
}

function LoadingState(): React.JSX.Element {
  return (
    <div className="flex-1 flex items-center justify-center text-gray-500 text-xs">
      Loading gallery...
    </div>
  )
}

function ErrorState({ error }: { error: string }): React.JSX.Element {
  return (
    <div className="flex-1 flex items-center justify-center text-red-400 text-xs px-4 text-center">
      {error}
    </div>
  )
}

function GalleryGrid({ items }: { items: GalleryItem[] }): React.JSX.Element {
  const { openPreview } = useGalleryStore()

  const handleClick = useCallback(
    (item: GalleryItem) => openPreview(item),
    [openPreview]
  )

  return (
    <div
      className="flex-1 overflow-x-auto overflow-y-hidden"
      role="list"
      aria-label="Gallery images"
    >
      <div className="flex gap-2 p-2 h-full items-start">
        {items.map(item => (
          <div
            key={item.id}
            role="listitem"
            className="flex-shrink-0 w-32"
          >
            <GalleryItemCard item={item} onClick={handleClick} />
          </div>
        ))}
      </div>
    </div>
  )
}

/** GalleryPanelInner — renders gallery content; placed inside GalleryPanel wrapper. */
function GalleryPanelInner(): React.JSX.Element {
  const { items, loading, error } = useGalleryStore()

  return (
    <>
      <GalleryHeader />
      {loading && <LoadingState />}
      {!loading && error && <ErrorState error={error} />}
      {!loading && !error && items.length === 0 && <EmptyState />}
      {!loading && !error && items.length > 0 && <GalleryGrid items={items} />}
    </>
  )
}

/**
 * GalleryPanel — initializes gallery data and renders the toggleable bottom panel.
 * Must be mounted once in the app tree (even when hidden) to receive push events.
 */
export default function GalleryPanel(): React.JSX.Element {
  useGallery()
  const { galleryOpen } = useGalleryStore()

  return (
    <>
      {galleryOpen && (
        <div
          data-testid="gallery-panel"
          className="flex flex-col border-t border-canvas-border bg-canvas-surface"
          style={{ height: PANEL_HEIGHT }}
        >
          <GalleryPanelInner />
        </div>
      )}
      <GalleryPreview />
    </>
  )
}
