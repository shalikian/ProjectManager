/**
 * Static palette entries for built-in node types.
 * These mirror the hard-coded node types from nodeTypeRegistry.ts.
 * When the IPC registry is available this list can be augmented dynamically.
 */

export interface PaletteEntry {
  /** Node type key used when creating nodes */
  type: string
  /** Display name */
  name: string
  /** Category group (used for collapsible sections) */
  category: string
  /** Short description */
  description: string
  /** Number of input ports */
  inputCount: number
  /** Number of output ports */
  outputCount: number
}

/** Category display color map */
export const CATEGORY_COLORS: Record<string, string> = {
  Source: '#64B5F6',
  Filter: '#81C784',
  Output: '#FFB74D',
  Custom: '#CE93D8',
  Default: '#9E9E9E'
}

/** Returns the display color for a category, falling back to Default. */
export function getCategoryColor(category: string): string {
  return CATEGORY_COLORS[category] ?? CATEGORY_COLORS.Default
}

/** Built-in palette entries grouped by category. */
export const BUILT_IN_PALETTE: PaletteEntry[] = [
  {
    type: 'imageSource',
    name: 'Image Source',
    category: 'Source',
    description: 'Load an image from disk',
    inputCount: 0,
    outputCount: 1
  },
  {
    type: 'filter',
    name: 'Filter',
    category: 'Filter',
    description: 'Apply image filters and adjustments',
    inputCount: 1,
    outputCount: 1
  },
  {
    type: 'output',
    name: 'Output',
    category: 'Output',
    description: 'Export the result image',
    inputCount: 1,
    outputCount: 0
  }
]

/** Returns entries grouped by category, sorted by category name. */
export function groupByCategory(
  entries: PaletteEntry[]
): Map<string, PaletteEntry[]> {
  const map = new Map<string, PaletteEntry[]>()
  for (const entry of entries) {
    const existing = map.get(entry.category) ?? []
    existing.push(entry)
    map.set(entry.category, existing)
  }
  return map
}

/** Filters entries by a search query (name and category, case-insensitive). */
export function filterEntries(
  entries: PaletteEntry[],
  query: string
): PaletteEntry[] {
  if (!query.trim()) return entries
  const lower = query.toLowerCase()
  return entries.filter(
    e =>
      e.name.toLowerCase().includes(lower) ||
      e.category.toLowerCase().includes(lower) ||
      e.description.toLowerCase().includes(lower)
  )
}
