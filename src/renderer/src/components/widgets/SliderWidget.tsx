import React from 'react'
import type { ParameterDefinition } from '../../../../shared/types'

interface SliderWidgetProps {
  param: ParameterDefinition
  value: unknown
  onChange: (value: number) => void
}

export default function SliderWidget({
  param,
  value,
  onChange
}: SliderWidgetProps): React.JSX.Element {
  const min = param.min ?? 0
  const max = param.max ?? 100
  const step = param.step ?? 1
  const numValue = typeof value === 'number' ? value : Number(value ?? param.default ?? min)

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <label className="text-[10px] text-gray-500 truncate">{param.label}</label>
        <span className="text-[10px] text-[#89b4fa] ml-2 shrink-0 font-mono">{numValue}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={numValue}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-1 accent-[#89b4fa] nodrag cursor-pointer"
      />
    </div>
  )
}
