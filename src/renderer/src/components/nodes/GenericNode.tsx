import React, { memo, useCallback } from 'react'
import { NodeProps, Position } from '@xyflow/react'
import type { NodeDefinition, NodeExecutionState } from '../../../../shared/types'
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

function NodeParameters({
  nodeId,
  definition,
  paramValues
}: {
  nodeId: string
  definition: NodeDefinition
  paramValues: Record<string, unknown>
}): React.JSX.Element {
  const { setNodeParamValue } = useFlowStore()
  const params = definition.parameters ?? []

  if (params.length === 0) return <></>

  return (
    <div className="flex flex-col gap-2 px-2 py-2 border-t border-node-border">
      {params.map(param => (
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

function GenericNodeInner({ id, data, selected }: NodeProps): React.JSX.Element {
  const { definition } = data as GenericNodeData
  const { setNodeExecutionState, getOrCreateNodeRuntime } = useFlowStore()
  const runtime = getOrCreateNodeRuntime(id)

  const handleRun = useCallback(() => {
    setNodeExecutionState(id, 'running')
    // Simulate async execution for now
    setTimeout(() => {
      setNodeExecutionState(id, 'completed')
    }, 1500)
  }, [id, setNodeExecutionState])

  const nodeWidth = definition.width ?? DEFAULT_WIDTH
  const borderClass = selected ? 'border-node-selected' : 'border-node-border'

  return (
    <div
      className={`node-card ${borderClass} flex flex-col overflow-hidden`}
      style={{ width: nodeWidth }}
      data-testid={`generic-node-${definition.id}`}
    >
      <NodeHeader
        name={definition.name}
        category={definition.category}
        executionState={runtime.executionState as NodeExecutionState}
        onRun={handleRun}
      />

      {(definition.inputs.length > 0 || definition.outputs.length > 0) && (
        <PortLabels inputs={definition.inputs} outputs={definition.outputs} />
      )}

      <NodeParameters
        nodeId={id}
        definition={definition}
        paramValues={runtime.paramValues}
      />

      <NodeImagePreview
        outputs={definition.outputs}
        imagePreviews={runtime.imagePreviews}
      />

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
  )
}

/** Memoized generic node component for React Flow. */
const GenericNode = memo(GenericNodeInner)
export default GenericNode
