import { describe, it, expect, beforeEach } from 'vitest'
import { useUiStore } from '../renderer/src/store/ui-store'

const LEFT_PANEL_WIDTH = 250
const RIGHT_PANEL_WIDTH = 300

/**
 * Tests for layout panel width computation logic —
 * mirrors the logic used in Layout.tsx to derive panel widths.
 */
function getPanelWidth(isOpen: boolean, defaultWidth: number): number {
  return isOpen ? defaultWidth : 0
}

describe('Layout panel width logic', () => {
  beforeEach(() => {
    useUiStore.setState({ leftPanelOpen: true, rightPanelOpen: true })
  })

  // Happy path: three-panel layout renders with correct widths
  it('both panels have correct default widths when open', () => {
    const state = useUiStore.getState()
    expect(getPanelWidth(state.leftPanelOpen, LEFT_PANEL_WIDTH)).toBe(250)
    expect(getPanelWidth(state.rightPanelOpen, RIGHT_PANEL_WIDTH)).toBe(300)
  })

  // Edge case 1: collapse left sidebar — canvas expands (left panel width = 0)
  it('left panel collapses to width 0', () => {
    useUiStore.getState().toggleLeftPanel()
    const state = useUiStore.getState()
    expect(getPanelWidth(state.leftPanelOpen, LEFT_PANEL_WIDTH)).toBe(0)
    expect(getPanelWidth(state.rightPanelOpen, RIGHT_PANEL_WIDTH)).toBe(300)
  })

  // Edge case 2: collapse both sidebars — canvas fills entire window
  it('both panels collapse to width 0', () => {
    const store = useUiStore.getState()
    store.toggleLeftPanel()
    store.toggleRightPanel()
    const state = useUiStore.getState()
    expect(getPanelWidth(state.leftPanelOpen, LEFT_PANEL_WIDTH)).toBe(0)
    expect(getPanelWidth(state.rightPanelOpen, RIGHT_PANEL_WIDTH)).toBe(0)
  })

  // Edge case 3: panels expand back after collapsing
  it('panels return to full width after re-expanding', () => {
    const store = useUiStore.getState()
    store.toggleLeftPanel()
    useUiStore.getState().toggleLeftPanel()
    const state = useUiStore.getState()
    expect(getPanelWidth(state.leftPanelOpen, LEFT_PANEL_WIDTH)).toBe(250)
  })
})
