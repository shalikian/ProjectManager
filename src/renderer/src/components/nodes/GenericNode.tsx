import React, { memo, useCallback } from 'react'
import { NodeProps, Position } from '@xyflow/react'
import type { NodeDefinition, NodeExecutionState, ParameterDefinition } from '../../../../shared/types'
import { useFlowStore } from '../../store/flow-store'
import NodeHeader from './NodeHeader'
import NodeHandles from './NodeHandles'
import NodeImagePreview from './NodeImagePreview'
import ParameterWidget from '../widgets/ParameterWidget'

/** Data shape stored in the React Flow node's `data` field for generic nodes. */
export interface GenericNodeData {
  definition: NodeDefinition
  [key: string]: unknown
}

const DEFAULT_WIDTH = 280

// ─── RunButton ────────────────────────────────────────────────────────────────

/** Circular arrow run button rendered at the bottom-right of the node card. */
function RunButton({
  onRun,
  disabled
}: {
  onRun: () => void
  disabled: boolean
}): React.JSX.Element {
  return (
    <button
      onClick={onRun}
      disabled={disabled}
      className="nodrag w-6 h-6 rounded-full flex items-center justify-center
                 bg-blue-600 hover:bg-blue-500 disabled:opacity-50
                 disabled:cursor-not-allowed text-white transition-colors shrink-0"
      title="Run this node"
      aria-label="Run node"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="11"
        height="11"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
      >
        <polygon points="5,3 19,12 5,21" />
      </svg>
    </button>
  )
}

// ─── NodeParameters ──────────────────────────────────────────────────────────

/**
 * Renders non-select parameters (text, number, slider, toggle, textarea)
 * as parameter widgets in the node body.
 */
function NodeParameters({
  nodeId,
  bodyParams,
  paramValues
}: {
  nodeId: string
  bodyParams: ParameterDefinition[]
  paramValues: Record<string, unknown>
}): React.JSX.Element {
  const { setNodeParamValue } = useFlowStore()

  if (bodyParams.length === 0) return <></>

  return (
    <div className="flex flex-col gap-2 px-2 py-2 border-t border-node-border">
      {bodyParams.map(param => (
        <ParameterWidget
          key={param.id}
          param={param}
          value={paramValues[param.id] ?? param.default}
          onChange={val => setNodeParamValue(nodeId, param.id, val)}
        />
      ))}
    </div>
  )
}

// ─── PortLabels ───────────────────────────────────────────────────────────────

function PortLabels({
  inputs,
  outputs
}: {
  inputs: NodeDefinition['inputs']
  outputs: NodeDefinition['outputs']
}): React.JSX.Element {
  if (inputs.length === 0 && outputs.length === 0) return <></>

  return (
    <div className="flex justify-between px-3 py-1">
      <div className="flex flex-col gap-0.5">
        {inputs.map(p => (
          <span key={p.id} className="text-[10px] text-gray-400 truncate max-w-[90px]">
            {p.label}
          </span>
        ))}
      </div>
      <div className="flex flex-col gap-0.5 items-end">
        {outputs.map(p => (
          <span key={p.id} className="text-[10px] text-gray-400 truncate max-w-[90px]">
            {p.label}
          </span>
        ))}
      </div>
    </div>
  )
}

// ─── GenericNodeInner ─────────────────────────────────────────────────────────

function GenericNodeInner({ id, data, selected }: NodeProps): React.JSX.Element {
  const { definition } = data as GenericNodeData
  const { setNodeExecutionState, setNodeParamValue, getOrCreateNodeRuntime, nodes } =
    useFlowStore()
  const runtime = getOrCreateNodeRuntime(id)

  const handleRun = useCallback(() => {
    setNodeExecutionState(id, 'running')
    // Simulate async execution for now
    setTimeout(() => {
      setNodeExecutionState(id, 'completed')
    }, 1500)
  }, [id, setNodeExecutionState])

  // Split parameters: select-type go to header, others go to body
  const allParams: ParameterDefinition[] = definition.parameters ?? []
  const selectParams = allParams.filter(p => p.type === 'select')
  const bodyParams = allParams.filter(p => p.type !== 'select')

  // Derive instance label: count how many nodes of the same definition type precede this one
  const sameTypeNodes = nodes.filter(
    n => (n.data as GenericNodeData).definition?.id === definition.id
  )
  const instanceIndex = sameTypeNodes.findIndex(n => n.id === id)
  const instanceNumber = instanceIndex >= 0 ? instanceIndex + 1 : 1
  const instanceLabel = `${definition.name} ${instanceNumber}`

  const nodeWidth = definition.width ?? DEFAULT_WIDTH
  const borderClass = selected ? 'border-node-selected' : 'border-node-border'

  return (
    // Outer wrapper: relative so the instance label can be absolutely positioned above
    <div className="relative" style={{ width: nodeWidth }}>
      {/* Instance label above the card */}
      <div
        className="absolute -top-5 left-0 text-[10px] text-gray-500 select-none truncate max-w-full"
        aria-label={`Node instance: ${instanceLabel}`}
      >
        {instanceLabel}
      </div>

      {/* Node card */}
      <div
        className={`node-card ${borderClass} flex flex-col overflow-hidden`}
        data-testid={`generic-node-${definition.id}`}
      >
        <NodeHeader
          name={definition.name}
          executionState={runtime.executionState as NodeExecutionState}
          selectParams={selectParams}
          paramValues={runtime.paramValues}
          onParamChange={(paramId, val) => setNodeParamValue(id, paramId, val)}
        />

        {(definition.inputs.length > 0 || definition.outputs.length > 0) && (
          <PortLabels inputs={definition.inputs} outputs={definition.outputs} />
        )}

        <NodeParameters
          nodeId={id}
          bodyParams={bodyParams}
          paramValues={runtime.paramValues}
        />

        <NodeImagePreview
          outputs={definition.outputs}
          imagePreviews={runtime.imagePreviews}
        />

        {/* Bottom bar: run button aligned to the right */}
        <div className="flex justify-end px-2 py-1 border-t border-node-border">
          <RunButton
            onRun={handleRun}
            disabled={runtime.executionState === 'running'}
          />
        </div>

        <NodeHandles
          ports={definition.inputs}
          position={Position.Left}
          handleType="target"
        />
        <NodeHandles
          ports={definition.outputs}
          position={Position.Right}
          handleType="source"
        />
      </div>
    </div>
  )
}

/** Memoized generic node component for React Flow. */
const GenericNode = memo(GenericNodeInner)
export default GenericNode
