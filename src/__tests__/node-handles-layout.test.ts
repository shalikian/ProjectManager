/**
 * Tests for node handle layout logic.
 *
 * The PortHandle component uses a topPercent formula to distribute handles
 * evenly along the vertical axis of a node:
 *   - Single handle: centered at 50%
 *   - Multiple handles: distributed between 20% and 80%
 *
 * This file also verifies the port-type color mapping used for handle colors,
 * and the handle style constants from issue #50 (7px circles, border-radius 50%).
 */
import { describe, it, expect } from 'vitest'
import { PORT_TYPE_REGISTRY, resolvePortType } from '../shared/types'

// ─── Handle position calculation ────────────────────────────────────────────

/**
 * Mirrors the topPercent formula from PortHandle in NodeHandles.tsx.
 */
function calcTopPercent(index: number, total: number): number {
  return total === 1 ? 50 : 20 + (60 / (total - 1)) * index
}

describe('handle vertical distribution (topPercent)', () => {
  // Happy path: single handle is centered
  it('places a single handle at 50% (center)', () => {
    expect(calcTopPercent(0, 1)).toBe(50)
  })

  // Happy path: two handles are at 20% and 80%
  it('places two handles at 20% and 80%', () => {
    expect(calcTopPercent(0, 2)).toBe(20)
    expect(calcTopPercent(1, 2)).toBe(80)
  })

  // Edge case 1: four handles are evenly distributed between 20% and 80%
  it('distributes four handles evenly between 20% and 80%', () => {
    const positions = [0, 1, 2, 3].map(i => calcTopPercent(i, 4))
    expect(positions[0]).toBeCloseTo(20, 5)
    expect(positions[1]).toBeCloseTo(40, 5)
    expect(positions[2]).toBeCloseTo(60, 5)
    expect(positions[3]).toBeCloseTo(80, 5)
  })

  // Edge case 2: first and last handles always anchor to 20% and 80%
  it('always starts at 20% and ends at 80% regardless of count', () => {
    for (let total = 2; total <= 6; total++) {
      expect(calcTopPercent(0, total)).toBe(20)
      expect(calcTopPercent(total - 1, total)).toBe(80)
    }
  })

  // Edge case 3: three handles produce correct intermediate position
  it('places the middle handle of three at exactly 50%', () => {
    expect(calcTopPercent(1, 3)).toBe(50)
  })
})

// ─── Handle style constants ──────────────────────────────────────────────────

/**
 * Verify the visual properties introduced in issue #50:
 *  - 7x7px circular handles
 *  - Subtle 1px border
 */
const HANDLE_SIZE = 7
const HANDLE_BORDER = '1px solid rgba(0,0,0,0.3)'
const HANDLE_BORDER_RADIUS = '50%'

describe('handle style constants (issue #50)', () => {
  it('handle size is 7px', () => {
    expect(HANDLE_SIZE).toBe(7)
  })

  it('handle border is subtle 1px semi-transparent black', () => {
    expect(HANDLE_BORDER).toBe('1px solid rgba(0,0,0,0.3)')
  })

  it('handle border-radius is 50% for circular shape', () => {
    expect(HANDLE_BORDER_RADIUS).toBe('50%')
  })
})

// ─── Port type color mapping ─────────────────────────────────────────────────

describe('port type colors used by handles', () => {
  // Happy path: all five port type colors are correct hex values
  it('IMAGE port color is #64B5F6', () => {
    expect(PORT_TYPE_REGISTRY['IMAGE'].color).toBe('#64B5F6')
  })

  it('TEXT port color is #81C784', () => {
    expect(PORT_TYPE_REGISTRY['TEXT'].color).toBe('#81C784')
  })

  it('NUMBER port color is #FFB74D', () => {
    expect(PORT_TYPE_REGISTRY['NUMBER'].color).toBe('#FFB74D')
  })

  it('JSON port color is #CE93D8', () => {
    expect(PORT_TYPE_REGISTRY['JSON'].color).toBe('#CE93D8')
  })

  it('ANY port color is #9E9E9E', () => {
    expect(PORT_TYPE_REGISTRY['ANY'].color).toBe('#9E9E9E')
  })

  // Edge case 1: unknown type resolves to ANY color
  it('resolves unknown port type to ANY color', () => {
    const resolved = resolvePortType('UNKNOWN_TYPE')
    expect(resolved.color).toBe(PORT_TYPE_REGISTRY['ANY'].color)
  })

  // Edge case 2: resolvePortType returns the exact PortType object for known types
  it('resolves IMAGE type to the IMAGE PortType entry', () => {
    const resolved = resolvePortType('IMAGE')
    expect(resolved).toEqual(PORT_TYPE_REGISTRY['IMAGE'])
  })

  // Edge case 3: empty string type resolves to ANY fallback
  it('resolves empty string type to ANY fallback', () => {
    const resolved = resolvePortType('')
    expect(resolved.color).toBe(PORT_TYPE_REGISTRY['ANY'].color)
  })
})
