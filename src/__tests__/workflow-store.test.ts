/**
 * Tests for the workflow Zustand store.
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { useWorkflowStore } from '../renderer/src/store/workflow-store'

describe('useWorkflowStore', () => {
  beforeEach(() => {
    useWorkflowStore.setState({
      isDirty: false,
      currentFilePath: null,
      workflowName: 'Untitled',
      recentFiles: []
    })
  })

  // Happy path: default state
  it('initializes with expected defaults', () => {
    const state = useWorkflowStore.getState()
    expect(state.isDirty).toBe(false)
    expect(state.currentFilePath).toBeNull()
    expect(state.workflowName).toBe('Untitled')
    expect(state.recentFiles).toEqual([])
  })

  // Happy path: setDirty marks as dirty
  it('setDirty(true) marks workflow as dirty', () => {
    useWorkflowStore.getState().setDirty(true)
    expect(useWorkflowStore.getState().isDirty).toBe(true)
  })

  // Happy path: onSaved clears dirty and sets path
  it('onSaved clears dirty flag and sets file path', () => {
    useWorkflowStore.getState().setDirty(true)
    useWorkflowStore.getState().onSaved('/path/to/file.nodegen', 'my-workflow')
    const state = useWorkflowStore.getState()
    expect(state.isDirty).toBe(false)
    expect(state.currentFilePath).toBe('/path/to/file.nodegen')
    expect(state.workflowName).toBe('my-workflow')
  })

  // Edge case 1: resetToNew clears all state
  it('resetToNew resets to initial state', () => {
    useWorkflowStore.getState().onSaved('/path/file.nodegen', 'some-workflow')
    useWorkflowStore.getState().setDirty(true)
    useWorkflowStore.getState().resetToNew()
    const state = useWorkflowStore.getState()
    expect(state.isDirty).toBe(false)
    expect(state.currentFilePath).toBeNull()
    expect(state.workflowName).toBe('Untitled')
  })

  // Edge case 2: setDirty(false) after setDirty(true) clears dirty
  it('setDirty(false) clears dirty flag', () => {
    useWorkflowStore.getState().setDirty(true)
    useWorkflowStore.getState().setDirty(false)
    expect(useWorkflowStore.getState().isDirty).toBe(false)
  })

  // Edge case 3: setWorkflowName updates name without affecting other state
  it('setWorkflowName only updates the name', () => {
    useWorkflowStore.getState().setDirty(true)
    useWorkflowStore.getState().setWorkflowName('new-name')
    const state = useWorkflowStore.getState()
    expect(state.workflowName).toBe('new-name')
    expect(state.isDirty).toBe(true)
  })

  // Edge case 4: setRecentFiles stores entries
  it('setRecentFiles replaces the recent files list', () => {
    const files = [
      { filePath: '/a.nodegen', name: 'a', openedAt: '2026-01-01T00:00:00Z' },
      { filePath: '/b.nodegen', name: 'b', openedAt: '2026-01-02T00:00:00Z' }
    ]
    useWorkflowStore.getState().setRecentFiles(files)
    expect(useWorkflowStore.getState().recentFiles).toEqual(files)
  })
})
