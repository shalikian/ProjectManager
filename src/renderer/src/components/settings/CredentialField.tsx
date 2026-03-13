/**
 * A single credential input field with optional mask/reveal toggle.
 */

import React, { useState } from 'react'
import type { CredentialField as CredentialFieldDef, FieldState } from './types'

interface Props {
  field: CredentialFieldDef
  state: FieldState
  onChange: (value: string) => void
  onReveal: () => void
  onSave: () => void
  isSaving?: boolean
}

export default function CredentialField({
  field,
  state,
  onChange,
  onReveal,
  onSave,
  isSaving
}: Props): React.JSX.Element {
  const [focused, setFocused] = useState(false)

  const showMasked = field.isSecret && state.saved && !state.revealed && !focused
  const displayValue = showMasked ? '••••••••' : state.value

  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-gray-400 font-medium">{field.label}</label>
      <div className="flex gap-2">
        <input
          type={showMasked ? 'password' : 'text'}
          value={displayValue}
          placeholder={field.placeholder}
          readOnly={showMasked}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onChange={e => onChange(e.target.value)}
          className="flex-1 px-3 py-1.5 rounded bg-canvas-bg border border-canvas-border
                     text-white text-sm placeholder-gray-600
                     focus:outline-none focus:border-blue-500"
        />
        {field.isSecret && state.saved && (
          <button
            onClick={onReveal}
            title={state.revealed ? 'Hide' : 'Reveal'}
            className="px-2 py-1.5 rounded border border-canvas-border bg-canvas-surface
                       text-gray-400 hover:text-white text-xs transition-colors"
          >
            {state.revealed ? 'Hide' : 'Show'}
          </button>
        )}
        <button
          onClick={onSave}
          disabled={isSaving || !state.value}
          title="Save credential"
          className="px-3 py-1.5 rounded border border-canvas-border bg-canvas-surface
                     text-gray-400 hover:text-white text-xs transition-colors
                     disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isSaving ? '...' : 'Save'}
        </button>
      </div>
      {state.saved && (
        <span className="text-xs text-green-400">Saved</span>
      )}
    </div>
  )
}
