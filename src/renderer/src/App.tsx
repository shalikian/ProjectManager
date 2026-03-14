import React from 'react'
import { ReactFlowProvider } from '@xyflow/react'
import Layout from './components/Layout'

export default function App(): React.JSX.Element {
  return (
    <ReactFlowProvider>
      <Layout />
    </ReactFlowProvider>
  )
}
