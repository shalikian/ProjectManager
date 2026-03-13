import React, { useState, useCallback } from 'react'
import type { PaletteEntry } from './palette-registry'
import { getCategoryColor } from './palette-registry'
import PaletteNodeItem from './PaletteNodeItem'

interface PaletteCategoryProps {
  category: string
  entries: PaletteEntry[]
  onAdd: (entry: PaletteEntry) => void
  /** Whether the section starts expanded. Default true. */
  defaultOpen?: boolean
}

/**
 * A collapsible section in the node palette containing items of one category.
 */
export default function PaletteCategory({
  category,
  entries,
  onAdd,
  defaultOpen = true
}: PaletteCategoryProps): React.JSX.Element {
  const [open, setOpen] = useState(defaultOpen)
  const color = getCategoryColor(category)

  const toggle = useCallback(() => setOpen(v => !v), [])

  return (
    <div className="mb-1">
      <button
        onClick={toggle}
        aria-expanded={open}
        data-testid={`palette-category-${category}`}
        className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded
                   hover:bg-node-header transition-colors text-left"
      >
        <span
          className="w-1.5 h-1.5 rounded-full shrink-0"
          style={{ backgroundColor: color }}
          aria-hidden="true"
        />
        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider flex-1">
          {category}
        </span>
        <span className="text-[10px] text-gray-600 tabular-nums">{entries.length}</span>
        <span className="text-[10px] text-gray-600 ml-0.5">{open ? '▾' : '▸'}</span>
      </button>

      {open && (
        <div className="flex flex-col gap-1 px-1 pb-1">
          {entries.map(entry => (
            <PaletteNodeItem key={entry.type} entry={entry} onAdd={onAdd} />
          ))}
        </div>
      )}
    </div>
  )
}
