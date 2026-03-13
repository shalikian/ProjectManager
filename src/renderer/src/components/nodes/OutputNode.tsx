import React from 'react'
import { Handle, Position, NodeProps } from '@xyflow/react'
import type { NodeData } from '../../../../shared/types'

export default function OutputNode({ data, selected }: NodeProps): React.JSX.Element {
  const label = (data as NodeData).label ?? 'Output'

  return (
    <div
      className={`node-card min-w-[160px] ${selected ? 'border-node-selected' : 'border-node-border'}`}
    >
      <div className="node-header flex items-center gap-2">
        <span className="text-green-400">&#9660;</span>
        <span>{label}</span>
      </div>
      <div className="node-body text-xs text-gray-400">
        <p>No output configured</p>
      </div>
      <Handle type="target" position={Position.Left} className="!bg-green-400" />
    </div>
  )
}
