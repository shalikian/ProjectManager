'use strict'

/**
 * Utility nodes plugin pack.
 *
 * Exports all 5 utility node definitions as an array so the PluginLoader
 * can discover and register each one individually.
 */

const textNode = require('./src/text-node')
const numberNode = require('./src/number-node')
const toggleNode = require('./src/toggle-node')
const imagePreviewNode = require('./src/image-preview-node')
const promptConcatNode = require('./src/prompt-concat-node')

module.exports = [
  textNode,
  numberNode,
  toggleNode,
  imagePreviewNode,
  promptConcatNode
]
