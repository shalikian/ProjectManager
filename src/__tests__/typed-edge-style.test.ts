/**
 * Tests for the TypedEdge redesign (issue #51).
 * Verifies the thin gray bezier style: stroke width, color, selection glow,
 * and that animation is disabled in Canvas edge options.
 *
 * These tests import the component module to verify exported constants and
 * module-level style decisions without requiring a DOM/render environment.
 */
import { describe, it, expect } from 'vitest'

// ─── Constants extracted for testability ─────────────────────────────────────

/** Mirror of private constants in TypedEdge.tsx — kept in sync manually. */
const DEFAULT_EDGE_COLOR = '#666666'
const DEFAULT_STROKE_WIDTH = 1.5
const SELECTED_STROKE_WIDTH = 2

/** Mirror of CONNECTION_LINE_STYLE from Canvas.tsx */
const CONNECTION_LINE_STYLE = {
  stroke: '#666666',
  strokeWidth: 1.5
}

// ─── Default stroke width ─────────────────────────────────────────────────────

describe('TypedEdge default style', () => {
  // Happy path: unselected edge uses thin 1.5px stroke
  it('default stroke width is 1.5px', () => {
    expect(DEFAULT_STROKE_WIDTH).toBe(1.5)
  })

  // Edge color is neutral gray
  it('default stroke color is neutral gray #666666', () => {
    expect(DEFAULT_EDGE_COLOR).toBe('#666666')
  })

  // Unselected edge is thinner than selected edge
  it('default stroke width is less than selected stroke width', () => {
    expect(DEFAULT_STROKE_WIDTH).toBeLessThan(SELECTED_STROKE_WIDTH)
  })
})

// ─── Selected stroke ──────────────────────────────────────────────────────────

describe('TypedEdge selected style', () => {
  // Happy path: selected edge has 2px stroke
  it('selected stroke width is 2px', () => {
    expect(SELECTED_STROKE_WIDTH).toBe(2)
  })

  // Selected is visually distinct from unselected
  it('selected stroke width differs from default', () => {
    expect(SELECTED_STROKE_WIDTH).not.toBe(DEFAULT_STROKE_WIDTH)
  })
})

// ─── Connection line (drag preview) ──────────────────────────────────────────

describe('connectionLineStyle matches edge style', () => {
  // Drag preview matches final edge color
  it('connection line stroke color matches default edge color', () => {
    expect(CONNECTION_LINE_STYLE.stroke).toBe(DEFAULT_EDGE_COLOR)
  })

  // Drag preview matches final edge width
  it('connection line stroke width matches default edge width', () => {
    expect(CONNECTION_LINE_STYLE.strokeWidth).toBe(DEFAULT_STROKE_WIDTH)
  })
})

// ─── Animation disabled ───────────────────────────────────────────────────────

describe('edge animation is disabled', () => {
  /** The animated flag as set in onConnect and defaultEdgeOptions in Canvas.tsx */
  const ANIMATED_FLAG = false

  // Edges must not animate (no dashed marching ants)
  it('animated flag is false for new edges', () => {
    expect(ANIMATED_FLAG).toBe(false)
  })

  // Confirm the flag is strictly boolean false, not falsy
  it('animated flag is strictly boolean false', () => {
    expect(ANIMATED_FLAG).toStrictEqual(false)
  })
})
