/**
 * Tests for the recent-files management module.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { join } from 'path'
import { existsSync, unlinkSync, mkdirSync } from 'fs'
import { tmpdir } from 'os'
import { loadRecentFiles, addRecentFile } from '../main/workflow/recent-files'

const TMP_DIR = join(tmpdir(), 'recent-files-test')
const TMP_FILE = join(TMP_DIR, 'recent.json')

beforeEach(() => {
  if (!existsSync(TMP_DIR)) {
    mkdirSync(TMP_DIR, { recursive: true })
  }
  if (existsSync(TMP_FILE)) {
    unlinkSync(TMP_FILE)
  }
})

afterEach(() => {
  if (existsSync(TMP_FILE)) {
    unlinkSync(TMP_FILE)
  }
})

describe('loadRecentFiles', () => {
  // Happy path: returns empty array when file doesn't exist
  it('returns empty array for missing file', () => {
    expect(loadRecentFiles(TMP_FILE)).toEqual([])
  })

  // Edge case 1: returns empty array for corrupt JSON
  it('returns empty array for corrupt JSON file', () => {
    const { writeFileSync } = require('fs')
    writeFileSync(TMP_FILE, 'NOT VALID JSON', 'utf-8')
    expect(loadRecentFiles(TMP_FILE)).toEqual([])
  })

  // Edge case 2: returns empty array for JSON that is not an array
  it('returns empty array when JSON is an object', () => {
    const { writeFileSync } = require('fs')
    writeFileSync(TMP_FILE, JSON.stringify({ foo: 'bar' }), 'utf-8')
    expect(loadRecentFiles(TMP_FILE)).toEqual([])
  })

  // Edge case 3: returns stored entries
  it('returns parsed entries when file is valid', () => {
    const entries = [
      { filePath: '/a.nodegen', name: 'a', openedAt: '2026-01-01T00:00:00Z' }
    ]
    const { writeFileSync } = require('fs')
    writeFileSync(TMP_FILE, JSON.stringify(entries), 'utf-8')
    const result = loadRecentFiles(TMP_FILE)
    expect(result).toHaveLength(1)
    expect(result[0].filePath).toBe('/a.nodegen')
  })
})

describe('addRecentFile', () => {
  // Happy path: adds new entry to empty list
  it('adds a new entry and persists it', () => {
    const entries = addRecentFile('/workflow.nodegen', 'workflow', TMP_FILE)
    expect(entries).toHaveLength(1)
    expect(entries[0].filePath).toBe('/workflow.nodegen')
    expect(entries[0].name).toBe('workflow')
    // Verify persistence
    expect(loadRecentFiles(TMP_FILE)).toHaveLength(1)
  })

  // Edge case 1: adds to front (most recent first)
  it('places new entry at the beginning of the list', () => {
    addRecentFile('/first.nodegen', 'first', TMP_FILE)
    const entries = addRecentFile('/second.nodegen', 'second', TMP_FILE)
    expect(entries[0].filePath).toBe('/second.nodegen')
    expect(entries[1].filePath).toBe('/first.nodegen')
  })

  // Edge case 2: re-adding an existing path moves it to the front
  it('moves existing entry to the front when re-added', () => {
    addRecentFile('/a.nodegen', 'a', TMP_FILE)
    addRecentFile('/b.nodegen', 'b', TMP_FILE)
    const entries = addRecentFile('/a.nodegen', 'a', TMP_FILE)
    expect(entries[0].filePath).toBe('/a.nodegen')
    expect(entries).toHaveLength(2)
  })

  // Edge case 3: caps at MAX_RECENT_FILES (10)
  it('keeps at most 10 entries', () => {
    for (let i = 0; i < 12; i++) {
      addRecentFile(`/file-${i}.nodegen`, `file-${i}`, TMP_FILE)
    }
    const entries = loadRecentFiles(TMP_FILE)
    expect(entries.length).toBeLessThanOrEqual(10)
  })

  // Edge case 4: derives name from path when name is empty
  it('derives name from file path when name argument is empty', () => {
    const entries = addRecentFile('/path/to/my-project.nodegen', '', TMP_FILE)
    expect(entries[0].name).toBe('my-project')
  })
})
