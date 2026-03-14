import React from 'react'
import type { NodeExecutionState, ParameterDefinition, SelectOption } from '../../../../shared/types'

// ─── Constants ────────────────────────────────────────────────────────────────

/** Maximum number of select-type parameters shown as inline dropdowns. */
export const MAX_HEADER_DROPDOWNS = 3

// ─── StateIndicator ──────────────────────────────────────────────────────────

/**
 * A small colored dot indicating the current execution state of the node.
 * - idle: invisible placeholder dot
 * - running: pulsing yellow dot
 * - completed: static green dot
 * - error: static red dot
 */
function StateIndicator({ state }: { state: NodeExecutionState }): React.JSX.Element {
  if (state === 'running') {
    return (
      <span
        className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse shrink-0"
        title="Running"
        aria-label="Running"
      />
    )
  }
  if (state === 'completed') {
    return (
      <span
        className="w-2 h-2 rounded-full bg-green-400 shrink-0"
        title="Completed"
        aria-label="Completed"
      />
    )
  }
  if (state === 'error') {
    return (
      <span
        className="w-2 h-2 rounded-full bg-red-400 shrink-0"
        title="Error"
        aria-label="Error"
      />
    )
  }
  // idle — invisible placeholder to preserve layout
  return <span className="w-2 h-2 shrink-0" />
}

// ─── GearIcon ────────────────────────────────────────────────────────────────

/** A minimal gear/settings SVG icon (12×12). */
function GearIcon(): React.JSX.Element {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  )
}

// ─── HeaderDropdown ──────────────────────────────────────────────────────────

interface HeaderDropdownProps {
  param: ParameterDefinition
  value: unknown
  onChange: (value: unknown) => void
}

/** Compact inline select dropdown for a single parameter in the node header. */
function HeaderDropdown({ param, value, onChange }: HeaderDropdownProps): React.JSX.Element {
  const options: SelectOption[] = param.options ?? []
  const currentValue = (value ?? param.default ?? '') as string

  return (
    <select
      className="nodrag text-[10px] bg-canvas-bg text-gray-300 border border-node-border
                 rounded px-1 py-0 h-5 max-w-[90px] cursor-pointer
                 hover:border-gray-500 focus:outline-none focus:border-gray-400
                 transition-colors"
      value={currentValue}
      title={param.label}
      aria-label={param.label}
      onChange={e => onChange(e.target.value)}
    >
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  )
}

// ─── NodeHeader ───────────────────────────────────────────────────────────────

export interface NodeHeaderProps {
  name: string
  executionState: NodeExecutionState
  /** All select-type parameters to be rendered as inline dropdowns (max 3 shown). */
  selectParams: ParameterDefinition[]
  paramValues: Record<string, unknown>
  onParamChange: (paramId: string, value: unknown) => void
  /** Called when the settings gear icon is clicked. */
  onSettingsClick?: () => void
}

/**
 * Node header bar containing:
 *   - Execution state dot indicator
 *   - Node name as primary bold label
 *   - Up to MAX_HEADER_DROPDOWNS inline select dropdowns
 *   - Settings gear icon on the right
 *
 * The Run button is NOT in the header — it lives at the bottom of the node card.
 */
export default function NodeHeader({
  name,
  executionState,
  selectParams,
  paramValues,
  onParamChange,
  onSettingsClick
}: NodeHeaderProps): React.JSX.Element {
  const visibleParams = selectParams.slice(0, MAX_HEADER_DROPDOWNS)

  return (
    <div
      className="node-header flex items-center gap-1.5 px-2 border-b border-node-border"
      style={{ height: 30, minHeight: 30 }}
    >
      {/* Execution state dot */}
      <StateIndicator state={executionState} />

      {/* Node name — primary label */}
      <span
        className="text-[12px] font-bold text-white truncate shrink-0 max-w-[80px]"
        title={name}
      >
        {name}
      </span>

      {/* Inline select dropdowns */}
      <div className="flex items-center gap-1 flex-1 min-w-0">
        {visibleParams.map(param => (
          <HeaderDropdown
            key={param.id}
            param={param}
            value={paramValues[param.id]}
            onChange={val => onParamChange(param.id, val)}
          />
        ))}
      </div>

      {/* Settings gear icon */}
      <button
        className="nodrag shrink-0 text-gray-400 hover:text-gray-200 transition-colors
                   focus:outline-none p-0.5 rounded hover:bg-white/5"
        title="Node settings"
        aria-label="Node settings"
        onClick={onSettingsClick}
      >
        <GearIcon />
      </button>
    </div>
  )
}
