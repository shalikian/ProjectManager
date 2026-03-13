/**
 * WorkflowController — renders nothing but wires up workflow menu events and
 * unsaved-change tracking. Must be placed inside a ReactFlow component so that
 * useReactFlow() is available.
 */

import { useWorkflow } from './useWorkflow'
import { useWorkflowMenuEvents } from './useWorkflowMenuEvents'
import { useUnsavedChanges } from './useUnsavedChanges'

export default function WorkflowController(): null {
  const actions = useWorkflow()
  useWorkflowMenuEvents(actions)
  useUnsavedChanges()
  return null
}
