/**
 * GalleryPreview — full-resolution image preview overlay with metadata.
 */

import React, { useEffect, useCallback } from 'react'
import { useGalleryStore } from '../../store/gallery-store'
import { useGalleryActions } from './useGallery'
import type { GalleryItem } from '../../../../shared/gallery-types'

function MetaRow({ label, value }: { label: string; value: string }): React.JSX.Element {
  return (
    <div className="flex gap-2">
      <span className="text-gray-500 shrink-0 w-20 text-right">{label}:</span>
      <span className="text-gray-300 break-all">{value}</span>
    </div>
  )
}

function ParamsSection({ params }: { params: Record<string, unknown> }): React.JSX.Element | null {
  const entries = Object.entries(params)
  if (entries.length === 0) return null
  return (
    <div className="mt-2">
      <p className="text-gray-500 text-xs mb-1">Parameters</p>
      <div className="flex flex-col gap-0.5">
        {entries.map(([k, v]) => (
          <MetaRow key={k} label={k} value={String(v)} />
        ))}
      </div>
    </div>
  )
}

function ActionButtons({
  item,
  onClose
}: {
  item: GalleryItem
  onClose: () => void
}): React.JSX.Element {
  const { openFolder, copyToClipboard, deleteItem } = useGalleryActions()
  const thumbDataUrl = item.thumbDataUrl ?? ''

  const handleOpenFolder = useCallback(async () => {
    await openFolder(item.filePath)
  }, [openFolder, item.filePath])

  const handleCopy = useCallback(async () => {
    if (thumbDataUrl) await copyToClipboard(thumbDataUrl)
  }, [copyToClipboard, thumbDataUrl])

  const handleDelete = useCallback(async () => {
    await deleteItem(item)
    onClose()
  }, [deleteItem, item, onClose])

  return (
    <div className="flex gap-2 mt-3 flex-wrap">
      <button
        onClick={handleOpenFolder}
        className="px-3 py-1.5 text-xs bg-node-header hover:bg-node-selected hover:text-canvas-bg
                   border border-node-border rounded transition-colors"
      >
        Open in Folder
      </button>
      <button
        onClick={handleCopy}
        className="px-3 py-1.5 text-xs bg-node-header hover:bg-node-selected hover:text-canvas-bg
                   border border-node-border rounded transition-colors"
        disabled={!thumbDataUrl}
      >
        Copy to Clipboard
      </button>
      <button
        onClick={handleDelete}
        className="px-3 py-1.5 text-xs bg-red-900/40 hover:bg-red-800
                   border border-red-700 text-red-300 rounded transition-colors"
      >
        Delete
      </button>
    </div>
  )
}

export default function GalleryPreview(): React.JSX.Element | null {
  const { previewItem, closePreview } = useGalleryStore()

  useEffect(() => {
    if (!previewItem) return
    const handler = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') closePreview()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [previewItem, closePreview])

  if (!previewItem) return null

  const meta = previewItem.metadata
  const ts = meta.timestamp
    ? new Date(meta.timestamp).toLocaleString()
    : ''

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.8)' }}
      onClick={e => { if (e.target === e.currentTarget) closePreview() }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Image preview"
        className="bg-canvas-surface border border-canvas-border rounded-xl shadow-2xl
                   max-w-5xl w-full mx-4 max-h-[90vh] flex flex-col overflow-hidden"
      >
        <PreviewHeader onClose={closePreview} />
        <div className="flex flex-1 overflow-hidden">
          <ImageSection item={previewItem} />
          <MetadataSection item={previewItem} ts={ts} />
        </div>
        <div className="px-4 pb-4">
          <ActionButtons item={previewItem} onClose={closePreview} />
        </div>
      </div>
    </div>
  )
}

function PreviewHeader({ onClose }: { onClose: () => void }): React.JSX.Element {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-canvas-border flex-shrink-0">
      <h2 className="text-base font-semibold text-white">Image Preview</h2>
      <button
        onClick={onClose}
        aria-label="Close preview"
        className="text-gray-400 hover:text-white transition-colors text-lg leading-none"
      >
        &times;
      </button>
    </div>
  )
}

function ImageSection({ item }: { item: GalleryItem }): React.JSX.Element {
  return (
    <div className="flex-1 flex items-center justify-center p-4 overflow-hidden bg-canvas-bg">
      {item.thumbDataUrl ? (
        <img
          src={item.thumbDataUrl}
          alt={item.metadata?.prompt ?? 'Generated image'}
          className="max-w-full max-h-full object-contain rounded"
        />
      ) : (
        <div className="text-gray-600 text-sm">Image not available</div>
      )}
    </div>
  )
}

function MetadataSection({
  item,
  ts
}: {
  item: GalleryItem
  ts: string
}): React.JSX.Element {
  const meta = item.metadata
  return (
    <div className="w-64 flex-shrink-0 border-l border-canvas-border p-4 overflow-y-auto text-xs">
      <p className="text-gray-400 font-semibold mb-2">Metadata</p>
      <div className="flex flex-col gap-1">
        {meta.prompt && <MetaRow label="Prompt" value={meta.prompt} />}
        {meta.model && <MetaRow label="Model" value={meta.model} />}
        {ts && <MetaRow label="Date" value={ts} />}
        {typeof meta.cost === 'number' && (
          <MetaRow label="Cost" value={`$${meta.cost.toFixed(4)}`} />
        )}
        {meta.params && <ParamsSection params={meta.params} />}
      </div>
    </div>
  )
}
