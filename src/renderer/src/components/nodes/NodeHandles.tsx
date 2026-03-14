import React from 'react'
import { Handle, Position } from '@xyflow/react'
import type { PortDefinition } from '../../../../shared/types'
import { resolvePortType } from '../../../../shared/types'

interface HandleListProps {
  ports: PortDefinition[]
  position: Position
  handleType: 'source' | 'target'
}

function PortHandle({
  port,
  index,
  total,
  position,
  handleType
}: {
  port: PortDefinition
  index: number
  total: number
  position: Position
  handleType: 'source' | 'target'
}): React.JSX.Element {
  const portType = resolvePortType(port.type)
  const topPercent = total === 1 ? 50 : 20 + (60 / (total - 1)) * index

  return (
    <Handle
      key={port.id}
      id={port.id}
      type={handleType}
      position={position}
      className="node-port-handle"
      style={{
        backgroundColor: portType.color,
        top: `${topPercent}%`,
        border: '2px solid rgba(0,0,0,0.4)',
        borderRadius: '50%',
        width: 14,
        height: 14
      }}
      title={`${port.label} (${portType.label})`}
    />
  )
}

export default function NodeHandles({
  ports,
  position,
  handleType
}: HandleListProps): React.JSX.Element {
  if (ports.length === 0) return <></>

  return (
    <>
      {ports.map((port, i) => (
        <PortHandle
          key={port.id}
          port={port}
          index={i}
          total={ports.length}
          position={position}
          handleType={handleType}
        />
      ))}
    </>
  )
}
