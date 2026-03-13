import React from 'react'
import { Handle, Position, NodeProps } from '@xyflow/react'
import type { NodeData } from '../../../../shared/types'

export default function FilterNode({ data, selected }: NodeProps): React.JSX.Element {
  const label = (data as NodeData).label ?? 'Filter'

  return (
    <div
      className={`node-card min-w-[160px] ${selected ? 'border-node-selected' : 'border-node-border'}`}
    >
      <div className="node-header flex items-center gap-2">
        <span className="text-purple-400">&#9670;</span>
        <span>{label}</span>
      </div>
      <div className="node-body text-xs text-gray-400">
        <p>No filter selected</p>
      </div>
      <Handle type="target" position={Position.Left} className="!bg-purple-400" />
      <Handle type="source" position={Position.Right} className="!bg-purple-400" />
    </div>
  )
}
