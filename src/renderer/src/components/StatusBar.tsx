import React, { useEffect, useState } from 'react'

export default function StatusBar(): React.JSX.Element {
  const [version, setVersion] = useState<string>('...')
  const [platform, setPlatform] = useState<string>('...')

  useEffect(() => {
    loadAppInfo()
  }, [])

  async function loadAppInfo(): Promise<void> {
    try {
      if (!window.electron) throw new Error('No electron API')
      const v = await window.electron.getVersion()
      const p = await window.electron.getPlatform()
      setVersion(v)
      setPlatform(String(p))
    } catch {
      setVersion('dev')
      setPlatform('unknown')
    }
  }

  return (
    <footer className="flex items-center justify-between px-4 py-1 bg-canvas-surface border-t border-canvas-border text-xs text-gray-400">
      <span>Node Image Generator</span>
      <span>
        v{version} — {platform}
      </span>
    </footer>
  )
}
