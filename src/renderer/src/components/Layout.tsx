import React from 'react'
import { useUiStore } from '../store/ui-store'
import NodePalette from './NodePalette'
import Canvas from './Canvas'
import PropertiesPanel from './PropertiesPanel'
import StatusBar from './StatusBar'

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

export default function Layout(): React.JSX.Element {
  const { leftPanelOpen, rightPanelOpen } = useUiStore()

  return (
    <div className="flex flex-col h-screen w-screen bg-canvas-bg text-white overflow-hidden">
      <main className="flex flex-1 overflow-hidden" data-testid="main-panels">
        <LeftPanel isOpen={leftPanelOpen} />
        <section className="flex-1 relative overflow-hidden" data-testid="canvas-container">
          <Canvas />
        </section>
        <RightPanel isOpen={rightPanelOpen} />
      </main>
      <StatusBar />
    </div>
  )
}
