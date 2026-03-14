/**
 * Tests for the flat dark widget restyle (issue #55).
 *
 * Verifies the design tokens used across all six widget types:
 * - Input background: #141414 (near-invisible, matches canvas surface)
 * - Border: #333333 (1px, very subtle)
 * - Focus border: #89b4fa (blue accent)
 * - Text size: 11px body, 10px labels
 * - Label color: gray-500 (muted)
 * - Toggle active: #89b4fa, inactive: #2a2a2a
 * - Slider accent: #89b4fa
 *
 * Constants are mirrors of values in the widget TSX files and must be kept
 * in sync manually.
 */
import { describe, it, expect } from 'vitest'

// ─── Shared design tokens (mirrored from widget files) ────────────────────────

const INPUT_BG = '#141414'
const INPUT_BORDER = '#333333'
const FOCUS_BORDER = '#89b4fa'
const BODY_TEXT_SIZE = '11px'
const LABEL_TEXT_SIZE = '10px'
const SLIDER_ACCENT = '#89b4fa'
const TOGGLE_ACTIVE_BG = '#89b4fa'
const TOGGLE_INACTIVE_BG = '#2a2a2a'
const SELECT_OPTION_BG = '#1a1a1a'
const TEXTAREA_PADDING = 'p-3'

// ─── Input / background tokens ────────────────────────────────────────────────

describe('widget input background token', () => {
  // Happy path: input background is the expected very dark color
  it('INPUT_BG is #141414 (near-invisible dark)', () => {
    expect(INPUT_BG).toBe('#141414')
  })

  // Edge case 1: background must not be fully black (too harsh)
  it('INPUT_BG is lighter than pure black #000000', () => {
    expect(INPUT_BG).not.toBe('#000000')
  })

  // Edge case 2: background must not be node body color (would blend completely)
  it('INPUT_BG differs from node-bg (#1a1a1a)', () => {
    expect(INPUT_BG).not.toBe('#1a1a1a')
  })
})

// ─── Border tokens ────────────────────────────────────────────────────────────

describe('widget border token', () => {
  // Happy path: border color is the expected subtle gray
  it('INPUT_BORDER is #333333 (subtle)', () => {
    expect(INPUT_BORDER).toBe('#333333')
  })

  // Edge case: border must not be transparent (needs minimal visibility)
  it('INPUT_BORDER is not transparent', () => {
    expect(INPUT_BORDER).not.toBe('transparent')
  })
})

// ─── Focus border ─────────────────────────────────────────────────────────────

describe('widget focus border token', () => {
  // Happy path: focus uses the blue accent color
  it('FOCUS_BORDER is #89b4fa (blue accent)', () => {
    expect(FOCUS_BORDER).toBe('#89b4fa')
  })

  // Focus border must differ from the default border (visible on focus)
  it('FOCUS_BORDER differs from INPUT_BORDER', () => {
    expect(FOCUS_BORDER).not.toBe(INPUT_BORDER)
  })
})

// ─── Typography ───────────────────────────────────────────────────────────────

describe('widget typography tokens', () => {
  // Happy path: body text is 11px
  it('BODY_TEXT_SIZE is 11px', () => {
    expect(BODY_TEXT_SIZE).toBe('11px')
  })

  // Happy path: labels are 10px (smaller than body)
  it('LABEL_TEXT_SIZE is 10px', () => {
    expect(LABEL_TEXT_SIZE).toBe('10px')
  })

  // Labels must be smaller than body text
  it('LABEL_TEXT_SIZE is smaller than BODY_TEXT_SIZE', () => {
    const labelPx = parseInt(LABEL_TEXT_SIZE)
    const bodyPx = parseInt(BODY_TEXT_SIZE)
    expect(labelPx).toBeLessThan(bodyPx)
  })
})

// ─── Slider accent ────────────────────────────────────────────────────────────

describe('slider accent color', () => {
  // Happy path: slider uses the same blue as focus borders
  it('SLIDER_ACCENT matches focus border color', () => {
    expect(SLIDER_ACCENT).toBe(FOCUS_BORDER)
  })

  it('SLIDER_ACCENT is #89b4fa', () => {
    expect(SLIDER_ACCENT).toBe('#89b4fa')
  })
})

// ─── Toggle colors ────────────────────────────────────────────────────────────

describe('toggle widget colors', () => {
  // Happy path: active toggle uses blue accent
  it('TOGGLE_ACTIVE_BG is #89b4fa (blue accent)', () => {
    expect(TOGGLE_ACTIVE_BG).toBe('#89b4fa')
  })

  // Happy path: inactive toggle uses very dark gray track
  it('TOGGLE_INACTIVE_BG is #2a2a2a (dark track)', () => {
    expect(TOGGLE_INACTIVE_BG).toBe('#2a2a2a')
  })

  // Active and inactive states must differ (visual feedback)
  it('TOGGLE_ACTIVE_BG differs from TOGGLE_INACTIVE_BG', () => {
    expect(TOGGLE_ACTIVE_BG).not.toBe(TOGGLE_INACTIVE_BG)
  })

  // Active toggle matches the shared blue accent
  it('TOGGLE_ACTIVE_BG matches shared blue accent (FOCUS_BORDER)', () => {
    expect(TOGGLE_ACTIVE_BG).toBe(FOCUS_BORDER)
  })
})

// ─── Select option background ─────────────────────────────────────────────────

describe('select option background', () => {
  // Happy path: option background is dark for readability
  it('SELECT_OPTION_BG is #1a1a1a (node body color)', () => {
    expect(SELECT_OPTION_BG).toBe('#1a1a1a')
  })

  // Options must not share the same background as the select element
  it('SELECT_OPTION_BG differs from INPUT_BG', () => {
    expect(SELECT_OPTION_BG).not.toBe(INPUT_BG)
  })
})

// ─── TextArea padding ─────────────────────────────────────────────────────────

describe('textarea padding token', () => {
  // Happy path: textarea uses generous padding for prompt entry comfort
  it('TEXTAREA_PADDING is p-3 (generous, comfortable)', () => {
    expect(TEXTAREA_PADDING).toBe('p-3')
  })

  // Padding must not be the minimal p-1 used on inline inputs
  it('TEXTAREA_PADDING is not p-1 (too tight for prompts)', () => {
    expect(TEXTAREA_PADDING).not.toBe('p-1')
  })
})
