/**
 * connection-utils.ts
 * Utilities for validating and coloring React Flow connections based on
 * the port type system defined in src/shared/types.ts.
 */

import type { Connection, Node, Edge } from '@xyflow/react'
import { isTypeCompatible, resolvePortType, PORT_TYPE_REGISTRY } from '../../../shared/types'
import type { TypedEdgeData } from '../components/TypedEdge'

/** Fallback color when no port type is resolvable. */
const FALLBACK_COLOR = PORT_TYPE_REGISTRY.ANY.color

/**
 * Extracts the port type id from a node's definition for the given handle id.
 * Works with both GenericNode definitions and legacy hard-coded nodes.
 */
function getPortTypeId(node: Node, handleId: string | null, isSource: boolean): string {
  const data = node.data as Record<string, unknown>
  const definition = data?.definition as
    | { inputs: Array<{ id: string; type: string }>; outputs: Array<{ id: string; type: string }> }
    | undefined

  if (!definition) return 'ANY'

  const ports = isSource ? definition.outputs : definition.inputs
  const port = ports.find(p => p.id === handleId)
  return port?.type ?? 'ANY'
}

/**
 * Returns the color for a source port handle on the given node.
 * Falls back to FALLBACK_COLOR if no type info is available.
 */
export function getSourcePortColor(sourceNode: Node, sourceHandleId: string | null): string {
  const typeId = getPortTypeId(sourceNode, sourceHandleId, true)
  const portType = resolvePortType(typeId)
  return portType.color ?? FALLBACK_COLOR
}

/**
 * Checks whether a connection is valid:
 *  1. No self-connections (source node === target node).
 *  2. No duplicate connections (same source port → same target port already exists).
 *  3. Port types must be compatible per isTypeCompatible().
 */
export function validateConnection(
  connection: Connection,
  nodes: Node[],
  edges: Edge[]
): boolean {
  const { source, target, sourceHandle, targetHandle } = connection

  // Prevent self-connections
  if (source === target) return false

  // Prevent duplicate edges
  const isDuplicate = edges.some(
    e =>
      e.source === source &&
      e.target === target &&
      e.sourceHandle === sourceHandle &&
      e.targetHandle === targetHandle
  )
  if (isDuplicate) return false

  // Type compatibility check
  const sourceNode = nodes.find(n => n.id === source)
  const targetNode = nodes.find(n => n.id === target)

  if (!sourceNode || !targetNode) return false

  const sourceTypeId = getPortTypeId(sourceNode, sourceHandle ?? null, true)
  const targetTypeId = getPortTypeId(targetNode, targetHandle ?? null, false)

  return isTypeCompatible(sourceTypeId, targetTypeId)
}

/**
 * Builds the edge data object (including color) for a new typed connection.
 */
export function buildTypedEdgeData(
  connection: Connection,
  nodes: Node[]
): TypedEdgeData {
  const sourceNode = nodes.find(n => n.id === connection.source)
  const color = sourceNode
    ? getSourcePortColor(sourceNode, connection.sourceHandle ?? null)
    : FALLBACK_COLOR

  return { color }
}
