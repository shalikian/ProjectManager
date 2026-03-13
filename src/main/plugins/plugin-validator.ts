import type { NodeDefinition } from '../../shared/types'

const REQUIRED_FIELDS: (keyof NodeDefinition)[] = [
  'id',
  'name',
  'category',
  'inputs',
  'outputs',
  'execute'
]

/**
 * Validate a candidate object against the NodeDefinition interface.
 * Returns an error message string if invalid, or null if valid.
 */
export function validateNodeDefinition(candidate: unknown): string | null {
  if (!candidate || typeof candidate !== 'object') {
    return 'Definition must be a non-null object'
  }

  const def = candidate as Record<string, unknown>

  for (const field of REQUIRED_FIELDS) {
    if (!(field in def) || def[field] === undefined || def[field] === null) {
      return `Missing required field: "${field}"`
    }
  }

  if (typeof def.execute !== 'function') {
    return '"execute" must be a function'
  }

  if (!Array.isArray(def.inputs)) {
    return '"inputs" must be an array'
  }

  if (!Array.isArray(def.outputs)) {
    return '"outputs" must be an array'
  }

  return null
}
