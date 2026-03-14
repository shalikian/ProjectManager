import React from 'react'
import type { PortDefinition } from '../../../../shared/types'

interface NodeImagePreviewProps {
  outputs: PortDefinition[]
  imagePreviews: Record<string, string | null>
}

function ImagePreviewItem({
  port,
  dataUrl
}: {
  port: PortDefinition
  dataUrl: string | null
}): React.JSX.Element {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] text-gray-400">{port.label}</span>
      {dataUrl ? (
        <img
          src={dataUrl}
          alt={port.label}
          className="w-full rounded-lg border border-node-border object-contain"
        />
      ) : (
        <div
          className="w-full rounded-lg border border-node-border bg-canvas-bg
                     flex items-center justify-center text-gray-600 text-[10px]"
          style={{ minHeight: '240px' }}
          aria-label={`${port.label} preview placeholder`}
        >
          No image
        </div>
      )}
    </div>
  )
}

export default function NodeImagePreview({
  outputs,
  imagePreviews
}: NodeImagePreviewProps): React.JSX.Element {
  const imageOutputs = outputs.filter(p => p.type === 'IMAGE')

  if (imageOutputs.length === 0) return <></>

  return (
    <div className="flex flex-col gap-2 px-2 pb-2 border-t border-node-border pt-2">
      {imageOutputs.map(port => (
        <ImagePreviewItem
          key={port.id}
          port={port}
          dataUrl={imagePreviews[port.id] ?? null}
        />
      ))}
    </div>
  )
}
