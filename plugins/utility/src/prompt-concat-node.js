'use strict'

/**
 * Prompt Concatenator node — joins multiple TEXT inputs with a configurable separator.
 * Supports 2-5 inputs; unconnected inputs are ignored.
 * Outputs a single TEXT value.
 *
 * @type {import('../../../src/shared/types').NodeDefinition}
 */
const promptConcatNode = {
  id: 'utility.prompt-concat',
  name: 'Prompt Concatenator',
  category: 'Utility',
  description: 'Joins multiple text inputs with a configurable separator.',
  inputs: [
    { id: 'text1', label: 'Text 1', type: 'TEXT' },
    { id: 'text2', label: 'Text 2', type: 'TEXT' },
    { id: 'text3', label: 'Text 3', type: 'TEXT' },
    { id: 'text4', label: 'Text 4', type: 'TEXT' },
    { id: 'text5', label: 'Text 5', type: 'TEXT' }
  ],
  outputs: [
    { id: 'text', label: 'Text', type: 'TEXT' }
  ],
  parameters: [
    {
      id: 'separator',
      label: 'Separator',
      type: 'text',
      default: ', '
    }
  ],
  width: 280,

  execute(inputs, _context) {
    const separator = typeof inputs['separator'] === 'string'
      ? inputs['separator']
      : ', '

    const parts = collectTextParts(inputs)
    const text = parts.join(separator)
    return { text }
  }
}

/**
 * Collect non-empty text parts from the numbered text inputs.
 * @param {Record<string, unknown>} inputs
 * @returns {string[]}
 */
function collectTextParts(inputs) {
  const parts = []
  for (let i = 1; i <= 5; i++) {
    const raw = inputs[`text${i}`]
    if (raw !== undefined && raw !== null && raw !== '') {
      parts.push(String(raw))
    }
  }
  return parts
}

module.exports = promptConcatNode
