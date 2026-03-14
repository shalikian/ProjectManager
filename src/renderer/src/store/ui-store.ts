import { create } from 'zustand'

interface UiState {
  leftPanelOpen: boolean
  rightPanelOpen: boolean
  settingsOpen: boolean
  showMiniMap: boolean
  toggleLeftPanel: () => void
  toggleRightPanel: () => void
  setLeftPanel: (open: boolean) => void
  setRightPanel: (open: boolean) => void
  openSettings: () => void
  closeSettings: () => void
  toggleMiniMap: () => void
}

export const useUiStore = create<UiState>(set => ({
  leftPanelOpen: true,
  rightPanelOpen: true,
  settingsOpen: false,
  showMiniMap: false,

  toggleLeftPanel: () => set(state => ({ leftPanelOpen: !state.leftPanelOpen })),
  toggleRightPanel: () => set(state => ({ rightPanelOpen: !state.rightPanelOpen })),

  setLeftPanel: (open: boolean) => set({ leftPanelOpen: open }),
  setRightPanel: (open: boolean) => set({ rightPanelOpen: open }),

  openSettings: () => set({ settingsOpen: true }),
  closeSettings: () => set({ settingsOpen: false }),

  toggleMiniMap: () => set(state => ({ showMiniMap: !state.showMiniMap }))
}))
