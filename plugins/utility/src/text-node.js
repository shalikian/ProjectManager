'use strict'

/**
 * Text node — provides an editable multi-line text area.
 * Outputs the text string on a TEXT port.
 *
 * @type {import('../../../src/shared/types').NodeDefinition}
 */
const textNode = {
  id: 'utility.text',
  name: 'Text',
  category: 'Utility',
  description: 'Editable text area. Outputs the text as a TEXT value.',
  inputs: [],
  outputs: [
    { id: 'text', label: 'Text', type: 'TEXT' }
  ],
  parameters: [
    {
      id: 'text',
      label: 'Text',
      type: 'textarea',
      default: ''
    }
  ],
  width: 280,

  execute(inputs, _context) {
    const text = typeof inputs['text'] === 'string'
      ? inputs['text']
      : String(inputs['text'] ?? '')
    return { text }
  }
}

module.exports = textNode
