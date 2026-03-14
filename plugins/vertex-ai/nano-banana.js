'use strict'

const { requireApiKey, base64ToBuffer, reportProgress, checkAbort, formatApiError } = require('./helpers')

// Model selector options — use current Gemini API model IDs
const MODEL_OPTIONS = [
  { value: 'gemini-2.0-flash-exp', label: 'Nano Banana (Flash)' },
  { value: 'gemini-2.0-flash', label: 'Nano Banana (Flash Stable)' },
  { value: 'gemini-2.5-flash-preview-04-17', label: 'Nano Banana (2.5 Flash)' }
]

const ASPECT_RATIO_OPTIONS = [
  { value: '1:1', label: '1:1 Square' },
  { value: '16:9', label: '16:9 Landscape' },
  { value: '9:16', label: '9:16 Portrait' },
  { value: '4:3', label: '4:3 Standard' },
  { value: '3:4', label: '3:4 Portrait' }
]

/**
 * Build the request parts array for generateContent.
 * @param {string} prompt
 * @param {Buffer|undefined} imageBuffer
 * @returns {Array<object>}
 */
function buildParts(prompt, imageBuffer) {
  const parts = [{ text: prompt }]
  if (imageBuffer) {
    parts.push({
      inlineData: {
        mimeType: 'image/png',
        data: imageBuffer.toString('base64')
      }
    })
  }
  return parts
}

/**
 * Extract image buffer and text from generateContent response.
 * @param {object} response
 * @returns {{ imageBuffer: Buffer|null, responseText: string }}
 */
function extractResponse(response) {
  let imageBuffer = null
  let responseText = ''

  const candidates = response.candidates || []
  for (const candidate of candidates) {
    const parts = (candidate.content && candidate.content.parts) || []
    for (const part of parts) {
      if (part.text) {
        responseText = part.text
      }
      if (part.inlineData && part.inlineData.data) {
        imageBuffer = base64ToBuffer(part.inlineData.data)
      }
    }
  }

  return { imageBuffer, responseText }
}

/**
 * Create a GoogleGenAI client. Accepts factory for testability.
 * @param {string} apiKey
 * @param {Function} [GenAIClass] - injectable for testing
 * @returns {object}
 */
function createGenAIClient(apiKey, GenAIClass) {
  const Cls = GenAIClass || require('@google/genai').GoogleGenAI
  return new Cls({ apiKey })
}

/**
 * Core execute logic, accepting an optional genai client for testing.
 * @param {Record<string, unknown>} inputs
 * @param {object|undefined} context
 * @param {object|undefined} genaiClient - injectable for testing
 * @returns {Promise<Record<string, unknown>>}
 */
async function executeCore(inputs, context, genaiClient) {
  checkAbort(context)
  const apiKey = requireApiKey(context)

  const prompt = (inputs['prompt'] || '') + ''
  if (!prompt.trim()) {
    throw new Error('Prompt is required')
  }

  const modelId = (inputs['model'] || MODEL_OPTIONS[0].value) + ''
  const sampleCount = Number(inputs['sampleCount'] || 1)
  const imageInput = inputs['image']

  reportProgress(context, 10, 'Initialising Nano Banana client...')
  checkAbort(context)

  const client = genaiClient || createGenAIClient(apiKey)

  let imageBuffer
  if (imageInput instanceof Buffer) {
    imageBuffer = imageInput
  }

  const parts = buildParts(prompt, imageBuffer)

  reportProgress(context, 30, 'Sending request to Nano Banana...')
  checkAbort(context)

  let response
  try {
    response = await client.models.generateContent({
      model: modelId,
      contents: [{ parts }],
      generationConfig: {
        responseModalities: ['TEXT', 'IMAGE'],
        numberOfImages: sampleCount
      }
    })
  } catch (err) {
    throw new Error('Nano Banana API error: ' + formatApiError(err))
  }

  checkAbort(context)
  reportProgress(context, 80, 'Processing response...')

  const { imageBuffer: outImage, responseText } = extractResponse(response)

  reportProgress(context, 100, 'Done')

  return {
    image: outImage,
    text: responseText
  }
}

/**
 * Public execute function (uses real SDK).
 * @param {Record<string, unknown>} inputs
 * @param {object|undefined} context
 * @returns {Promise<Record<string, unknown>>}
 */
async function execute(inputs, context) {
  return executeCore(inputs, context, undefined)
}

/** @type {import('../../src/shared/types').NodeDefinition} */
const nanoBananaNode = {
  id: 'vertex.nano-banana',
  name: 'Nano Banana',
  category: 'Google/Image Generation',
  description: 'Generate or edit images using Gemini Nano Banana via the generateContent API',
  inputs: [
    { id: 'prompt', label: 'Prompt', type: 'TEXT' },
    { id: 'image', label: 'Reference Image', type: 'IMAGE' }
  ],
  outputs: [
    { id: 'image', label: 'Generated Image', type: 'IMAGE' },
    { id: 'text', label: 'Response Text', type: 'TEXT' }
  ],
  parameters: [
    {
      id: 'model',
      label: 'Model',
      type: 'select',
      default: MODEL_OPTIONS[0].value,
      options: MODEL_OPTIONS
    },
    {
      id: 'aspectRatio',
      label: 'Aspect Ratio',
      type: 'select',
      default: '1:1',
      options: ASPECT_RATIO_OPTIONS
    },
    {
      id: 'sampleCount',
      label: 'Number of Images',
      type: 'slider',
      default: 1,
      min: 1,
      max: 4,
      step: 1
    }
  ],
  execute,
  // Exported for testing only
  _executeCore: executeCore,
  _buildParts: buildParts,
  _extractResponse: extractResponse
}

module.exports = nanoBananaNode
