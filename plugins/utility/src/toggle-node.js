'use strict'

/**
 * Toggle node — boolean on/off switch.
 * Outputs 1 (on) or 0 (off) on a NUMBER port.
 *
 * @type {import('../../../src/shared/types').NodeDefinition}
 */
const toggleNode = {
  id: 'utility.toggle',
  name: 'Toggle',
  category: 'Utility',
  description: 'Boolean switch. Outputs 1 when on, 0 when off.',
  inputs: [],
  outputs: [
    { id: 'value', label: 'Value', type: 'NUMBER' }
  ],
  parameters: [
    {
      id: 'enabled',
      label: 'Enabled',
      type: 'toggle',
      default: false
    }
  ],
  width: 240,

  execute(inputs, _context) {
    const raw = inputs['enabled']
    const enabled = typeof raw === 'boolean' ? raw : Boolean(raw ?? false)
    return { value: enabled ? 1 : 0 }
  }
}

module.exports = toggleNode
