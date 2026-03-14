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
      <label className="text-[10px] text-gray-500 truncate">{param.label}</label>
      <button
        role="switch"
        aria-checked={boolValue}
        onClick={() => onChange(!boolValue)}
        className={`relative w-8 h-4 rounded-full transition-colors duration-150 nodrag shrink-0
                    ${boolValue ? 'bg-[#89b4fa]' : 'bg-[#2a2a2a]'}`}
      >
        <span
          className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform duration-150
                      ${boolValue ? 'translate-x-4' : 'translate-x-0.5'}`}
        />
      </button>
    </div>
  )
}
