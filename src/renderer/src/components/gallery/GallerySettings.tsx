/**
 * GallerySettings — output directory configuration section for the Settings dialog.
 */

import React, { useEffect, useState, useCallback } from 'react'

export default function GallerySettings(): React.JSX.Element {
  const [outputDir, setOutputDir] = useState<string>('')
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<string | null>(null)

  useEffect(() => {
    loadDir()
  }, [])

  async function loadDir(): Promise<void> {
    try {
      const dir = await window.electron.gallery.getOutputDir()
      setOutputDir(dir)
    } catch {
      // ignore
    }
  }

  const handleBrowse = useCallback(async () => {
    setSaving(true)
    setStatus(null)
    try {
      const result = await window.electron.gallery.setOutputDir()
      if (result.ok && result.dir) {
        setOutputDir(result.dir)
        setStatus('Saved')
      } else if (!result.cancelled) {
        setStatus(result.error ?? 'Failed to set directory')
      }
    } finally {
      setSaving(false)
    }
  }, [])

  const handleSaveManual = useCallback(async () => {
    if (!outputDir.trim()) return
    setSaving(true)
    setStatus(null)
    try {
      const result = await window.electron.gallery.setOutputDir(outputDir.trim())
      if (result.ok) {
        setStatus('Saved')
      } else {
        setStatus(result.error ?? 'Failed to save')
      }
    } finally {
      setSaving(false)
    }
  }, [outputDir])

  return (
    <div className="border border-canvas-border rounded-lg p-4">
      <h3 className="text-sm font-semibold text-white mb-3">Gallery Output</h3>
      <p className="text-xs text-gray-400 mb-3">
        Generated images are auto-saved to this directory.
        Default: <code className="text-gray-300">~/NodeGen/outputs/</code>
      </p>
      <div className="flex gap-2 items-stretch">
        <input
          type="text"
          value={outputDir}
          onChange={e => setOutputDir(e.target.value)}
          placeholder="~/NodeGen/outputs/"
          className="flex-1 px-3 py-1.5 text-xs bg-canvas-bg border border-canvas-border
                     rounded text-white placeholder-gray-600 focus:outline-none
                     focus:ring-1 focus:ring-node-selected"
        />
        <button
          onClick={handleBrowse}
          disabled={saving}
          className="px-3 py-1.5 text-xs bg-node-header hover:bg-node-selected hover:text-canvas-bg
                     border border-node-border rounded transition-colors disabled:opacity-50"
        >
          Browse
        </button>
        <button
          onClick={handleSaveManual}
          disabled={saving || !outputDir.trim()}
          className="px-3 py-1.5 text-xs bg-node-header hover:bg-node-selected hover:text-canvas-bg
                     border border-node-border rounded transition-colors disabled:opacity-50"
        >
          Save
        </button>
      </div>
      {status && (
        <p className={`text-xs mt-2 ${status === 'Saved' ? 'text-green-400' : 'text-red-400'}`}>
          {status}
        </p>
      )}
    </div>
  )
}
