import React from 'react'
import type { NodeExecutionState } from '../../../../shared/types'

interface NodeHeaderProps {
  name: string
  category: string
  executionState: NodeExecutionState
  onRun: () => void
}

function StateIndicator({
  state
}: {
  state: NodeExecutionState
}): React.JSX.Element {
  if (state === 'running') {
    return (
      <span
        className="w-3 h-3 rounded-full bg-yellow-400 animate-pulse shrink-0"
        title="Running"
        aria-label="Running"
      />
    )
  }
  if (state === 'completed') {
    return (
      <span
        className="text-green-400 text-xs shrink-0"
        title="Completed"
        aria-label="Completed"
      >
        &#10003;
      </span>
    )
  }
  if (state === 'error') {
    return (
      <span
        className="text-red-400 text-xs shrink-0"
        title="Error"
        aria-label="Error"
      >
        &#x26A0;
      </span>
    )
  }
  return <span className="w-3 h-3 shrink-0" />
}

export default function NodeHeader({
  name,
  category,
  executionState,
  onRun
}: NodeHeaderProps): React.JSX.Element {
  return (
    <div className="node-header flex items-center gap-1 px-2 py-1.5">
      <span
        className="text-[10px] px-1 py-0.5 rounded bg-canvas-bg text-gray-400
                   border border-node-border shrink-0 truncate max-w-[60px]"
        title={category}
      >
        {category}
      </span>
      <span className="flex-1 text-xs font-medium text-white truncate" title={name}>
        {name}
      </span>
      <StateIndicator state={executionState} />
      <button
        onClick={onRun}
        disabled={executionState === 'running'}
        className="ml-1 px-1.5 py-0.5 text-[10px] rounded bg-blue-600 hover:bg-blue-500
                   disabled:opacity-50 disabled:cursor-not-allowed text-white shrink-0
                   nodrag transition-colors"
        title="Run this node"
        aria-label="Run node"
      >
        Run
      </button>
    </div>
  )
}
