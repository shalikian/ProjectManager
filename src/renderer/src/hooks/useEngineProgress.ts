import { useEffect } from 'react'
import { useFlowStore } from '../store/flow-store'
import type { EngineProgressEvent } from '../../../preload/types'

/**
 * Subscribes to engine progress events from the main process
 * and dispatches state updates to the flow store.
 *
 * Mount this once at a top-level component (e.g. Canvas or Layout).
 */
export function useEngineProgress(): void {
  useEffect(() => {
    const engine = window.electron?.engine
    if (!engine) return

    const cleanup = engine.onProgress((event: EngineProgressEvent) => {
      const { setNodeExecutionState, setNodeImagePreview } = useFlowStore.getState()

      switch (event.type) {
        case 'node-started':
          if (event.nodeId) {
            setNodeExecutionState(event.nodeId, 'running')
          }
          break

        case 'node-completed':
          if (event.nodeId) {
            setNodeExecutionState(event.nodeId, 'completed')
            // If the outputs include an image buffer, convert to data URL for preview
            if (event.outputs) {
              for (const [outputId, value] of Object.entries(event.outputs)) {
                if (value && typeof value === 'object' && 'type' in (value as object) && (value as { type: string }).type === 'Buffer') {
                  // Buffer was serialized via IPC — reconstruct as data URL
                  const buf = value as { type: string; data: number[] }
                  const uint8 = new Uint8Array(buf.data)
                  const blob = new Blob([uint8], { type: 'image/png' })
                  const reader = new FileReader()
                  reader.onload = () => {
                    setNodeImagePreview(event.nodeId!, outputId, reader.result as string)
                  }
                  reader.readAsDataURL(blob)
                } else if (typeof value === 'string' && value.startsWith('data:image/')) {
                  setNodeImagePreview(event.nodeId!, outputId, value)
                }
              }
            }
          }
          break

        case 'node-error':
          if (event.nodeId) {
            setNodeExecutionState(event.nodeId, 'error')
            console.error(`[Engine] Node ${event.nodeId} error:`, event.error)
          }
          break

        case 'node-progress':
          // Could update a progress bar in the future
          break

        case 'run-completed':
          // All nodes done — nothing extra needed
          break
      }
    })

    return cleanup
  }, [])
}
