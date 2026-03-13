/**
 * TypedEdge — A custom React Flow edge that renders with the color of the
 * source port type. Handles are color-coded per the PORT_TYPE_REGISTRY.
 */
import React from 'react'
import { BaseEdge, EdgeProps, getBezierPath, EdgeLabelRenderer } from '@xyflow/react'

/** Extra data we store on edges to carry the port color. */
export interface TypedEdgeData {
  /** Hex color derived from the source port's PortType */
  color?: string
  [key: string]: unknown
}

const DEFAULT_EDGE_COLOR = '#9E9E9E'

function buildEdgePath(props: EdgeProps): [string, number, number] {
  const {
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition
  } = props

  const [path, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition
  })

  return [path, labelX, labelY]
}

/** Renders a bezier edge colored with the source port's type color. */
export default function TypedEdge(props: EdgeProps): React.JSX.Element {
  const { id, data, selected, markerEnd } = props
  const edgeData = data as TypedEdgeData | undefined
  const color = edgeData?.color ?? DEFAULT_EDGE_COLOR

  const [path, labelX, labelY] = buildEdgePath(props)

  const strokeStyle = {
    stroke: color,
    strokeWidth: selected ? 3 : 2,
    filter: selected ? `drop-shadow(0 0 4px ${color})` : undefined
  }

  return (
    <>
      <BaseEdge
        id={id}
        path={path}
        markerEnd={markerEnd}
        style={strokeStyle}
        interactionWidth={16}
      />
      {selected && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all'
            }}
            className="nodrag nopan"
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: color,
                border: '2px solid rgba(0,0,0,0.5)'
              }}
            />
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  )
}
