'use strict'

/**
 * Number node — provides a numeric input with optional slider mode.
 * Outputs the number on a NUMBER port.
 *
 * @type {import('../../../src/shared/types').NodeDefinition}
 */
const numberNode = {
  id: 'utility.number',
  name: 'Number',
  category: 'Utility',
  description: 'Numeric input with min/max/step constraints. Supports slider mode.',
  inputs: [],
  outputs: [
    { id: 'value', label: 'Value', type: 'NUMBER' }
  ],
  parameters: [
    {
      id: 'value',
      label: 'Value',
      type: 'slider',
      default: 0,
      min: 0,
      max: 100,
      step: 1
    }
  ],
  width: 280,

  execute(inputs, _context) {
    const raw = inputs['value']
    const value = typeof raw === 'number' ? raw : Number(raw ?? 0)
    const safeValue = Number.isFinite(value) ? value : 0
    return { value: safeValue }
  }
}

module.exports = numberNode
