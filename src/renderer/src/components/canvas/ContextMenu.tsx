import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import {
  BUILT_IN_PALETTE,
  filterEntries,
  getCategoryColor,
  type PaletteEntry
} from '../palette/palette-registry'

export interface ContextMenuPosition {
  screenX: number
  screenY: number
  canvasX: number
  canvasY: number
}

interface ContextMenuProps {
  position: ContextMenuPosition
  onAddNode: (entry: PaletteEntry, canvasX: number, canvasY: number) => void
  onClose: () => void
}

interface MenuItemProps {
  entry: PaletteEntry
  isHighlighted: boolean
  onSelect: (entry: PaletteEntry) => void
}

function MenuItem({
  entry,
  isHighlighted,
  onSelect
}: MenuItemProps): React.JSX.Element {
  const color = getCategoryColor(entry.category)

  return (
    <button
      onClick={() => onSelect(entry)}
      data-testid={`context-menu-item-${entry.type}`}
      className={`w-full flex items-center gap-2 px-3 py-1.5 text-left
                  transition-colors
                  ${isHighlighted ? 'bg-node-header text-white' : 'text-gray-300 hover:bg-node-header hover:text-white'}`}
    >
      <span
        className="w-1.5 h-1.5 rounded-full shrink-0"
        style={{ backgroundColor: color }}
        aria-hidden="true"
      />
      <span className="text-xs flex-1 truncate">{entry.name}</span>
      <span className="text-[10px] text-gray-500 shrink-0">{entry.category}</span>
    </button>
  )
}

/**
 * Canvas right-click context menu for adding nodes.
 * Closes on click-outside or Escape key.
 */
export default function ContextMenu({
  position,
  onAddNode,
  onClose
}: ContextMenuProps): React.JSX.Element {
  const [query, setQuery] = useState('')
  const [highlightIndex, setHighlightIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const filtered = useMemo(
    () => filterEntries(BUILT_IN_PALETTE, query),
    [query]
  )

  // Auto-focus search input on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Reset highlight when filter changes
  useEffect(() => {
    setHighlightIndex(0)
  }, [query])

  const handleSelect = useCallback(
    (entry: PaletteEntry) => {
      onAddNode(entry, position.canvasX, position.canvasY)
      onClose()
    },
    [onAddNode, onClose, position.canvasX, position.canvasY]
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
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

  // Close on click outside
  useEffect(() => {
    function handlePointerDown(e: MouseEvent): void {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [onClose])

  return (
    <div
      ref={menuRef}
      data-testid="context-menu"
      style={{ left: position.screenX, top: position.screenY }}
      className="fixed z-50 w-56 bg-canvas-surface border border-canvas-border
                 rounded-lg shadow-xl overflow-hidden"
      onKeyDown={handleKeyDown}
    >
      <div className="px-2 py-1.5 border-b border-canvas-border">
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search nodes..."
          aria-label="Search nodes in context menu"
          data-testid="context-menu-search"
          className="w-full bg-canvas-bg border border-node-border rounded px-2 py-1
                     text-xs text-white placeholder-gray-600
                     focus:outline-none focus:border-node-selected"
        />
      </div>

      <div className="max-h-48 overflow-y-auto py-1">
        {filtered.length === 0 ? (
          <p
            className="text-xs text-gray-500 text-center py-3"
            data-testid="context-menu-empty"
          >
            No nodes found
          </p>
        ) : (
          filtered.map((entry, i) => (
            <MenuItem
              key={entry.type}
              entry={entry}
              isHighlighted={i === highlightIndex}
              onSelect={handleSelect}
            />
          ))
        )}
      </div>
    </div>
  )
}
