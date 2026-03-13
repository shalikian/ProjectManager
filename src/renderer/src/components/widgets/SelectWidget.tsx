import React from 'react'
import type { ParameterDefinition } from '../../../../shared/types'

interface SelectWidgetProps {
  param: ParameterDefinition
  value: unknown
  onChange: (value: string) => void
}

export default function SelectWidget({
  param,
  value,
  onChange
}: SelectWidgetProps): React.JSX.Element {
  const strValue = typeof value === 'string' ? value : String(value ?? param.default ?? '')
  const options = param.options ?? []

  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] text-gray-400 truncate">{param.label}</label>
      <select
        value={strValue}
        onChange={e => onChange(e.target.value)}
        className="w-full bg-canvas-bg border border-node-border rounded px-2 py-1
                   text-xs text-white focus:outline-none focus:border-node-selected
                   nodrag"
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  )
}
