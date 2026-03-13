/**
 * Renders a single provider section in the settings dialog.
 * Shows all credential fields and a Test Connection button.
 */

import React from 'react'
import type { ProviderSection as ProviderSectionDef, FieldStates, TestStatus } from './types'
import CredentialFieldComponent from './CredentialField'

interface Props {
  section: ProviderSectionDef
  fieldStates: FieldStates
  testStatus: TestStatus
  savingKey: string | null
  onFieldChange: (key: string, value: string) => void
  onFieldReveal: (key: string) => void
  onFieldSave: (key: string) => void
  onTest: () => void
}

function TestStatusBadge({ status }: { status: TestStatus }): React.JSX.Element | null {
  if (status.state === 'idle') return null

  const colors: Record<string, string> = {
    testing: 'text-yellow-400',
    ok: 'text-green-400',
    error: 'text-red-400'
  }

  const labels: Record<string, string> = {
    testing: 'Testing...',
    ok: status.message ?? 'Connected',
    error: status.message ?? 'Connection failed'
  }

  return (
    <span className={`text-xs ${colors[status.state]}`}>
      {labels[status.state]}
    </span>
  )
}

export default function ProviderSection({
  section,
  fieldStates,
  testStatus,
  savingKey,
  onFieldChange,
  onFieldReveal,
  onFieldSave,
  onTest
}: Props): React.JSX.Element {
  return (
    <div className="border border-canvas-border rounded-lg p-4 flex flex-col gap-3">
      <h3 className="text-sm font-semibold text-white">{section.label}</h3>

      {section.fields.map(field => {
        const state = fieldStates[field.key] ?? { value: '', saved: false, revealed: false }
        return (
          <CredentialFieldComponent
            key={field.key}
            field={field}
            state={state}
            onChange={value => onFieldChange(field.key, value)}
            onReveal={() => onFieldReveal(field.key)}
            onSave={() => onFieldSave(field.key)}
            isSaving={savingKey === field.key}
          />
        )
      })}

      <div className="flex items-center gap-3 pt-1">
        <button
          onClick={onTest}
          disabled={testStatus.state === 'testing'}
          className="px-4 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs
                     font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          Test Connection
        </button>
        <TestStatusBadge status={testStatus} />
      </div>
    </div>
  )
}
