/**
 * TypedEdge — A custom React Flow edge that renders as a thin gray bezier
 * curve. Selected edges are slightly thicker with a subtle drop-shadow glow.
 * The midpoint indicator and dashed animation have been removed for a clean,
 * unobtrusive look matching the weavy.ai reference design.
 */
import React from 'react'
import { BaseEdge, EdgeProps, getBezierPath } from '@xyflow/react'

/** Extra data we store on edges (currently unused for color, reserved for future). */
export interface TypedEdgeData {
  /** Hex color derived from the source port's PortType (reserved, not applied to stroke) */
  color?: string
  [key: string]: unknown
}

/** Default unselected stroke color — neutral gray. */
const DEFAULT_EDGE_COLOR = '#666666'

/** Default stroke width for unselected edges. */
const DEFAULT_STROKE_WIDTH = 1.5

/** Stroke width when the edge is selected. */
const SELECTED_STROKE_WIDTH = 2

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

/** Renders a thin gray bezier edge. Selected edges show a 2px stroke with glow. */
export default function TypedEdge(props: EdgeProps): React.JSX.Element {
  const { id, selected, markerEnd } = props

  const [path] = buildEdgePath(props)

  const strokeStyle = {
    stroke: DEFAULT_EDGE_COLOR,
    strokeWidth: selected ? SELECTED_STROKE_WIDTH : DEFAULT_STROKE_WIDTH,
    filter: selected
      ? `drop-shadow(0 0 3px ${DEFAULT_EDGE_COLOR})`
      : undefined
  }

  return (
    <BaseEdge
      id={id}
      path={path}
      markerEnd={markerEnd}
      style={strokeStyle}
      interactionWidth={16}
    />
  )
}
