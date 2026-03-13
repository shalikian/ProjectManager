'use strict'

/**
 * Image Preview node — displays an IMAGE input inline on the canvas.
 * The image is passed through as an output so the canvas renderer can
 * show it via NodeImagePreview.  Downstream nodes may also use it.
 *
 * @type {import('../../../src/shared/types').NodeDefinition}
 */
const imagePreviewNode = {
  id: 'utility.image-preview',
  name: 'Image Preview',
  category: 'Utility',
  description: 'Displays an image inline on the canvas. Passes the image through as output.',
  inputs: [
    { id: 'image', label: 'Image', type: 'IMAGE' }
  ],
  outputs: [
    { id: 'image', label: 'Preview', type: 'IMAGE' }
  ],
  parameters: [],
  width: 300,

  execute(inputs, _context) {
    const image = inputs['image'] ?? null
    if (image === null) {
      return {}
    }
    return { image }
  }
}

module.exports = imagePreviewNode
