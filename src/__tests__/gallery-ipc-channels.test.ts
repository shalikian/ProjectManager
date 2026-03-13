/**
 * Tests for gallery IPC channel constants.
 */

import { describe, it, expect } from 'vitest'
import { IPC_CHANNELS } from '../shared/ipc-channels'

describe('gallery IPC channels', () => {
  // Happy path: all gallery channel constants exist and are strings
  it('exports all gallery channel constants as strings', () => {
    expect(typeof IPC_CHANNELS.GALLERY_LIST).toBe('string')
    expect(typeof IPC_CHANNELS.GALLERY_SAVE_IMAGE).toBe('string')
    expect(typeof IPC_CHANNELS.GALLERY_DELETE).toBe('string')
    expect(typeof IPC_CHANNELS.GALLERY_OPEN_FOLDER).toBe('string')
    expect(typeof IPC_CHANNELS.GALLERY_COPY_CLIPBOARD).toBe('string')
    expect(typeof IPC_CHANNELS.GALLERY_GET_OUTPUT_DIR).toBe('string')
    expect(typeof IPC_CHANNELS.GALLERY_SET_OUTPUT_DIR).toBe('string')
    expect(typeof IPC_CHANNELS.GALLERY_ITEM_SAVED).toBe('string')
  })

  // Edge case 1: all gallery channels use the 'gallery:' namespace
  it('all gallery channels use gallery: namespace', () => {
    const galleryKeys = Object.keys(IPC_CHANNELS).filter(k => k.startsWith('GALLERY_'))
    expect(galleryKeys.length).toBeGreaterThan(0)
    for (const key of galleryKeys) {
      const value = IPC_CHANNELS[key as keyof typeof IPC_CHANNELS]
      expect(value).toMatch(/^gallery:/)
    }
  })

  // Edge case 2: all channel values remain unique (no collisions with existing channels)
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

  // Edge case 4: GALLERY_ITEM_SAVED is the push event channel
  it('GALLERY_ITEM_SAVED is a specific non-empty string', () => {
    expect(IPC_CHANNELS.GALLERY_ITEM_SAVED).toBe('gallery:item-saved')
  })
})
