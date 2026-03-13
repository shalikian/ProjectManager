import { describe, it, expect } from 'vitest'
import {
  PortType,
  PORT_TYPE_REGISTRY,
  isTypeCompatible
} from '../shared/types'
import type {
  NodeDefinition,
  PortDefinition,
  ParameterDefinition,
  ExecutionContext
} from '../shared/types'

// ---------------------------------------------------------------------------
// isTypeCompatible — happy path and edge cases
// ---------------------------------------------------------------------------

describe('isTypeCompatible', () => {
  // Happy path: identical types are always compatible
  it('returns true for identical concrete types', () => {
    expect(isTypeCompatible(PortType.IMAGE, PortType.IMAGE)).toBe(true)
    expect(isTypeCompatible(PortType.TEXT, PortType.TEXT)).toBe(true)
    expect(isTypeCompatible(PortType.NUMBER, PortType.NUMBER)).toBe(true)
    expect(isTypeCompatible(PortType.JSON, PortType.JSON)).toBe(true)
  })

  // Edge case 1: ANY source is compatible with every target
  it('returns true when source is ANY (ANY → all)', () => {
    expect(isTypeCompatible(PortType.ANY, PortType.IMAGE)).toBe(true)
    expect(isTypeCompatible(PortType.ANY, PortType.TEXT)).toBe(true)
    expect(isTypeCompatible(PortType.ANY, PortType.NUMBER)).toBe(true)
    expect(isTypeCompatible(PortType.ANY, PortType.JSON)).toBe(true)
    expect(isTypeCompatible(PortType.ANY, PortType.ANY)).toBe(true)
  })

  // Edge case 2: ANY target accepts every source
  it('returns true when target is ANY (all → ANY)', () => {
    expect(isTypeCompatible(PortType.IMAGE, PortType.ANY)).toBe(true)
    expect(isTypeCompatible(PortType.TEXT, PortType.ANY)).toBe(true)
    expect(isTypeCompatible(PortType.NUMBER, PortType.ANY)).toBe(true)
    expect(isTypeCompatible(PortType.JSON, PortType.ANY)).toBe(true)
  })

  // Edge case 3: mismatched concrete types are incompatible
  it('returns false for IMAGE → TEXT (strict type mismatch)', () => {
    expect(isTypeCompatible(PortType.IMAGE, PortType.TEXT)).toBe(false)
  })

  it('returns false for TEXT → NUMBER', () => {
    expect(isTypeCompatible(PortType.TEXT, PortType.NUMBER)).toBe(false)
  })

  it('returns false for NUMBER → JSON', () => {
    expect(isTypeCompatible(PortType.NUMBER, PortType.JSON)).toBe(false)
  })

  it('returns false for JSON → IMAGE', () => {
    expect(isTypeCompatible(PortType.JSON, PortType.IMAGE)).toBe(false)
  })

  it('returns false for IMAGE → NUMBER', () => {
    expect(isTypeCompatible(PortType.IMAGE, PortType.NUMBER)).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// PORT_TYPE_REGISTRY — registry completeness and color values
// ---------------------------------------------------------------------------

describe('PORT_TYPE_REGISTRY', () => {
  it('contains entries for all 5 PortType values', () => {
    const allTypes = Object.values(PortType)
    allTypes.forEach(type => {
      expect(PORT_TYPE_REGISTRY[type]).toBeDefined()
    })
  })

  it('has correct color hex codes', () => {
    expect(PORT_TYPE_REGISTRY[PortType.IMAGE].color).toBe('#64B5F6')
    expect(PORT_TYPE_REGISTRY[PortType.TEXT].color).toBe('#81C784')
    expect(PORT_TYPE_REGISTRY[PortType.NUMBER].color).toBe('#FFB74D')
    expect(PORT_TYPE_REGISTRY[PortType.JSON].color).toBe('#CE93D8')
    expect(PORT_TYPE_REGISTRY[PortType.ANY].color).toBe('#9E9E9E')
  })

  it('every entry has a non-empty label', () => {
    Object.values(PORT_TYPE_REGISTRY).forEach(meta => {
      expect(typeof meta.label).toBe('string')
      expect(meta.label.length).toBeGreaterThan(0)
    })
  })

  it('every color follows hex color format', () => {
    Object.values(PORT_TYPE_REGISTRY).forEach(meta => {
      expect(meta.color).toMatch(/^#[0-9A-Fa-f]{6}$/)
    })
  })
})

// ---------------------------------------------------------------------------
// PortDefinition — structural shape
// ---------------------------------------------------------------------------

describe('PortDefinition structural conformance', () => {
  it('accepts a valid input port definition', () => {
    const port: PortDefinition = {
      name: 'image_in',
      type: PortType.IMAGE,
      label: 'Input Image'
    }
    expect(port.name).toBe('image_in')
    expect(port.type).toBe(PortType.IMAGE)
    expect(port.defaultValue).toBeUndefined()
  })

  it('accepts a port definition with a default value', () => {
    const port: PortDefinition = {
      name: 'prompt',
      type: PortType.TEXT,
      label: 'Prompt',
      defaultValue: 'A beautiful landscape'
    }
    expect(port.defaultValue).toBe('A beautiful landscape')
  })
})

// ---------------------------------------------------------------------------
// ParameterDefinition — structural shape and constraints
// ---------------------------------------------------------------------------

describe('ParameterDefinition structural conformance', () => {
  it('accepts a slider parameter with min/max constraints', () => {
    const param: ParameterDefinition = {
      name: 'temperature',
      type: 'slider',
      label: 'Temperature',
      default: 0.7,
      constraints: { min: 0, max: 1, step: 0.01 }
    }
    expect(param.constraints?.min).toBe(0)
    expect(param.constraints?.max).toBe(1)
  })

  it('accepts a select parameter with options', () => {
    const param: ParameterDefinition = {
      name: 'model',
      type: 'select',
      label: 'Model',
      default: 'imagen-3',
      constraints: {
        options: [
          { value: 'imagen-3', label: 'Imagen 3' },
          { value: 'imagen-3-fast', label: 'Imagen 3 Fast' }
        ]
      }
    }
    expect(param.constraints?.options).toHaveLength(2)
  })

  it('accepts a boolean parameter without constraints', () => {
    const param: ParameterDefinition = {
      name: 'enhance',
      type: 'boolean',
      label: 'Enhance',
      default: false
    }
    expect(param.default).toBe(false)
    expect(param.constraints).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// NodeDefinition — structural shape and mandatory fields
// ---------------------------------------------------------------------------

describe('NodeDefinition structural conformance', () => {
  const mockContext: ExecutionContext = {
    reportProgress: () => {},
    getSecret: async () => undefined,
    abortSignal: new AbortController().signal,
    logger: {
      debug: () => {},
      info: () => {},
      warn: () => {},
      error: () => {}
    }
  }

  it('accepts a fully populated node definition', () => {
    const node: NodeDefinition = {
      id: 'test:my-node',
      version: '1.0.0',
      name: 'My Test Node',
      category: 'Utilities',
      inputs: [{ name: 'in', type: PortType.ANY, label: 'Input' }],
      outputs: [{ name: 'out', type: PortType.ANY, label: 'Output' }],
      parameters: [],
      execute: async (_inputs, _params, _ctx) => ({ out: null })
    }
    expect(node.id).toBe('test:my-node')
    expect(node.inputs).toHaveLength(1)
    expect(node.outputs).toHaveLength(1)
  })

  it('execute function receives correct arguments', async () => {
    const receivedArgs: unknown[] = []
    const node: NodeDefinition = {
      id: 'test:spy-node',
      version: '1.0.0',
      name: 'Spy Node',
      category: 'Test',
      inputs: [],
      outputs: [],
      parameters: [],
      execute: async (inputs, params, ctx) => {
        receivedArgs.push(inputs, params, ctx)
        return {}
      }
    }

    const inputs = { image: 'blob:data' }
    const params = { scale: 2 }
    await node.execute(inputs, params, mockContext)

    expect(receivedArgs[0]).toEqual(inputs)
    expect(receivedArgs[1]).toEqual(params)
    expect(receivedArgs[2]).toBe(mockContext)
  })

  it('execute function returns a promise resolving to a record', async () => {
    const node: NodeDefinition = {
      id: 'test:passthrough',
      version: '1.0.0',
      name: 'Passthrough',
      category: 'Test',
      inputs: [{ name: 'value', type: PortType.ANY, label: 'Value' }],
      outputs: [{ name: 'value', type: PortType.ANY, label: 'Value' }],
      parameters: [],
      execute: async (inputs) => ({ value: inputs['value'] })
    }

    const result = await node.execute({ value: 42 }, {}, mockContext)
    expect(result['value']).toBe(42)
  })

  it('customComponent is optional and defaults to undefined', () => {
    const node: NodeDefinition = {
      id: 'test:no-custom',
      version: '1.0.0',
      name: 'No Custom',
      category: 'Test',
      inputs: [],
      outputs: [],
      parameters: [],
      execute: async () => ({})
    }
    expect(node.customComponent).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// ExecutionContext — interface structure
// ---------------------------------------------------------------------------

describe('ExecutionContext structural conformance', () => {
  it('reportProgress can be called with progress and message', () => {
    const calls: Array<[number, string | undefined]> = []
    const ctx: ExecutionContext = {
      reportProgress: (p, msg) => calls.push([p, msg]),
      getSecret: async () => undefined,
      abortSignal: new AbortController().signal,
      logger: {
        debug: () => {},
        info: () => {},
        warn: () => {},
        error: () => {}
      }
    }

    ctx.reportProgress(0.5, 'halfway')
    expect(calls).toEqual([[0.5, 'halfway']])
  })

  it('getSecret returns undefined for unknown keys', async () => {
    const ctx: ExecutionContext = {
      reportProgress: () => {},
      getSecret: async (key) => (key === 'KNOWN' ? 'secret' : undefined),
      abortSignal: new AbortController().signal,
      logger: { debug: () => {}, info: () => {}, warn: () => {}, error: () => {} }
    }

    expect(await ctx.getSecret('UNKNOWN')).toBeUndefined()
    expect(await ctx.getSecret('KNOWN')).toBe('secret')
  })

  it('abortSignal reflects AbortController state', () => {
    const controller = new AbortController()
    const ctx: ExecutionContext = {
      reportProgress: () => {},
      getSecret: async () => undefined,
      abortSignal: controller.signal,
      logger: { debug: () => {}, info: () => {}, warn: () => {}, error: () => {} }
    }

    expect(ctx.abortSignal.aborted).toBe(false)
    controller.abort()
    expect(ctx.abortSignal.aborted).toBe(true)
  })
})
