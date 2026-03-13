import React from 'react'
import { useFlowStore } from '../store/flow-store'

export default function Toolbar(): React.JSX.Element {
  const { addNode } = useFlowStore()

  return (
    <header className="flex items-center gap-2 px-4 py-2 bg-canvas-surface border-b border-canvas-border">
      <h1 className="text-sm font-semibold text-white mr-4">Node Image Generator</h1>

      <div className="flex items-center gap-1">
        <span className="text-xs text-gray-400 mr-2">Add Node:</span>
        <button
          className="px-3 py-1 text-xs bg-node-header hover:bg-node-selected hover:text-canvas-bg
                     border border-node-border rounded transition-colors"
          onClick={() => addNode('imageSource')}
        >
          Image Source
        </button>
        <button
          className="px-3 py-1 text-xs bg-node-header hover:bg-node-selected hover:text-canvas-bg
                     border border-node-border rounded transition-colors"
          onClick={() => addNode('filter')}
        >
          Filter
        </button>
        <button
          className="px-3 py-1 text-xs bg-node-header hover:bg-node-selected hover:text-canvas-bg
                     border border-node-border rounded transition-colors"
          onClick={() => addNode('output')}
        >
          Output
        </button>
      </div>
    </header>
  )
}
