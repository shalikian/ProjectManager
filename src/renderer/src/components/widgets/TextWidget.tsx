import React from 'react'
import type { ParameterDefinition } from '../../../../shared/types'

interface TextWidgetProps {
  param: ParameterDefinition
  value: unknown
  onChange: (value: string) => void
}

export default function TextWidget({
  param,
  value,
  onChange
}: TextWidgetProps): React.JSX.Element {
  const strValue = typeof value === 'string' ? value : String(value ?? param.default ?? '')

  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] text-gray-500 truncate">{param.label}</label>
      <input
        type="text"
        value={strValue}
        onChange={e => onChange(e.target.value)}
        className="w-full bg-[#141414] border border-[#333333] rounded px-2 py-1
                   text-[11px] text-white focus:outline-none focus:border-[#89b4fa]
                   transition-colors duration-150 nodrag"
        placeholder={param.label}
      />
    </div>
  )
}
