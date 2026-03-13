/**
 * Utility functions to serialize and deserialize a workflow using React Flow's
 * toObject() API extended with custom parameter data from the flow store.
 */

import type { ReactFlowInstance } from '@xyflow/react'
import type { WorkflowFile, SerializedNode, SerializedEdge } from '../../../shared/workflow-types'
import { WORKFLOW_FORMAT_VERSION } from '../../../shared/workflow-types'
import type { NodeRuntimeState } from '../store/flow-store'

/**
 * Serialize the current React Flow graph plus runtime parameter values into a
 * WorkflowFile that can be persisted to disk.
 */
export function serializeWorkflow(
  rfInstance: ReactFlowInstance,
  nodeRuntimeStates: Record<string, NodeRuntimeState>,
  workflowName: string
): WorkflowFile {
  const { nodes, edges, viewport } = rfInstance.toObject()

  const serializedNodes: SerializedNode[] = nodes.map(node => ({
    id: node.id,
    type: node.type ?? 'default',
    position: node.position,
    data: (node.data as Record<string, unknown>) ?? {},
    paramValues: nodeRuntimeStates[node.id]?.paramValues ?? {}
  }))

  const serializedEdges: SerializedEdge[] = edges.map(edge => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    sourceHandle: edge.sourceHandle,
    targetHandle: edge.targetHandle,
    type: edge.type,
    data: (edge.data as Record<string, unknown>) ?? {}
  }))

  const now = new Date().toISOString()

  return {
    version: WORKFLOW_FORMAT_VERSION,
    metadata: {
      name: workflowName,
      created: now,
      modified: now
    },
    nodes: serializedNodes,
    edges: serializedEdges,
    viewport
  }
}

/**
 * Validate that a parsed object looks like a WorkflowFile.
 * Returns null if valid, or an error message if not.
 */
export function validateWorkflowFile(data: unknown): string | null {
  if (!data || typeof data !== 'object') {
    return 'Workflow file is not a valid JSON object'
  }
  const obj = data as Record<string, unknown>

  if (typeof obj.version !== 'string') {
    return 'Missing or invalid version field'
  }
  if (!Array.isArray(obj.nodes)) {
    return 'Missing or invalid nodes array'
  }
  if (!Array.isArray(obj.edges)) {
    return 'Missing or invalid edges array'
  }
  if (!obj.metadata || typeof obj.metadata !== 'object') {
    return 'Missing or invalid metadata field'
  }
  return null
}

/**
 * Extract unknown node types from a workflow file, returning a list of type IDs
 * that are not present in the knownTypes set.
 */
export function findUnknownNodeTypes(
  workflow: WorkflowFile,
  knownTypes: Set<string>
): string[] {
  const unknown = new Set<string>()
  for (const node of workflow.nodes) {
    if (!knownTypes.has(node.type)) {
      unknown.add(node.type)
    }
  }
  return Array.from(unknown)
}

/** Derive a workflow name from a file path by stripping the extension. */
export function nameFromFilePath(filePath: string): string {
  const sep = filePath.includes('/') ? '/' : '\\'
  const base = filePath.split(sep).pop() ?? filePath
  return base.replace(/\.nodegen$/i, '')
}
