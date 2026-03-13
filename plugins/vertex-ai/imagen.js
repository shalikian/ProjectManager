'use strict'

const { requireApiKey, base64ToBuffer, reportProgress, checkAbort, formatApiError } = require('./helpers')

// Model options for Imagen 4
const IMAGEN_MODEL_OPTIONS = [
  { value: 'imagen-4.0-generate-preview-05-20', label: 'Imagen 4 Standard' },
  { value: 'imagen-4.0-fast-generate-preview-05-20', label: 'Imagen 4 Fast' },
  { value: 'imagen-4.0-ultra-generate-exp-05-20', label: 'Imagen 4 Ultra' }
]

const ASPECT_RATIO_OPTIONS = [
  { value: '1:1', label: '1:1 Square' },
  { value: '16:9', label: '16:9 Landscape' },
  { value: '9:16', label: '9:16 Portrait' },
  { value: '3:4', label: '3:4 Portrait' },
  { value: '4:3', label: '4:3 Standard' }
]

const SAFETY_FILTER_OPTIONS = [
  { value: 'block_low_and_above', label: 'Block Low and Above' },
  { value: 'block_medium_and_above', label: 'Block Medium and Above' },
  { value: 'block_only_high', label: 'Block Only High' }
]

const PERSON_GENERATION_OPTIONS = [
  { value: 'allow_adult', label: 'Allow Adults' },
  { value: 'allow_all', label: 'Allow All' },
  { value: 'dont_allow', label: 'Disallow' }
]

/**
 * Build the predict request body for Imagen.
 * @param {string} prompt
 * @param {Record<string, unknown>} inputs
 * @returns {{ instances: object[], parameters: object }}
 */
function buildImagenRequest(prompt, inputs) {
  const parameters = {
    sampleCount: Number(inputs['sampleCount'] || 1),
    aspectRatio: (inputs['aspectRatio'] || '1:1') + '',
    safetyFilterLevel: (inputs['safetyFilterLevel'] || 'block_medium_and_above') + '',
    personGeneration: (inputs['personGeneration'] || 'allow_adult') + ''
  }

  const negativePrompt = (inputs['negativePrompt'] || '') + ''
  if (negativePrompt.trim()) {
    // @ts-ignore
    parameters.negativePrompt = negativePrompt
  }

  const seed = inputs['seed']
  if (seed !== undefined && seed !== null && seed !== '') {
    // @ts-ignore
    parameters.seed = Number(seed)
  }

  return {
    instances: [{ prompt }],
    parameters
  }
}

/**
 * Extract image buffers from Imagen predict response.
 * @param {object} response
 * @returns {Buffer[]}
 */
function extractImageBuffers(response) {
  const predictions = (response && response.predictions) || []
  const buffers = []
  for (const pred of predictions) {
    const b64 = pred.bytesBase64Encoded || pred.imageBytes
    if (b64) {
      buffers.push(base64ToBuffer(b64))
    }
  }
  return buffers
}

/**
 * Call the Imagen predict endpoint.
 * Accepts an injectable predictFn for testability.
 * @param {string} apiKey
 * @param {string} modelId
 * @param {object} requestBody
 * @param {AbortSignal|undefined} abortSignal
 * @param {Function|undefined} predictFn - injectable for testing
 * @returns {Promise<object>}
 */
async function callPredict(apiKey, modelId, requestBody, abortSignal, predictFn) {
  if (predictFn) {
    return predictFn(requestBody)
  }

  const { PredictionServiceClient, helpers } = require('@google-cloud/aiplatform')

  const client = new PredictionServiceClient({
    apiEndpoint: 'us-central1-aiplatform.googleapis.com',
    authClient: {
      getRequestHeaders: async () => ({ Authorization: `Bearer ${apiKey}` })
    }
  })

  const endpoint = `publishers/google/models/${modelId}`
  const instanceValue = helpers.toValue(requestBody.instances[0])
  const paramValue = helpers.toValue(requestBody.parameters)

  const [response] = await client.predict(
    { endpoint, instances: [instanceValue], parameters: paramValue },
    { signal: abortSignal }
  )

  return response
}

/**
 * Core execute logic for testability.
 * @param {Record<string, unknown>} inputs
 * @param {object|undefined} context
 * @param {Function|undefined} predictFn - injectable for testing
 * @returns {Promise<Record<string, unknown>>}
 */
async function executeCore(inputs, context, predictFn) {
  checkAbort(context)
  const apiKey = requireApiKey(context)

  const prompt = (inputs['prompt'] || '') + ''
  if (!prompt.trim()) {
    throw new Error('Prompt is required')
  }

  const modelId = (inputs['model'] || IMAGEN_MODEL_OPTIONS[0].value) + ''

  reportProgress(context, 10, 'Preparing Imagen request...')
  checkAbort(context)

  const requestBody = buildImagenRequest(prompt, inputs)

  reportProgress(context, 30, 'Calling Imagen API...')
  checkAbort(context)

  const abortSignal = context && context.abortSignal

  let response
  try {
    response = await callPredict(apiKey, modelId, requestBody, abortSignal, predictFn)
  } catch (err) {
    const msg = formatApiError(err)
    if (msg.includes('safety') || msg.includes('blocked') || msg.includes('SAFETY')) {
      throw new Error('Request was blocked by safety filters. Try a different prompt.')
    }
    throw new Error('Imagen API error: ' + msg)
  }

  checkAbort(context)
  reportProgress(context, 80, 'Processing images...')

  const imageBuffers = extractImageBuffers(response)

  reportProgress(context, 100, 'Done')

  return {
    image: imageBuffers[0] || null,
    images: imageBuffers
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
const imagenNode = {
  id: 'vertex.imagen4',
  name: 'Imagen 4',
  category: 'Google/Image Generation',
  description: 'Generate images using Google Imagen 4 via the Vertex AI predict API',
  inputs: [
    { id: 'prompt', label: 'Prompt', type: 'TEXT' }
  ],
  outputs: [
    { id: 'image', label: 'Generated Image', type: 'IMAGE' },
    { id: 'images', label: 'All Images', type: 'IMAGE' }
  ],
  parameters: [
    {
      id: 'model',
      label: 'Model',
      type: 'select',
      default: IMAGEN_MODEL_OPTIONS[0].value,
      options: IMAGEN_MODEL_OPTIONS
    },
    {
      id: 'sampleCount',
      label: 'Sample Count',
      type: 'slider',
      default: 1,
      min: 1,
      max: 4,
      step: 1
    },
    {
      id: 'aspectRatio',
      label: 'Aspect Ratio',
      type: 'select',
      default: '1:1',
      options: ASPECT_RATIO_OPTIONS
    },
    {
      id: 'negativePrompt',
      label: 'Negative Prompt',
      type: 'textarea',
      default: ''
    },
    {
      id: 'seed',
      label: 'Seed',
      type: 'number',
      default: ''
    },
    {
      id: 'safetyFilterLevel',
      label: 'Safety Filter',
      type: 'select',
      default: 'block_medium_and_above',
      options: SAFETY_FILTER_OPTIONS
    },
    {
      id: 'personGeneration',
      label: 'Person Generation',
      type: 'select',
      default: 'allow_adult',
      options: PERSON_GENERATION_OPTIONS
    }
  ],
  execute,
  // Exported for testing only
  _executeCore: executeCore,
  _buildImagenRequest: buildImagenRequest,
  _extractImageBuffers: extractImageBuffers
}

module.exports = imagenNode
