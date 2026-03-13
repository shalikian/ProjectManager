import React from 'react'
import { useFlowStore } from '../store/flow-store'
import type { NodeType } from '../../../shared/types'

interface PaletteItem {
  type: NodeType
  label: string
  icon: string
  description: string
}

const PALETTE_ITEMS: PaletteItem[] = [
  {
    type: 'imageSource',
    label: 'Image Source',
    icon: '▲',
    description: 'Load an image from disk'
  },
  {
    type: 'filter',
    label: 'Filter',
    icon: '◈',
    description: 'Apply image filters'
  },
  {
    type: 'output',
    label: 'Output',
    icon: '■',
    description: 'Export the result'
  }
]

function PaletteItem({ item }: { item: PaletteItem }): React.JSX.Element {
  const { addNode } = useFlowStore()

  return (
    <button
      className="w-full text-left px-3 py-2 rounded-md bg-node-bg border border-node-border
                 hover:border-node-selected hover:bg-node-header transition-colors group"
      onClick={() => addNode(item.type)}
      title={item.description}
    >
      <div className="flex items-center gap-2">
        <span className="text-blue-400 text-sm">{item.icon}</span>
        <div>
          <p className="text-xs font-medium text-white">{item.label}</p>
          <p className="text-[10px] text-gray-500 group-hover:text-gray-400">
            {item.description}
          </p>
        </div>
      </div>
    </button>
  )
}

export default function NodePalette(): React.JSX.Element {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-3 py-2 border-b border-canvas-border">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Node Palette
        </h2>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {PALETTE_ITEMS.map(item => (
          <PaletteItem key={item.type} item={item} />
        ))}
      </div>
    </div>
  )
}
