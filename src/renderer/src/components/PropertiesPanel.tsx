import React, { useCallback } from 'react'
import { useFlowStore } from '../store/flow-store'
import type { NodeDefinition, ParameterDefinition } from '../../../shared/types'
import ParameterWidget from './widgets/ParameterWidget'
import type { GenericNodeData } from './nodes/GenericNode'

/** Displayed when no node is selected. */
function EmptyState(): React.JSX.Element {
  return (
    <p
      className="text-xs text-gray-500 text-center mt-6 px-3"
      data-testid="properties-empty"
    >
      Select a node to edit properties
    </p>
  )
}

/** Header showing node name and category. */
function NodeInfo({ definition }: { definition: NodeDefinition }): React.JSX.Element {
  return (
    <div
      className="px-3 py-3 border-b border-canvas-border"
      data-testid="properties-node-info"
    >
      <p className="text-sm font-semibold text-white truncate">{definition.name}</p>
      <p className="text-[10px] text-gray-500 mt-0.5">{definition.category}</p>
      {definition.description && (
        <p className="text-[10px] text-gray-400 mt-1 leading-relaxed">
          {definition.description}
        </p>
      )}
    </div>
  )
}

/** Port summary row. */
function PortSummary({ definition }: { definition: NodeDefinition }): React.JSX.Element {
  const { inputs, outputs } = definition
  if (inputs.length === 0 && outputs.length === 0) return <></>

  return (
    <div className="px-3 py-2 border-b border-canvas-border">
      <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
        Ports
      </p>
      <div className="flex gap-4">
        <span className="text-[10px] text-gray-400">In: {inputs.length}</span>
        <span className="text-[10px] text-gray-400">Out: {outputs.length}</span>
      </div>
    </div>
  )
}

interface ParameterFormProps {
  nodeId: string
  params: ParameterDefinition[]
  paramValues: Record<string, unknown>
}

/** Renders parameter form for the selected node. */
function ParameterForm({
  nodeId,
  params,
  paramValues
}: ParameterFormProps): React.JSX.Element {
  const { setNodeParamValue } = useFlowStore()

  const handleChange = useCallback(
    (paramId: string, value: unknown) => {
      setNodeParamValue(nodeId, paramId, value)
    },
    [nodeId, setNodeParamValue]
  )

  if (params.length === 0) {
    return (
      <p
        className="text-xs text-gray-500 text-center py-4 px-3"
        data-testid="properties-no-params"
      >
        This node has no parameters.
      </p>
    )
  }

  return (
    <div className="px-3 py-3 flex flex-col gap-3" data-testid="properties-param-form">
      <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
        Parameters
      </p>
      {params.map(param => (
        <ParameterWidget
          key={param.id}
          param={param}
          value={paramValues[param.id] ?? param.default}
          onChange={val => handleChange(param.id, val)}
        />
      ))}
    </div>
  )
}

/**
 * Right sidebar properties panel.
 * Shows the selected node's parameters as an editable form.
 * Displays an empty state when no node is selected.
 */
export default function PropertiesPanel(): React.JSX.Element {
  const { selectedNodeId, nodes, nodeRuntimeStates, getOrCreateNodeRuntime } =
    useFlowStore()

  const selectedNode = selectedNodeId
    ? nodes.find(n => n.id === selectedNodeId)
    : null

  // Retrieve the definition from the node's data if it's a generic node
  const definition: NodeDefinition | null = selectedNode
    ? ((selectedNode.data as GenericNodeData)?.definition ?? null)
    : null

  const runtime = selectedNodeId ? getOrCreateNodeRuntime(selectedNodeId) : null
  const paramValues = runtime?.paramValues ?? {}

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-3 py-2 border-b border-canvas-border shrink-0">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Properties
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto">
        {!selectedNode || !definition ? (
          <EmptyState />
        ) : (
          <>
            <NodeInfo definition={definition} />
            <PortSummary definition={definition} />
            <ParameterForm
              nodeId={selectedNode.id}
              params={definition.parameters ?? []}
              paramValues={paramValues}
            />
          </>
        )}
      </div>
    </div>
  )
}
