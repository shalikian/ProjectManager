import React, { useCallback } from 'react'
import type { PaletteEntry } from './palette-registry'
import { getCategoryColor } from './palette-registry'

/** Data payload written onto the drag transfer. */
export const DRAG_TYPE_NODE = 'application/x-node-type'

interface PaletteNodeItemProps {
  entry: PaletteEntry
  onAdd?: (entry: PaletteEntry) => void
}

function PortBadge({ count, label }: { count: number; label: string }): React.JSX.Element {
  return (
    <span
      className="text-[9px] text-gray-500 tabular-nums"
      title={`${count} ${label}`}
    >
      {label[0]}: {count}
    </span>
  )
}

/**
 * A single draggable entry in the node palette.
 * Clicking adds the node at the default staggered position.
 * Dragging and dropping onto the canvas adds the node at drop position.
 */
export default function PaletteNodeItem({
  entry,
  onAdd
}: PaletteNodeItemProps): React.JSX.Element {
  const color = getCategoryColor(entry.category)

  const handleDragStart = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.dataTransfer.effectAllowed = 'copy'
      e.dataTransfer.setData(DRAG_TYPE_NODE, entry.type)
    },
    [entry.type]
  )

  const handleClick = useCallback(() => {
    onAdd?.(entry)
  }, [entry, onAdd])

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      aria-label={`Add ${entry.name} node`}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') handleClick()
      }}
      data-testid={`palette-item-${entry.type}`}
      className="flex items-start gap-2 px-2 py-2 rounded-md
                 bg-node-bg border border-node-border
                 hover:border-node-selected hover:bg-node-header
                 cursor-grab active:cursor-grabbing
                 transition-colors select-none group"
    >
      {/* Category color indicator */}
      <span
        className="mt-0.5 w-2 h-2 rounded-full shrink-0"
        style={{ backgroundColor: color }}
        aria-hidden="true"
      />

      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-white truncate">{entry.name}</p>
        <p className="text-[10px] text-gray-500 group-hover:text-gray-400 truncate">
          {entry.description}
        </p>
        <div className="flex gap-2 mt-0.5">
          <PortBadge count={entry.inputCount} label="In" />
          <PortBadge count={entry.outputCount} label="Out" />
        </div>
      </div>
    </div>
  )
}
