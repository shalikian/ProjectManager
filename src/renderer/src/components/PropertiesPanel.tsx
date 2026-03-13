import React from 'react'

export default function PropertiesPanel(): React.JSX.Element {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-3 py-2 border-b border-canvas-border">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Properties
        </h2>
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        <p className="text-xs text-gray-500 text-center mt-4">
          Select a node to view its properties
        </p>
      </div>
    </div>
  )
}
