/**
 * Tests for the utility nodes plugin pack.
 * Each node is tested against its execute function directly (no renderer needed).
 */
import { describe, it, expect } from 'vitest'
import { createRequire } from 'module'
import { join, resolve } from 'path'

// Resolve paths to the plugin files using Node CJS require
const pluginsDir = resolve(__dirname, '../../plugins/utility')
const req = createRequire(import.meta.url)

const textNode = req(join(pluginsDir, 'src/text-node.js'))
const numberNode = req(join(pluginsDir, 'src/number-node.js'))
const toggleNode = req(join(pluginsDir, 'src/toggle-node.js'))
const imagePreviewNode = req(join(pluginsDir, 'src/image-preview-node.js'))
const promptConcatNode = req(join(pluginsDir, 'src/prompt-concat-node.js'))
const utilityIndex = req(join(pluginsDir, 'index.js'))

// ─── Structural / metadata tests ────────────────────────────────────────────

describe('utility plugin index', () => {
  it('exports an array of 5 node definitions', () => {
    expect(Array.isArray(utilityIndex)).toBe(true)
    expect(utilityIndex).toHaveLength(5)
  })

  it('every exported definition has required fields', () => {
    for (const def of utilityIndex) {
      expect(def).toHaveProperty('id')
      expect(def).toHaveProperty('name')
      expect(def).toHaveProperty('category', 'Utility')
      expect(Array.isArray(def.inputs)).toBe(true)
      expect(Array.isArray(def.outputs)).toBe(true)
      expect(typeof def.execute).toBe('function')
    }
  })

  it('all node ids are namespaced under utility.*', () => {
    for (const def of utilityIndex) {
      expect(def.id).toMatch(/^utility\./)
    }
  })
})

// ─── Text node ───────────────────────────────────────────────────────────────

describe('utility.text node', () => {
  it('has correct id and category', () => {
    expect(textNode.id).toBe('utility.text')
    expect(textNode.category).toBe('Utility')
  })

  it('happy path: returns input text unchanged', async () => {
    const result = await textNode.execute({ text: 'hello world' })
    expect(result).toEqual({ text: 'hello world' })
  })

  it('returns empty string when text param is missing', async () => {
    const result = await textNode.execute({})
    expect(result).toEqual({ text: '' })
  })

  it('coerces non-string values to string', async () => {
    const result = await textNode.execute({ text: 42 })
    expect(result).toEqual({ text: '42' })
  })

  it('handles multi-line text correctly', async () => {
    const multiline = 'line one\nline two\nline three'
    const result = await textNode.execute({ text: multiline })
    expect(result).toEqual({ text: multiline })
  })

  it('has a textarea parameter named "text"', () => {
    const param = textNode.parameters.find((p: { id: string }) => p.id === 'text')
    expect(param).toBeDefined()
    expect(param.type).toBe('textarea')
  })

  it('has a TEXT output port', () => {
    const out = textNode.outputs.find((o: { id: string }) => o.id === 'text')
    expect(out).toBeDefined()
    expect(out.type).toBe('TEXT')
  })
})

// ─── Number node ─────────────────────────────────────────────────────────────

describe('utility.number node', () => {
  it('has correct id and category', () => {
    expect(numberNode.id).toBe('utility.number')
    expect(numberNode.category).toBe('Utility')
  })

  it('happy path: returns numeric value', async () => {
    const result = await numberNode.execute({ value: 42 })
    expect(result).toEqual({ value: 42 })
  })

  it('coerces string numbers to numeric', async () => {
    const result = await numberNode.execute({ value: '3.14' })
    expect(result).toEqual({ value: 3.14 })
  })

  it('defaults to 0 when value is missing', async () => {
    const result = await numberNode.execute({})
    expect(result).toEqual({ value: 0 })
  })

  it('replaces NaN with 0', async () => {
    const result = await numberNode.execute({ value: NaN })
    expect(result).toEqual({ value: 0 })
  })

  it('has a slider parameter with min/max/step', () => {
    const param = numberNode.parameters.find((p: { id: string }) => p.id === 'value')
    expect(param).toBeDefined()
    expect(param.type).toBe('slider')
    expect(typeof param.min).toBe('number')
    expect(typeof param.max).toBe('number')
    expect(typeof param.step).toBe('number')
  })

  it('has a NUMBER output port', () => {
    const out = numberNode.outputs.find((o: { id: string }) => o.id === 'value')
    expect(out).toBeDefined()
    expect(out.type).toBe('NUMBER')
  })
})

// ─── Toggle node ──────────────────────────────────────────────────────────────

