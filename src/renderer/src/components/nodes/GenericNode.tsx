import React, { memo, useCallback } from 'react'
import { NodeProps, Position } from '@xyflow/react'
import type { NodeDefinition, NodeExecutionState, ParameterDefinition, PortDefinition } from '../../../../shared/types'
import { useFlowStore } from '../../store/flow-store'
import { hasImageOutput, IMAGE_NODE_WIDTH, UTILITY_NODE_WIDTH } from '../../store/flow-node-factory'
import NodeHeader from './NodeHeader'
import NodeHandles from './NodeHandles'
import NodeImagePreview from './NodeImagePreview'
import ParameterWidget from '../widgets/ParameterWidget'

/** Data shape stored in the React Flow node's `data` field for generic nodes. */
export interface GenericNodeData {
  definition: NodeDefinition
  [key: string]: unknown
}

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

// ─── PortCountFooter ──────────────────────────────────────────────────────────

/**
 * Counts ports by type and renders small gray badges at the bottom of the node.
 * Example: "1 image  2 text"
 */
function PortCountFooter({
  inputs,
  outputs
}: {
  inputs: PortDefinition[]
  outputs: PortDefinition[]
}): React.JSX.Element {
  const allPorts = [...inputs, ...outputs]
  if (allPorts.length === 0) return <></>

  // Count occurrences of each port type across inputs + outputs
  const counts = new Map<string, number>()
  for (const port of allPorts) {
    const key = port.type.toLowerCase()
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }

  const badges = Array.from(counts.entries()).map(([type, count]) => (
    <span key={type} className="text-[9px] text-gray-600">
      {count} {type}
    </span>
  ))

  return (
    <div className="flex gap-2 px-3 py-1 border-t border-node-border">
      {badges}
    </div>
  )
}

// ─── GenericNodeInner ─────────────────────────────────────────────────────────

function GenericNodeInner({ id, data, selected }: NodeProps): React.JSX.Element {
  const definition = (data as GenericNodeData)?.definition
  const { setNodeExecutionState, setNodeParamValue, getOrCreateNodeRuntime, nodes } =
    useFlowStore()
  const runtime = getOrCreateNodeRuntime(id)

  // Fallback for nodes without a definition (e.g. loaded from old workflow files)
  if (!definition) {
    const label = (data as Record<string, unknown>)?.label ?? 'Unknown Node'
    return (
      <div
        className="bg-node-bg rounded-xl px-4 py-3 shadow-lg"
        style={{ border: selected ? '1px solid #89b4fa' : '1px solid #2a2a2a', minWidth: 160 }}
      >
        <span className="text-xs text-gray-400">{String(label)}</span>
      </div>
    )
  }

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

  // Width: explicit definition.width > IMAGE-aware default > utility default
  const nodeWidth =
    definition.width ?? (hasImageOutput(definition) ? IMAGE_NODE_WIDTH : UTILITY_NODE_WIDTH)

  // Border: selected nodes glow blue, others use the subtle dark border
  const borderStyle = selected
    ? { border: '1px solid #89b4fa', boxShadow: '0 0 0 2px rgba(137,180,250,0.25)' }
    : { border: '1px solid #2a2a2a' }

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

      {/* Node card: rounded-xl for ~12px border-radius, very subtle border */}
      <div
        className="bg-node-bg rounded-xl flex flex-col overflow-hidden shadow-lg"
        style={borderStyle}
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

        {/* Port count footer badges */}
        <PortCountFooter
          inputs={definition.inputs}
          outputs={definition.outputs}
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
