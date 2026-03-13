import { create } from 'zustand'

interface UiState {
  leftPanelOpen: boolean
  rightPanelOpen: boolean
  toggleLeftPanel: () => void
  toggleRightPanel: () => void
  setLeftPanel: (open: boolean) => void
  setRightPanel: (open: boolean) => void
}

export const useUiStore = create<UiState>(set => ({
  leftPanelOpen: true,
  rightPanelOpen: true,

  toggleLeftPanel: () => set(state => ({ leftPanelOpen: !state.leftPanelOpen })),
  toggleRightPanel: () => set(state => ({ rightPanelOpen: !state.rightPanelOpen })),

  setLeftPanel: (open: boolean) => set({ leftPanelOpen: open }),
  setRightPanel: (open: boolean) => set({ rightPanelOpen: open })
}))
