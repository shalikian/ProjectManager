'use strict'

/**
 * Shared helpers for the Vertex AI plugin pack.
 */

/**
 * Retrieve the Google API key from context, throwing a user-friendly error
 * if it is not configured.
 * @param {object} context - ExecutionContext
 * @returns {string} apiKey
 */
function requireApiKey(context) {
  const apiKey = context && context.getSecret ? context.getSecret('GOOGLE_API_KEY') : undefined
  if (!apiKey) {
    throw new Error(
      'Configure Google credentials in Settings: GOOGLE_API_KEY is not set'
    )
  }
  return apiKey
}

/**
 * Convert a base64 string to a Buffer.
 * @param {string} b64 - base64 encoded string
 * @returns {Buffer}
 */
function base64ToBuffer(b64) {
  return Buffer.from(b64, 'base64')
}

/**
 * Safely report progress if context supports it.
 * @param {object|undefined} context
 * @param {number} percent
 * @param {string} [message]
 */
function reportProgress(context, percent, message) {
  if (context && typeof context.reportProgress === 'function') {
    context.reportProgress(percent, message)
  }
}

/**
 * Check if execution has been aborted and throw if so.
 * @param {object|undefined} context
 */
function checkAbort(context) {
  if (context && context.abortSignal && context.abortSignal.aborted) {
    throw new Error('Execution was cancelled')
  }
}

/**
 * Normalise an API error into a user-friendly message.
 * @param {unknown} err
 * @returns {string}
 */
function formatApiError(err) {
  if (!err) return 'Unknown error'
  if (typeof err === 'string') return err
  const e = /** @type {Record<string, unknown>} */ (err)
  if (e.message && typeof e.message === 'string') {
    // Safety filter detection
    if (
      e.message.includes('SAFETY') ||
      e.message.includes('safety') ||
      e.message.includes('blocked')
    ) {
      return 'Request was blocked by safety filters. Try a different prompt.'
    }
    return e.message
  }
  return String(err)
}

module.exports = { requireApiKey, base64ToBuffer, reportProgress, checkAbort, formatApiError }
