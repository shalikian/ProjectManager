import React from 'react'
import type { ParameterDefinition } from '../../../../shared/types'
import TextWidget from './TextWidget'
import NumberWidget from './NumberWidget'
import SliderWidget from './SliderWidget'
import ToggleWidget from './ToggleWidget'
import SelectWidget from './SelectWidget'
import TextAreaWidget from './TextAreaWidget'

interface ParameterWidgetProps {
  param: ParameterDefinition
  value: unknown
  onChange: (value: unknown) => void
}

/**
 * Dispatches to the correct widget component based on parameter type.
 */
export default function ParameterWidget({
  param,
  value,
  onChange
}: ParameterWidgetProps): React.JSX.Element {
  switch (param.type) {
    case 'text':
      return <TextWidget param={param} value={value} onChange={onChange} />
    case 'number':
      return <NumberWidget param={param} value={value} onChange={onChange} />
    case 'slider':
      return <SliderWidget param={param} value={value} onChange={onChange} />
    case 'toggle':
      return <ToggleWidget param={param} value={value} onChange={v => onChange(v)} />
    case 'select':
      return <SelectWidget param={param} value={value} onChange={onChange} />
    case 'textarea':
      return <TextAreaWidget param={param} value={value} onChange={onChange} />
    default:
      return <TextWidget param={param} value={value} onChange={onChange} />
  }
}
