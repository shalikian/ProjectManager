/**
 * Centralized IPC channel name constants.
 * Shared between main process and preload script to ensure type safety.
 */
export const IPC_CHANNELS = {
  APP_GET_VERSION: 'app:get-version',
  APP_GET_PLATFORM: 'app:get-platform',
  NODES_LIST_ALL: 'nodes:list-all',
  NODES_GET_BY_ID: 'nodes:get-by-id',
  NODES_REGISTRY_CHANGED: 'nodes:registry-changed',

  // Execution engine channels
  ENGINE_RUN: 'engine:run',
  ENGINE_RUN_NODE: 'engine:run-node',
  ENGINE_CANCEL: 'engine:cancel',
  ENGINE_PROGRESS: 'engine:progress',
  ENGINE_RESULT: 'engine:result'
} as const

export type IpcChannel = (typeof IPC_CHANNELS)[keyof typeof IPC_CHANNELS]
