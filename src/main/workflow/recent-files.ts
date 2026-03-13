/**
 * Recent-files list management.
 * Persists to userData/recent-workflows.json.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { dirname, basename } from 'path'
import type { RecentFileEntry } from '../../shared/workflow-types'
import { MAX_RECENT_FILES, WORKFLOW_EXTENSION } from '../../shared/workflow-types'

/**
 * Load the recent-files list from disk.
 * Returns an empty array if the file doesn't exist or is corrupt.
 */
export function loadRecentFiles(filePath: string): RecentFileEntry[] {
  if (!existsSync(filePath)) return []
  try {
    const raw = readFileSync(filePath, 'utf-8')
    const entries = JSON.parse(raw) as RecentFileEntry[]
    return Array.isArray(entries) ? entries : []
  } catch {
    return []
  }
}

/**
 * Prepend a new entry (or move existing) to the front of the recent-files list,
 * capping at MAX_RECENT_FILES, then persist to disk.
 */
export function addRecentFile(
  filePath: string,
  name: string,
  storagePath: string
): RecentFileEntry[] {
  const entries = loadRecentFiles(storagePath)

  // Remove existing entry for the same path
  const filtered = entries.filter(e => e.filePath !== filePath)

  const newEntry: RecentFileEntry = {
    filePath,
    name: name || deriveName(filePath),
    openedAt: new Date().toISOString()
  }

  const updated = [newEntry, ...filtered].slice(0, MAX_RECENT_FILES)
  persistRecentFiles(storagePath, updated)
  return updated
}

/** Persist the list to disk. */
function persistRecentFiles(filePath: string, entries: RecentFileEntry[]): void {
  try {
    const dir = dirname(filePath)
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true })
    }
    writeFileSync(filePath, JSON.stringify(entries, null, 2), 'utf-8')
  } catch {
    // Non-fatal — recent files are best-effort
  }
}

/** Derive a display name from the file path by stripping extension. */
function deriveName(filePath: string): string {
  const base = basename(filePath)
  const ext = `.${WORKFLOW_EXTENSION}`
  return base.endsWith(ext) ? base.slice(0, -ext.length) : base
}
