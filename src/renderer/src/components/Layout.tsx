import React, { useEffect } from 'react'
import { useUiStore } from '../store/ui-store'
import NodePalette from './NodePalette'
import Canvas from './Canvas'
import PropertiesPanel from './PropertiesPanel'
import StatusBar from './StatusBar'
import SettingsDialog from './settings/SettingsDialog'
import GalleryPanel from './gallery/GalleryPanel'
import { useGalleryStore } from '../store/gallery-store'

const LEFT_PANEL_WIDTH = 250
const RIGHT_PANEL_WIDTH = 300

function PanelToggleButton({
  side,
  isOpen,
  onToggle
}: {
  side: 'left' | 'right'
  isOpen: boolean
  onToggle: () => void
}): React.JSX.Element {
  const label = side === 'left' ? (isOpen ? '‹' : '›') : isOpen ? '›' : '‹'
  const title = `${isOpen ? 'Collapse' : 'Expand'} ${side} panel`

  return (
    <button
      onClick={onToggle}
      title={title}
      aria-label={title}
      className="absolute top-1/2 -translate-y-1/2 z-10 w-4 h-8 flex items-center justify-center
                 bg-canvas-surface border border-canvas-border text-gray-400
                 hover:text-white hover:bg-node-header transition-colors rounded-sm text-xs"
      style={{ [side === 'left' ? 'right' : 'left']: '-8px' }}
    >
      {label}
    </button>
  )
}

function LeftPanel({ isOpen }: { isOpen: boolean }): React.JSX.Element {
  const { toggleLeftPanel } = useUiStore()

  return (
    <aside
      data-testid="left-panel"
      className="relative flex-shrink-0 border-r border-canvas-border bg-canvas-surface
                 transition-all duration-200 overflow-hidden"
      style={{ width: isOpen ? LEFT_PANEL_WIDTH : 0 }}
    >
      {isOpen && <NodePalette />}
      <PanelToggleButton side="left" isOpen={isOpen} onToggle={toggleLeftPanel} />
    </aside>
  )
}

function RightPanel({ isOpen }: { isOpen: boolean }): React.JSX.Element {
  const { toggleRightPanel } = useUiStore()

  return (
    <aside
      data-testid="right-panel"
      className="relative flex-shrink-0 border-l border-canvas-border bg-canvas-surface
                 transition-all duration-200 overflow-hidden"
      style={{ width: isOpen ? RIGHT_PANEL_WIDTH : 0 }}
    >
      {isOpen && <PropertiesPanel />}
      <PanelToggleButton side="right" isOpen={isOpen} onToggle={toggleRightPanel} />
    </aside>
  )
}

function GalleryToggleButton(): React.JSX.Element {
  const { toggleGallery, galleryOpen, items } = useGalleryStore()
  return (
    <button
      onClick={toggleGallery}
      title={galleryOpen ? 'Hide gallery' : 'Show gallery'}
      aria-label={galleryOpen ? 'Hide gallery' : 'Show gallery'}
      aria-pressed={galleryOpen}
      className={`absolute bottom-8 right-4 z-10 px-3 py-1.5 text-xs font-medium
                  border rounded transition-colors
                  ${galleryOpen
                    ? 'bg-node-selected text-canvas-bg border-node-selected'
                    : 'bg-canvas-surface border-canvas-border text-gray-400 hover:text-white hover:bg-node-header'
                  }`}
    >
      Gallery {items.length > 0 ? `(${items.length})` : ''}
    </button>
  )
}

export default function Layout(): React.JSX.Element {
  const {
    leftPanelOpen,
    rightPanelOpen,
    settingsOpen,
    openSettings,
    closeSettings,
    toggleMiniMap
  } = useUiStore()

  // Listen for the main-process "open settings" IPC event (File → Settings menu)
  useEffect(() => {
    const ipc = window.electron?.ipcRenderer
    if (!ipc) return
    ipc.on('app:open-settings', openSettings)
    return () => ipc.off('app:open-settings', openSettings)
  }, [openSettings])

  // Listen for the main-process "toggle minimap" IPC event (View → Toggle MiniMap menu)
  useEffect(() => {
    const ipc = window.electron?.ipcRenderer
    if (!ipc) return
    ipc.on('app:toggle-minimap', toggleMiniMap)
    return () => ipc.off('app:toggle-minimap', toggleMiniMap)
  }, [toggleMiniMap])

  return (
    <div className="flex flex-col h-screen w-screen bg-canvas-bg text-white overflow-hidden">
      <main className="flex flex-1 overflow-hidden relative" data-testid="main-panels">
        <LeftPanel isOpen={leftPanelOpen} />
        <section className="flex-1 relative overflow-hidden" data-testid="canvas-container">
          <Canvas />
        </section>
        <RightPanel isOpen={rightPanelOpen} />
        <GalleryToggleButton />
      </main>
      <GalleryPanel />
      <StatusBar />
      <SettingsDialog isOpen={settingsOpen} onClose={closeSettings} />
    </div>
  )
}
