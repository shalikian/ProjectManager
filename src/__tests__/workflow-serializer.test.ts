/**
 * Tests for workflow serialization utilities.
 */
import { describe, it, expect } from 'vitest'
import {
  validateWorkflowFile,
  findUnknownNodeTypes,
  nameFromFilePath
} from '../renderer/src/utils/workflow-serializer'
import type { WorkflowFile } from '../shared/workflow-types'
import { WORKFLOW_FORMAT_VERSION } from '../shared/workflow-types'

// ─── validateWorkflowFile ─────────────────────────────────────────────────────

describe('validateWorkflowFile', () => {
  // Happy path: valid workflow passes validation
  it('returns null for a valid workflow file', () => {
    const workflow: WorkflowFile = {
      version: WORKFLOW_FORMAT_VERSION,
      metadata: { name: 'Test', created: new Date().toISOString(), modified: new Date().toISOString() },
      nodes: [],
      edges: [],
      viewport: { x: 0, y: 0, zoom: 1 }
    }
    expect(validateWorkflowFile(workflow)).toBeNull()
  })

  // Edge case 1: null input
  it('returns error for null input', () => {
    expect(validateWorkflowFile(null)).toBe('Workflow file is not a valid JSON object')
  })

  // Edge case 2: non-object
  it('returns error for a string input', () => {
    expect(validateWorkflowFile('invalid')).toBe('Workflow file is not a valid JSON object')
  })

  // Edge case 3: missing version field
  it('returns error when version is missing', () => {
    const workflow = {
      metadata: { name: 'Test', created: '', modified: '' },
      nodes: [],
      edges: [],
      viewport: { x: 0, y: 0, zoom: 1 }
    }
    expect(validateWorkflowFile(workflow)).toBe('Missing or invalid version field')
  })

  // Edge case 4: missing nodes array
  it('returns error when nodes is not an array', () => {
    const workflow = {
      version: '1.0.0',
      metadata: { name: 'Test', created: '', modified: '' },
      nodes: 'bad',
      edges: [],
      viewport: { x: 0, y: 0, zoom: 1 }
    }
    expect(validateWorkflowFile(workflow)).toBe('Missing or invalid nodes array')
  })

  // Edge case 5: missing edges array
  it('returns error when edges is not an array', () => {
    const workflow = {
      version: '1.0.0',
      metadata: { name: 'Test', created: '', modified: '' },
      nodes: [],
      edges: null,
      viewport: { x: 0, y: 0, zoom: 1 }
    }
    expect(validateWorkflowFile(workflow)).toBe('Missing or invalid edges array')
  })

  // Edge case 6: missing metadata
  it('returns error when metadata is missing', () => {
    const workflow = {
      version: '1.0.0',
      nodes: [],
      edges: [],
      viewport: { x: 0, y: 0, zoom: 1 }
    }
    expect(validateWorkflowFile(workflow)).toBe('Missing or invalid metadata field')
  })
})

// ─── findUnknownNodeTypes ─────────────────────────────────────────────────────

describe('findUnknownNodeTypes', () => {
  const makeWorkflow = (types: string[]): WorkflowFile => ({
    version: WORKFLOW_FORMAT_VERSION,
    metadata: { name: 'W', created: '', modified: '' },
    nodes: types.map((t, i) => ({
      id: `n${i}`,
      type: t,
      position: { x: 0, y: 0 },
      data: {},
      paramValues: {}
    })),
    edges: [],
    viewport: { x: 0, y: 0, zoom: 1 }
  })

  // Happy path: all types known
  it('returns empty array when all node types are known', () => {
    const workflow = makeWorkflow(['imageSource', 'filter', 'output'])
    const known = new Set(['imageSource', 'filter', 'output'])
    expect(findUnknownNodeTypes(workflow, known)).toEqual([])
  })

  // Edge case 1: one unknown type
  it('returns unknown type ids', () => {
    const workflow = makeWorkflow(['imageSource', 'unknownPlugin'])
    const known = new Set(['imageSource', 'filter', 'output'])
    const result = findUnknownNodeTypes(workflow, known)
    expect(result).toContain('unknownPlugin')
    expect(result).toHaveLength(1)
  })

  // Edge case 2: all nodes unknown
  it('returns all types when none are known', () => {
    const workflow = makeWorkflow(['pluginA', 'pluginB'])
    const result = findUnknownNodeTypes(workflow, new Set())
    expect(result).toContain('pluginA')
    expect(result).toContain('pluginB')
  })

  // Edge case 3: duplicate unknown types reported once
  it('deduplicates unknown types', () => {
    const workflow = makeWorkflow(['mystery', 'mystery', 'mystery'])
    const result = findUnknownNodeTypes(workflow, new Set())
    expect(result).toHaveLength(1)
    expect(result[0]).toBe('mystery')
  })
})

// ─── nameFromFilePath ─────────────────────────────────────────────────────────

describe('nameFromFilePath', () => {
  // Happy path: Unix path with .nodegen extension
  it('strips .nodegen extension on Unix path', () => {
    expect(nameFromFilePath('/home/user/projects/my-workflow.nodegen')).toBe('my-workflow')
  })

  // Edge case 1: Windows path
  it('strips .nodegen extension on Windows path', () => {
    expect(nameFromFilePath('C:\\Users\\dave\\workflows\\test.nodegen')).toBe('test')
  })

  // Edge case 2: no extension
  it('returns base name unchanged when no extension', () => {
    expect(nameFromFilePath('/path/to/workflow')).toBe('workflow')
  })

  // Edge case 3: different extension is preserved
  it('does not strip non-nodegen extensions', () => {
    expect(nameFromFilePath('/path/to/file.json')).toBe('file.json')
  })
})
