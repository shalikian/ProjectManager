import React from 'react'
import type { ParameterDefinition } from '../../../../shared/types'

interface NumberWidgetProps {
  param: ParameterDefinition
  value: unknown
  onChange: (value: number) => void
}

export default function NumberWidget({
  param,
  value,
  onChange
}: NumberWidgetProps): React.JSX.Element {
  const numValue = typeof value === 'number' ? value : Number(value ?? param.default ?? 0)

  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] text-gray-500 truncate">{param.label}</label>
      <input
        type="number"
        value={numValue}
        min={param.min}
        max={param.max}
        step={param.step ?? 1}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full bg-[#141414] border border-[#333333] rounded px-2 py-1
                   text-[11px] text-white focus:outline-none focus:border-[#89b4fa]
                   transition-colors duration-150 nodrag"
      />
    </div>
  )
}
