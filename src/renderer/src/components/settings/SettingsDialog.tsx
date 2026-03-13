/**
 * Settings dialog — accessible via File → Settings or Ctrl+,
 * Renders one section per credential provider.
 * All credential operations go through IPC to the main process;
 * secrets never travel to the renderer.
 */

import React, { useEffect, useRef } from 'react'
import { PROVIDERS } from './providers'
import ProviderSection from './ProviderSection'
import { useCredentials } from './useCredentials'

interface Props {
  isOpen: boolean
  onClose: () => void
}

export default function SettingsDialog({ isOpen, onClose }: Props): React.JSX.Element | null {
  const dialogRef = useRef<HTMLDivElement>(null)
  const providerIds = PROVIDERS.map(p => p.id)

  const {
    fieldStates,
    savingKey,
    saveError,
    testStatuses,
    setFieldValue,
    revealField,
    saveField,
    testProvider
  } = useCredentials(providerIds)

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  // Focus trap: focus dialog when opened
  useEffect(() => {
    if (isOpen) dialogRef.current?.focus()
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.6)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label="Settings"
        className="bg-canvas-surface border border-canvas-border rounded-xl shadow-2xl
                   w-full max-w-xl max-h-[80vh] flex flex-col outline-none"
      >
        <SettingsHeader onClose={onClose} />
        {saveError && (
          <div
            role="alert"
            className="mx-4 mt-3 px-3 py-2 rounded bg-red-900/40 border border-red-700
                       text-red-300 text-xs"
          >
            {saveError}
          </div>
        )}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
          {PROVIDERS.map(section => (
            <ProviderSection
              key={section.id}
              section={section}
              fieldStates={fieldStates}
              testStatus={testStatuses[section.id] ?? { state: 'idle' }}
              savingKey={savingKey}
              onFieldChange={setFieldValue}
              onFieldReveal={revealField}
              onFieldSave={saveField}
              onTest={() => testProvider(section.id)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function SettingsHeader({ onClose }: { onClose: () => void }): React.JSX.Element {
  return (
    <div className="flex items-center justify-between px-4 py-3
                    border-b border-canvas-border flex-shrink-0">
      <h2 className="text-base font-semibold text-white">Settings</h2>
      <button
        onClick={onClose}
        aria-label="Close settings"
        className="text-gray-400 hover:text-white transition-colors text-lg leading-none"
      >
        &times;
      </button>
    </div>
  )
}
