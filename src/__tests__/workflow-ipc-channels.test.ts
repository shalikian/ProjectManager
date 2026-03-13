/**
 * Tests for the workflow IPC channel constants.
 */
import { describe, it, expect } from 'vitest'
import { IPC_CHANNELS } from '../shared/ipc-channels'

describe('workflow IPC channels', () => {
  // Happy path: all workflow channel constants exist and are strings
  it('exports all workflow channel constants', () => {
    expect(typeof IPC_CHANNELS.WORKFLOW_SAVE).toBe('string')
    expect(typeof IPC_CHANNELS.WORKFLOW_SAVE_AS).toBe('string')
    expect(typeof IPC_CHANNELS.WORKFLOW_OPEN).toBe('string')
    expect(typeof IPC_CHANNELS.WORKFLOW_GET_RECENT).toBe('string')
    expect(typeof IPC_CHANNELS.WORKFLOW_SET_TITLE).toBe('string')
    expect(typeof IPC_CHANNELS.WORKFLOW_MENU_SAVE).toBe('string')
    expect(typeof IPC_CHANNELS.WORKFLOW_MENU_SAVE_AS).toBe('string')
    expect(typeof IPC_CHANNELS.WORKFLOW_MENU_OPEN).toBe('string')
    expect(typeof IPC_CHANNELS.WORKFLOW_MENU_NEW).toBe('string')
    expect(typeof IPC_CHANNELS.WORKFLOW_MENU_OPEN_RECENT).toBe('string')
  })

  // Edge case 1: workflow channels use 'workflow:' namespace
  it('all workflow channels use workflow: namespace', () => {
    const workflowKeys = Object.keys(IPC_CHANNELS).filter(k => k.startsWith('WORKFLOW_'))
    expect(workflowKeys.length).toBeGreaterThan(0)
    for (const key of workflowKeys) {
      const value = IPC_CHANNELS[key as keyof typeof IPC_CHANNELS]
      expect(value).toMatch(/^workflow:/)
    }
  })

  // Edge case 2: all channel values remain unique (no collisions)
  it('all channel values are unique across the entire registry', () => {
    const values = Object.values(IPC_CHANNELS)
    const unique = new Set(values)
    expect(unique.size).toBe(values.length)
  })

  // Edge case 3: channel names follow namespace:action pattern
  it('all channel names follow namespace:action format', () => {
    Object.values(IPC_CHANNELS).forEach(channel => {
      expect(channel).toMatch(/^[a-z]+:[a-z-]+$/)
    })
  })
})
