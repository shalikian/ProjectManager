/**
 * Tests for the triggerRejectionAnimation utility used by Canvas.
 * Verifies the shake/flash feedback shown when a connection drag is rejected.
 *
 * Uses a minimal classList mock to avoid requiring a DOM environment.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { triggerRejectionAnimation } from '../renderer/src/components/Canvas'

/** Minimal mock of an HTMLElement's classList for testing purposes. */
function makeClassListMock(): { classes: Set<string>; add: (c: string) => void; remove: (c: string) => void; contains: (c: string) => boolean } {
  const classes = new Set<string>()
  return {
    classes,
    add: (c: string) => classes.add(c),
    remove: (c: string) => classes.delete(c),
    contains: (c: string) => classes.has(c)
  }
}

/** Creates a minimal HTMLElement-like object sufficient for triggerRejectionAnimation. */
function makeEl(): HTMLElement {
  const mock = makeClassListMock()
  return { classList: mock } as unknown as HTMLElement
}

describe('triggerRejectionAnimation', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  // Happy path: class is added immediately and removed after the duration
  it('adds connection-rejected class to the element immediately', () => {
    const el = makeEl()
    triggerRejectionAnimation(el, 350)
    expect(el.classList.contains('connection-rejected')).toBe(true)
  })

  it('removes connection-rejected class after the specified duration', () => {
    const el = makeEl()
    triggerRejectionAnimation(el, 350)
    expect(el.classList.contains('connection-rejected')).toBe(true)
    vi.advanceTimersByTime(350)
    expect(el.classList.contains('connection-rejected')).toBe(false)
  })

  // Edge case: class is not removed before the duration elapses
  it('does not remove the class before the duration has elapsed', () => {
    const el = makeEl()
    triggerRejectionAnimation(el, 350)
    vi.advanceTimersByTime(349)
    expect(el.classList.contains('connection-rejected')).toBe(true)
  })

  // Edge case: works with a custom short duration (0ms fires on next tick)
  it('removes class after a zero-ms duration on the next timer tick', () => {
    const el = makeEl()
    triggerRejectionAnimation(el, 0)
    vi.advanceTimersByTime(0)
    expect(el.classList.contains('connection-rejected')).toBe(false)
  })

  // Edge case: calling twice in quick succession — class removed when last timer fires
  it('handles multiple rapid calls — class is removed after the duration', () => {
    const el = makeEl()
    triggerRejectionAnimation(el, 350)
    triggerRejectionAnimation(el, 350)
    // Both timers scheduled; advance past both
    vi.advanceTimersByTime(350)
    expect(el.classList.contains('connection-rejected')).toBe(false)
  })
})
