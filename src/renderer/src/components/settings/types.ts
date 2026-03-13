/**
 * Shared types for the settings dialog.
 */

export interface CredentialField {
  key: string
  label: string
  placeholder?: string
  isSecret?: boolean
}

export interface ProviderSection {
  id: string
  label: string
  fields: CredentialField[]
}

export interface FieldState {
  value: string
  saved: boolean
  revealed: boolean
}

export type FieldStates = Record<string, FieldState>

export interface TestStatus {
  state: 'idle' | 'testing' | 'ok' | 'error'
  message?: string
}
