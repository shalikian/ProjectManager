import { Node, Edge } from '@xyflow/react'

export function createInitialNodes(): Node[] {
  return [
    {
      id: 'source-1',
      type: 'imageSource',
      position: { x: 100, y: 200 },
      data: { label: 'Image Source' }
    },
    {
      id: 'filter-1',
      type: 'filter',
      position: { x: 350, y: 200 },
      data: { label: 'Filter' }
    },
    {
      id: 'output-1',
      type: 'output',
      position: { x: 600, y: 200 },
      data: { label: 'Output' }
    }
  ]
}

export function createInitialEdges(): Edge[] {
  return [
    {
      id: 'e1-2',
      source: 'source-1',
      target: 'filter-1',
      animated: true,
      style: { stroke: '#89b4fa' }
    },
    {
      id: 'e2-3',
      source: 'filter-1',
      target: 'output-1',
      animated: true,
      style: { stroke: '#89b4fa' }
    }
  ]
}