describe('utility.toggle node', () => {
  it('has correct id and category', () => {
    expect(toggleNode.id).toBe('utility.toggle')
    expect(toggleNode.category).toBe('Utility')
  })

  it('happy path: outputs 1 when enabled is true', async () => {
    const result = await toggleNode.execute({ enabled: true })
    expect(result).toEqual({ value: 1 })
  })

  it('outputs 0 when enabled is false', async () => {
    const result = await toggleNode.execute({ enabled: false })
    expect(result).toEqual({ value: 0 })
  })

  it('defaults to 0 when enabled is missing', async () => {
    const result = await toggleNode.execute({})
    expect(result).toEqual({ value: 0 })
  })

  it('coerces truthy non-boolean to 1', async () => {
    const result = await toggleNode.execute({ enabled: 1 })
    expect(result).toEqual({ value: 1 })
  })

  it('has a toggle parameter named "enabled"', () => {
    const param = toggleNode.parameters.find((p: { id: string }) => p.id === 'enabled')
    expect(param).toBeDefined()
    expect(param.type).toBe('toggle')
  })

  it('has a NUMBER output port', () => {
    const out = toggleNode.outputs.find((o: { id: string }) => o.id === 'value')
    expect(out).toBeDefined()
    expect(out.type).toBe('NUMBER')
  })
})

// ─── Image Preview node ───────────────────────────────────────────────────────

describe('utility.image-preview node', () => {
  it('has correct id and category', () => {
    expect(imagePreviewNode.id).toBe('utility.image-preview')
    expect(imagePreviewNode.category).toBe('Utility')
  })

  it('happy path: passes image through as output', async () => {
    const dataUrl = 'data:image/png;base64,abc123'
    const result = await imagePreviewNode.execute({ image: dataUrl })
    expect(result).toEqual({ image: dataUrl })
  })

  it('returns empty object when image input is null', async () => {
    const result = await imagePreviewNode.execute({ image: null })
    expect(result).toEqual({})
  })

  it('returns empty object when image input is not provided', async () => {
    const result = await imagePreviewNode.execute({})
    expect(result).toEqual({})
  })

  it('has an IMAGE input port', () => {
    const inp = imagePreviewNode.inputs.find((i: { id: string }) => i.id === 'image')
    expect(inp).toBeDefined()
    expect(inp.type).toBe('IMAGE')
  })

  it('has an IMAGE output port for canvas display', () => {
    const out = imagePreviewNode.outputs.find((o: { id: string }) => o.id === 'image')
    expect(out).toBeDefined()
    expect(out.type).toBe('IMAGE')
  })
})

// ─── Prompt Concatenator node ─────────────────────────────────────────────────

describe('utility.prompt-concat node', () => {
  it('has correct id and category', () => {
    expect(promptConcatNode.id).toBe('utility.prompt-concat')
    expect(promptConcatNode.category).toBe('Utility')
  })

  it('happy path: joins two text inputs with default separator', async () => {
    const result = await promptConcatNode.execute({
      text1: 'a beautiful sunset',
      text2: 'oil painting style',
      separator: ', '
    })
    expect(result).toEqual({ text: 'a beautiful sunset, oil painting style' })
  })

  it('joins five inputs with custom separator', async () => {
    const result = await promptConcatNode.execute({
      text1: 'a',
      text2: 'b',
      text3: 'c',
      text4: 'd',
      text5: 'e',
      separator: ' | '
    })
    expect(result).toEqual({ text: 'a | b | c | d | e' })
  })

  it('edge: only 1 input connected — outputs it unchanged', async () => {
    const result = await promptConcatNode.execute({
      text1: 'solo prompt',
      separator: ', '
    })
    expect(result).toEqual({ text: 'solo prompt' })
  })

  it('edge: skips missing / empty inputs', async () => {
    const result = await promptConcatNode.execute({
      text1: 'first',
      text3: 'third',
      separator: '-'
    })
    expect(result).toEqual({ text: 'first-third' })
  })

  it('edge: all inputs empty — outputs empty string', async () => {
    const result = await promptConcatNode.execute({ separator: ', ' })
    expect(result).toEqual({ text: '' })
  })

  it('uses ", " as default separator when not provided', async () => {
    const result = await promptConcatNode.execute({
      text1: 'x',
      text2: 'y'
    })
    expect(result).toEqual({ text: 'x, y' })
  })

  it('has 5 TEXT input ports', () => {
    expect(promptConcatNode.inputs).toHaveLength(5)
    for (const inp of promptConcatNode.inputs) {
      expect(inp.type).toBe('TEXT')
    }
  })

  it('has one TEXT output port', () => {
    expect(promptConcatNode.outputs).toHaveLength(1)
    expect(promptConcatNode.outputs[0].type).toBe('TEXT')
  })
})
