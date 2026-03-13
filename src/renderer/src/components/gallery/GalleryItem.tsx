/**
 * GalleryItem — single thumbnail card in the gallery panel.
 */

import React from 'react'
import type { GalleryItem as GalleryItemType } from '../../../../shared/gallery-types'

interface Props {
  item: GalleryItemType
  onClick: (item: GalleryItemType) => void
}

function formatTimestamp(ts: string): string {
  try {
    return new Date(ts).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return ts
  }
}

function truncate(text: string, maxLen: number): string {
  return text.length > maxLen ? `${text.substring(0, maxLen)}…` : text
}

export default function GalleryItemCard({ item, onClick }: Props): React.JSX.Element {
  const prompt = item.metadata?.prompt ?? ''
  const model = item.metadata?.model ?? 'Unknown'
  const timestamp = item.metadata?.timestamp ?? ''

  return (
    <button
      className="flex flex-col w-full text-left p-2 rounded hover:bg-node-header
                 transition-colors border border-transparent hover:border-canvas-border
                 focus:outline-none focus:ring-1 focus:ring-node-selected"
      onClick={() => onClick(item)}
      title={prompt}
      aria-label={`View image: ${truncate(prompt, 40)}`}
    >
      <div className="w-full aspect-square bg-canvas-bg rounded overflow-hidden mb-1.5 flex items-center justify-center">
        {item.thumbDataUrl ? (
          <img
            src={item.thumbDataUrl}
            alt={truncate(prompt, 40)}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <span className="text-gray-600 text-xs">No preview</span>
        )}
      </div>
      <p className="text-xs text-gray-300 leading-tight truncate w-full">
        {truncate(prompt, 50) || '(no prompt)'}
      </p>
      <p className="text-xs text-gray-500 truncate w-full mt-0.5">
        {truncate(model, 30)}
      </p>
      {timestamp && (
        <p className="text-xs text-gray-600 mt-0.5">
          {formatTimestamp(timestamp)}
        </p>
      )}
    </button>
  )
}
