import { describe, it, expect } from 'vitest'
import { IPC_CHANNELS } from '../shared/ipc-channels'
import type { IpcChannel } from '../shared/ipc-channels'

describe('IPC_CHANNELS', () => {
  // Happy path: constants exist and are strings
  it('exports APP_GET_VERSION as a string', () => {
    expect(typeof IPC_CHANNELS.APP_GET_VERSION).toBe('string')
    expect(IPC_CHANNELS.APP_GET_VERSION.length).toBeGreaterThan(0)
  })

  it('exports APP_GET_PLATFORM as a string', () => {
    expect(typeof IPC_CHANNELS.APP_GET_PLATFORM).toBe('string')
    expect(IPC_CHANNELS.APP_GET_PLATFORM.length).toBeGreaterThan(0)
  })

  // Edge case 1: channel names follow app:action convention
  it('all channel names use colon-separated namespace', () => {
    Object.values(IPC_CHANNELS).forEach(channel => {
      expect(channel).toMatch(/^[a-z]+:[a-z-]+$/)
    })
  })

  // Edge case 2: all channel values are unique
  it('channel values are unique', () => {
    const values = Object.values(IPC_CHANNELS)
    const unique = new Set(values)
    expect(unique.size).toBe(values.length)
  })

  // Edge case 3: IpcChannel type includes all constants
  it('IpcChannel type covers all values', () => {
    const values = Object.values(IPC_CHANNELS) as IpcChannel[]
    expect(values).toContain(IPC_CHANNELS.APP_GET_VERSION)
    expect(values).toContain(IPC_CHANNELS.APP_GET_PLATFORM)
  })
})
