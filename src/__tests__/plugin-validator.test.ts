import { describe, it, expect } from 'vitest'
import { validateNodeDefinition } from '../main/plugins/plugin-validator'
import type { NodeDefinition } from '../shared/types'

const validDef: NodeDefinition = {
  id: 'test/my-node',
  name: 'My Node',
  category: 'test',
  inputs: [{ id: 'in1', label: 'Input', type: 'image' }],
  outputs: [{ id: 'out1', label: 'Output', type: 'image' }],
  execute: async (_inputs) => ({})
}

describe('validateNodeDefinition', () => {
  // Happy path: a fully valid definition returns null
  it('returns null for a valid NodeDefinition', () => {
    expect(validateNodeDefinition(validDef)).toBeNull()
  })

  // Edge case 1: null / non-object input
  it('rejects null', () => {
    expect(validateNodeDefinition(null)).not.toBeNull()
  })

  it('rejects a plain string', () => {
    expect(validateNodeDefinition('not-an-object')).not.toBeNull()
  })

  // Edge case 2: missing required field — execute
  it('rejects definition missing "execute"', () => {
    const bad = { ...validDef, execute: undefined }
    const result = validateNodeDefinition(bad)
    expect(result).not.toBeNull()
    expect(result).toContain('execute')
  })

  // Edge case 3: missing required field — id
  it('rejects definition missing "id"', () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id: _id, ...bad } = validDef
    const result = validateNodeDefinition(bad)
    expect(result).not.toBeNull()
    expect(result).toContain('id')
  })

  // Edge case 4: execute present but not a function
  it('rejects definition where "execute" is not a function', () => {
    const bad = { ...validDef, execute: 'not-a-function' }
    const result = validateNodeDefinition(bad)
    expect(result).not.toBeNull()
  })

  // Edge case 5: inputs is not an array
  it('rejects definition where "inputs" is not an array', () => {
    const bad = { ...validDef, inputs: {} }
    const result = validateNodeDefinition(bad)
    expect(result).not.toBeNull()
  })

  // Edge case 6: outputs is not an array
  it('rejects definition where "outputs" is not an array', () => {
    const bad = { ...validDef, outputs: 'nope' }
    const result = validateNodeDefinition(bad)
    expect(result).not.toBeNull()
  })
})
