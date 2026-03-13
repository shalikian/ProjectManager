import { describe, it, expect, beforeEach } from 'vitest'
import { useUiStore } from '../renderer/src/store/ui-store'

describe('useUiStore', () => {
  // Reset store state between tests
  beforeEach(() => {
    useUiStore.setState({ leftPanelOpen: true, rightPanelOpen: true })
  })

  // Happy path: default state has both panels open
  it('initializes with both panels open', () => {
    const state = useUiStore.getState()
    expect(state.leftPanelOpen).toBe(true)
    expect(state.rightPanelOpen).toBe(true)
  })

  // Edge case 1: toggleLeftPanel closes the left panel
  it('toggleLeftPanel closes an open left panel', () => {
    const { toggleLeftPanel } = useUiStore.getState()
    toggleLeftPanel()
    expect(useUiStore.getState().leftPanelOpen).toBe(false)
  })

  // Edge case 2: toggleRightPanel closes the right panel
  it('toggleRightPanel closes an open right panel', () => {
    const { toggleRightPanel } = useUiStore.getState()
    toggleRightPanel()
    expect(useUiStore.getState().rightPanelOpen).toBe(false)
  })

  // Edge case 3: collapsing both panels leaves both closed
  it('both panels can be collapsed independently', () => {
    const store = useUiStore.getState()
    store.toggleLeftPanel()
    store.toggleRightPanel()
    const state = useUiStore.getState()
    expect(state.leftPanelOpen).toBe(false)
    expect(state.rightPanelOpen).toBe(false)
  })

  // Edge case 4: toggle twice returns to original state
  it('double-toggle restores panel to open state', () => {
    const store = useUiStore.getState()
    store.toggleLeftPanel()
    useUiStore.getState().toggleLeftPanel()
    expect(useUiStore.getState().leftPanelOpen).toBe(true)
  })

  // Edge case 5: setLeftPanel explicitly sets panel state
  it('setLeftPanel can set state explicitly', () => {
    const { setLeftPanel } = useUiStore.getState()
    setLeftPanel(false)
    expect(useUiStore.getState().leftPanelOpen).toBe(false)
    setLeftPanel(true)
    expect(useUiStore.getState().leftPanelOpen).toBe(true)
  })

  // Edge case 6: setRightPanel explicitly sets panel state
  it('setRightPanel can set state explicitly', () => {
    const { setRightPanel } = useUiStore.getState()
    setRightPanel(false)
    expect(useUiStore.getState().rightPanelOpen).toBe(false)
    setRightPanel(true)
    expect(useUiStore.getState().rightPanelOpen).toBe(true)
  })
})
