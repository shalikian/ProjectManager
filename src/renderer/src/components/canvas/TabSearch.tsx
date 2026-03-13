import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import {
  BUILT_IN_PALETTE,
  filterEntries,
  getCategoryColor,
  type PaletteEntry
} from '../palette/palette-registry'

interface TabSearchProps {
  /** Canvas-space coordinates where the new node will be placed. */
  canvasX: number
  canvasY: number
  onAddNode: (entry: PaletteEntry, canvasX: number, canvasY: number) => void
  onClose: () => void
}

interface SearchItemProps {
  entry: PaletteEntry
  isHighlighted: boolean
  onSelect: (entry: PaletteEntry) => void
}

function SearchItem({
  entry,
  isHighlighted,
  onSelect
}: SearchItemProps): React.JSX.Element {
  const color = getCategoryColor(entry.category)

  return (
    <button
      onClick={() => onSelect(entry)}
      data-testid={`tab-search-item-${entry.type}`}
      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors
                  ${isHighlighted ? 'bg-blue-600/20 border-l-2 border-blue-400' : 'border-l-2 border-transparent hover:bg-node-header'}`}
    >
      <span
        className="w-2 h-2 rounded-full shrink-0"
        style={{ backgroundColor: color }}
        aria-hidden="true"
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white truncate">{entry.name}</p>
        <p className="text-[10px] text-gray-500 truncate">{entry.description}</p>
      </div>
      <span className="text-[10px] text-gray-500 shrink-0">{entry.category}</span>
    </button>
  )
}

/**
 * VS Code-style command palette overlay opened with TAB.
 * Fuzzy-searches all available node types; Enter adds the selected node.
 */
export default function TabSearch({
  canvasX,
  canvasY,
  onAddNode,
  onClose
}: TabSearchProps): React.JSX.Element {
  const [query, setQuery] = useState('')
  const [highlightIndex, setHighlightIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const filtered = useMemo(
    () => filterEntries(BUILT_IN_PALETTE, query),
    [query]
  )

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    setHighlightIndex(0)
  }, [query])

  const handleSelect = useCallback(
    (entry: PaletteEntry) => {
      onAddNode(entry, canvasX, canvasY)
      onClose()
    },
    [onAddNode, onClose, canvasX, canvasY]
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Tab') {
        e.preventDefault()
        onClose()
        return
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setHighlightIndex(i => Math.min(i + 1, filtered.length - 1))
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setHighlightIndex(i => Math.max(i - 1, 0))
        return
      }
      if (e.key === 'Enter' && filtered[highlightIndex]) {
        e.preventDefault()
        handleSelect(filtered[highlightIndex])
      }
    },
    [filtered, highlightIndex, handleSelect, onClose]
  )

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-24
                 bg-black/40 backdrop-blur-sm"
      onPointerDown={onClose}
      data-testid="tab-search-backdrop"
    >
      {/* Panel — stop propagation so clicking inside doesn't close */}
      <div
        className="w-[520px] max-w-[90vw] bg-canvas-surface border border-canvas-border
                   rounded-xl shadow-2xl overflow-hidden"
        onPointerDown={e => e.stopPropagation()}
        data-testid="tab-search-panel"
        onKeyDown={handleKeyDown}
      >
        {/* Search input */}
        <div className="px-4 py-3 border-b border-canvas-border flex items-center gap-2">
          <span className="text-gray-500 text-sm" aria-hidden="true">
            &#x2315;
          </span>
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search nodes to add..."
            aria-label="Quick search for nodes"
            data-testid="tab-search-input"
            className="flex-1 bg-transparent text-sm text-white placeholder-gray-600
                       focus:outline-none"
          />
          <kbd
            className="text-[10px] text-gray-600 border border-node-border rounded px-1"
          >
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto">
          {filtered.length === 0 ? (
            <p
              className="text-xs text-gray-500 text-center py-6"
              data-testid="tab-search-empty"
            >
              No nodes match &ldquo;{query}&rdquo;
            </p>
          ) : (
            filtered.map((entry, i) => (
              <SearchItem
                key={entry.type}
                entry={entry}
                isHighlighted={i === highlightIndex}
                onSelect={handleSelect}
              />
            ))
          )}
        </div>

        {/* Footer hint */}
        <div className="px-4 py-2 border-t border-canvas-border flex gap-3">
          <span className="text-[10px] text-gray-600">
            <kbd className="border border-node-border rounded px-0.5">↑↓</kbd> navigate
          </span>
          <span className="text-[10px] text-gray-600">
            <kbd className="border border-node-border rounded px-0.5">↵</kbd> add
          </span>
          <span className="text-[10px] text-gray-600">
            <kbd className="border border-node-border rounded px-0.5">ESC</kbd> close
          </span>
        </div>
      </div>
    </div>
  )
}
