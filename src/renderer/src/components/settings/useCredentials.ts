/**
 * Hook for managing credential state in the settings dialog.
 * Loads existing credential keys on mount, manages field state,
 * and provides save/delete/test operations.
 */

import { useState, useEffect, useCallback } from 'react'
import type { FieldStates, TestStatus } from './types'

const electron = window.electron

/** Returns per-field state and operations for the settings dialog. */
export function useCredentials(providerIds: string[]) {
  const [fieldStates, setFieldStates] = useState<FieldStates>({})
  const [savingKey, setSavingKey] = useState<string | null>(null)
  const [testStatuses, setTestStatuses] = useState<Record<string, TestStatus>>(
    () => Object.fromEntries(providerIds.map(id => [id, { state: 'idle' as const }]))
  )

  // Load existing keys on mount and mark them as saved
  useEffect(() => {
    electron.credentials.list().then(keys => {
      setFieldStates(prev => {
        const next = { ...prev }
        for (const key of keys) {
          if (!next[key]) {
            next[key] = { value: '', saved: true, revealed: false }
          }
        }
        return next
      })
    })
  }, [])

  const setFieldValue = useCallback((key: string, value: string) => {
    setFieldStates(prev => ({
      ...prev,
      [key]: { ...(prev[key] ?? { saved: false, revealed: false }), value }
    }))
  }, [])

  const revealField = useCallback((key: string) => {
    setFieldStates(prev => {
      const cur = prev[key]
      if (!cur) return prev
      return { ...prev, [key]: { ...cur, revealed: !cur.revealed } }
    })
  }, [])

  const saveField = useCallback(async (key: string) => {
    const state = fieldStates[key]
    if (!state?.value) return
    setSavingKey(key)
    try {
      const result = await electron.credentials.save({ key, value: state.value })
      if (result.ok) {
        setFieldStates(prev => ({
          ...prev,
          [key]: { ...(prev[key] ?? { revealed: false }), value: '', saved: true }
        }))
      } else {
        console.error('Failed to save credential:', result.error)
      }
    } finally {
      setSavingKey(null)
    }
  }, [fieldStates])

  const testProvider = useCallback(async (providerId: string) => {
    setTestStatuses(prev => ({
      ...prev,
      [providerId]: { state: 'testing' }
    }))
    try {
      const result = await electron.credentials.test(providerId)
      setTestStatuses(prev => ({
        ...prev,
        [providerId]: { state: result.ok ? 'ok' : 'error', message: result.message }
      }))
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      setTestStatuses(prev => ({
        ...prev,
        [providerId]: { state: 'error', message }
      }))
    }
  }, [])

  return {
    fieldStates,
    savingKey,
    testStatuses,
    setFieldValue,
    revealField,
    saveField,
    testProvider
  }
}
