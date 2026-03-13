import React, { useState, useCallback, useMemo } from 'react'
import { useFlowStore } from '../store/flow-store'
import type { NodeType } from '../../../shared/types'
import {
  BUILT_IN_PALETTE,
  filterEntries,
  groupByCategory,
  type PaletteEntry
} from './palette/palette-registry'
import PaletteCategory from './palette/PaletteCategory'

function SearchInput({
  value,
  onChange
}: {
  value: string
  onChange: (v: string) => void
}): React.JSX.Element {
  return (
    <div className="relative px-2 pb-2">
      <input
        type="search"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="Search nodes..."
        aria-label="Search nodes"
        data-testid="palette-search"
        className="w-full bg-canvas-bg border border-node-border rounded px-2 py-1
                   text-xs text-white placeholder-gray-600
                   focus:outline-none focus:border-node-selected"
      />
    </div>
  )
}

function EmptyState(): React.JSX.Element {
  return (
    <p
      className="text-xs text-gray-500 text-center py-4 px-2"
      data-testid="palette-empty"
    >
      No nodes match your search.
    </p>
  )
}

/**
 * Left sidebar node palette.
 * Displays built-in nodes grouped by category with search filtering.
 * Items can be clicked to add at default position, or dragged onto canvas.
 */
export default function NodePalette(): React.JSX.Element {
  const { addNode } = useFlowStore()
  const [query, setQuery] = useState('')

  const filtered = useMemo(
    () => filterEntries(BUILT_IN_PALETTE, query),
    [query]
  )

  const grouped = useMemo(() => groupByCategory(filtered), [filtered])

  const handleAdd = useCallback(
    (entry: PaletteEntry) => {
      addNode(entry.type as NodeType)
    },
    [addNode]
  )

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-3 py-2 border-b border-canvas-border shrink-0">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
          Node Palette
        </h2>
        <SearchInput value={query} onChange={setQuery} />
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {grouped.size === 0 ? (
          <EmptyState />
        ) : (
          Array.from(grouped.entries()).map(([category, entries]) => (
            <PaletteCategory
              key={category}
              category={category}
              entries={entries}
              onAdd={handleAdd}
            />
          ))
        )}
      </div>
    </div>
  )
}
