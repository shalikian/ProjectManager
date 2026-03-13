/**
 * Tests for the palette registry utilities:
 * - BUILT_IN_PALETTE data integrity
 * - filterEntries search behavior
 * - groupByCategory grouping
 * - getCategoryColor fallback
 */
import { describe, it, expect } from 'vitest'
import {
  BUILT_IN_PALETTE,
  filterEntries,
  groupByCategory,
  getCategoryColor,
  CATEGORY_COLORS,
  type PaletteEntry
} from '../renderer/src/components/palette/palette-registry'

// ─── BUILT_IN_PALETTE ─────────────────────────────────────────────────────────

describe('BUILT_IN_PALETTE', () => {
  // Happy path: palette has expected entries
  it('contains at least three built-in entries', () => {
    expect(BUILT_IN_PALETTE.length).toBeGreaterThanOrEqual(3)
  })

  it('each entry has required string fields', () => {
    for (const entry of BUILT_IN_PALETTE) {
      expect(typeof entry.type).toBe('string')
      expect(entry.type.length).toBeGreaterThan(0)
      expect(typeof entry.name).toBe('string')
      expect(entry.name.length).toBeGreaterThan(0)
      expect(typeof entry.category).toBe('string')
      expect(entry.category.length).toBeGreaterThan(0)
    }
  })

  it('each entry has non-negative port counts', () => {
    for (const entry of BUILT_IN_PALETTE) {
      expect(entry.inputCount).toBeGreaterThanOrEqual(0)
      expect(entry.outputCount).toBeGreaterThanOrEqual(0)
    }
  })

  it('includes imageSource, filter, and output types', () => {
    const types = BUILT_IN_PALETTE.map(e => e.type)
    expect(types).toContain('imageSource')
    expect(types).toContain('filter')
    expect(types).toContain('output')
  })
})

// ─── filterEntries ─────────────────────────────────────────────────────────────

describe('filterEntries', () => {
  // Happy path: empty query returns all entries
  it('returns all entries for empty query', () => {
    const result = filterEntries(BUILT_IN_PALETTE, '')
    expect(result).toHaveLength(BUILT_IN_PALETTE.length)
  })

  it('returns all entries for whitespace-only query', () => {
    const result = filterEntries(BUILT_IN_PALETTE, '   ')
    expect(result).toHaveLength(BUILT_IN_PALETTE.length)
  })

  // Matching
  it('filters by partial name (case-insensitive)', () => {
    const result = filterEntries(BUILT_IN_PALETTE, 'image')
    expect(result.length).toBeGreaterThanOrEqual(1)
    expect(result.some(e => e.type === 'imageSource')).toBe(true)
  })

  it('filters by category name', () => {
    const result = filterEntries(BUILT_IN_PALETTE, 'source')
    expect(result.some(e => e.category === 'Source')).toBe(true)
  })

  it('filters by description text', () => {
    const result = filterEntries(BUILT_IN_PALETTE, 'export')
    expect(result.some(e => e.type === 'output')).toBe(true)
  })

  // Edge case 1: no match returns empty array
  it('returns empty array for non-matching query', () => {
    const result = filterEntries(BUILT_IN_PALETTE, 'xyznonexistent123')
    expect(result).toHaveLength(0)
  })

  // Edge case 2: works on custom entry array
  it('filters a custom array correctly', () => {
    const entries: PaletteEntry[] = [
      {
        type: 'a',
        name: 'Alpha Node',
        category: 'Test',
        description: 'alpha desc',
        inputCount: 0,
        outputCount: 1
      },
      {
        type: 'b',
        name: 'Beta Node',
        category: 'Test',
        description: 'beta desc',
        inputCount: 1,
        outputCount: 0
      }
    ]
    expect(filterEntries(entries, 'alpha')).toHaveLength(1)
    expect(filterEntries(entries, 'alpha')[0].type).toBe('a')
    expect(filterEntries(entries, 'Node')).toHaveLength(2)
  })

  // Edge case 3: empty input array returns empty array
  it('returns empty array when entries list is empty', () => {
    expect(filterEntries([], 'filter')).toHaveLength(0)
  })
})

// ─── groupByCategory ─────────────────────────────────────────────────────────

describe('groupByCategory', () => {
  // Happy path
  it('groups entries by their category', () => {
    const entries: PaletteEntry[] = [
      { type: 'a', name: 'A', category: 'Cat1', description: '', inputCount: 0, outputCount: 0 },
      { type: 'b', name: 'B', category: 'Cat2', description: '', inputCount: 0, outputCount: 0 },
      { type: 'c', name: 'C', category: 'Cat1', description: '', inputCount: 0, outputCount: 0 }
    ]
    const groups = groupByCategory(entries)
    expect(groups.get('Cat1')).toHaveLength(2)
    expect(groups.get('Cat2')).toHaveLength(1)
  })

  it('returns correct number of categories', () => {
    const groups = groupByCategory(BUILT_IN_PALETTE)
    const uniqueCategories = new Set(BUILT_IN_PALETTE.map(e => e.category))
    expect(groups.size).toBe(uniqueCategories.size)
  })

  // Edge case 1: empty array gives empty map
  it('returns empty map for empty array', () => {
    const groups = groupByCategory([])
    expect(groups.size).toBe(0)
  })

  // Edge case 2: all same category gives single group
  it('single category produces one group with all entries', () => {
    const entries: PaletteEntry[] = [
      { type: 'x', name: 'X', category: 'Only', description: '', inputCount: 0, outputCount: 0 },
      { type: 'y', name: 'Y', category: 'Only', description: '', inputCount: 0, outputCount: 0 }
    ]
    const groups = groupByCategory(entries)
    expect(groups.size).toBe(1)
    expect(groups.get('Only')).toHaveLength(2)
  })

  // Edge case 3: each entry in different category gives many groups
  it('each unique category creates its own group', () => {
    const entries: PaletteEntry[] = ['A', 'B', 'C'].map(c => ({
      type: c.toLowerCase(),
      name: c,
      category: c,
      description: '',
      inputCount: 0,
      outputCount: 0
    }))
    const groups = groupByCategory(entries)
    expect(groups.size).toBe(3)
  })
})

// ─── getCategoryColor ─────────────────────────────────────────────────────────

describe('getCategoryColor', () => {
  // Happy path
  it('returns defined color for known categories', () => {
    for (const category of Object.keys(CATEGORY_COLORS)) {
      if (category === 'Default') continue
      const color = getCategoryColor(category)
      expect(color).toBe(CATEGORY_COLORS[category])
    }
  })

  // Edge case 1: unknown category falls back to Default
  it('returns Default color for unknown category', () => {
    const color = getCategoryColor('UnknownXYZ')
    expect(color).toBe(CATEGORY_COLORS.Default)
  })

  // Edge case 2: empty string falls back to Default
  it('returns Default color for empty string', () => {
    const color = getCategoryColor('')
    expect(color).toBe(CATEGORY_COLORS.Default)
  })

  // Edge case 3: colors are hex strings
  it('all defined colors are hex color strings', () => {
    for (const color of Object.values(CATEGORY_COLORS)) {
      expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/)
    }
  })
})
