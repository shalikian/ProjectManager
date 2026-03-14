import React from 'react'
import type { ParameterDefinition } from '../../../../shared/types'

interface TextAreaWidgetProps {
  param: ParameterDefinition
  value: unknown
  onChange: (value: string) => void
}

export default function TextAreaWidget({
  param,
  value,
  onChange
}: TextAreaWidgetProps): React.JSX.Element {
  const strValue = typeof value === 'string' ? value : String(value ?? param.default ?? '')

  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] text-gray-500 truncate">{param.label}</label>
      <textarea
        value={strValue}
        onChange={e => onChange(e.target.value)}
        rows={3}
        className="w-full bg-[#141414] border border-[#333333] rounded p-3
                   text-[11px] text-white focus:outline-none focus:border-[#89b4fa]
                   transition-colors duration-150 resize-none leading-relaxed nodrag"
        placeholder={param.label}
      />
    </div>
  )
}
