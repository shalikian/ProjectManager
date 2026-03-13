import React from 'react'
import type { ParameterDefinition } from '../../../../shared/types'

interface ToggleWidgetProps {
  param: ParameterDefinition
  value: unknown
  onChange: (value: boolean) => void
}

export default function ToggleWidget({
  param,
  value,
  onChange
}: ToggleWidgetProps): React.JSX.Element {
  const boolValue = typeof value === 'boolean' ? value : Boolean(value ?? param.default ?? false)

  return (
    <div className="flex items-center justify-between">
      <label className="text-[10px] text-gray-400 truncate">{param.label}</label>
      <button
        role="switch"
        aria-checked={boolValue}
        onClick={() => onChange(!boolValue)}
        className={`relative w-8 h-4 rounded-full transition-colors nodrag shrink-0
                    ${boolValue ? 'bg-blue-500' : 'bg-gray-600'}`}
      >
        <span
          className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform
                      ${boolValue ? 'translate-x-4' : 'translate-x-0.5'}`}
        />
      </button>
    </div>
  )
}
