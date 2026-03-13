import React from 'react'
import { Handle, Position, NodeProps } from '@xyflow/react'
import type { NodeData } from '../../../../shared/types'

export default function ImageSourceNode({ data, selected }: NodeProps): React.JSX.Element {
  const label = (data as NodeData).label ?? 'Image Source'

  return (
    <div
      className={`node-card min-w-[160px] ${selected ? 'border-node-selected' : 'border-node-border'}`}
    >
      <div className="node-header flex items-center gap-2">
        <span className="text-blue-400">&#9651;</span>
        <span>{label}</span>
      </div>
      <div className="node-body text-xs text-gray-400">
        <p>No image loaded</p>
      </div>
      <Handle type="source" position={Position.Right} className="!bg-blue-400" />
    </div>
  )
}
