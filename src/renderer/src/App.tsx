import React from 'react'
import NodeCanvas from './components/NodeCanvas'
import Toolbar from './components/Toolbar'
import StatusBar from './components/StatusBar'

export default function App(): React.JSX.Element {
  return (
    <div className="flex flex-col h-screen w-screen bg-canvas-bg text-white overflow-hidden">
      <Toolbar />
      <main className="flex-1 relative overflow-hidden">
        <NodeCanvas />
      </main>
      <StatusBar />
    </div>
  )
}
