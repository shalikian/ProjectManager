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
  ENGINE_RESULT: 'engine:result',

  // Credential management channels
  CREDENTIALS_SAVE: 'credentials:save',
  CREDENTIALS_LIST: 'credentials:list',
  CREDENTIALS_DELETE: 'credentials:delete',
  CREDENTIALS_TEST: 'credentials:test',
  CREDENTIALS_GET_MASKED: 'credentials:get-masked',

  // Workflow serialization channels
  WORKFLOW_SAVE: 'workflow:save',
  WORKFLOW_SAVE_AS: 'workflow:save-as',
  WORKFLOW_OPEN: 'workflow:open',
  WORKFLOW_NEW: 'workflow:new',
  WORKFLOW_GET_RECENT: 'workflow:get-recent',
  WORKFLOW_SET_TITLE: 'workflow:set-title',
  WORKFLOW_MENU_SAVE: 'workflow:menu-save',
  WORKFLOW_MENU_SAVE_AS: 'workflow:menu-save-as',
  WORKFLOW_MENU_OPEN: 'workflow:menu-open',
  WORKFLOW_MENU_NEW: 'workflow:menu-new',
  WORKFLOW_MENU_OPEN_RECENT: 'workflow:menu-open-recent',

  // Gallery / auto-save channels
  GALLERY_LIST: 'gallery:list',
  GALLERY_SAVE_IMAGE: 'gallery:save-image',
  GALLERY_DELETE: 'gallery:delete',
  GALLERY_OPEN_FOLDER: 'gallery:open-folder',
  GALLERY_COPY_CLIPBOARD: 'gallery:copy-clipboard',
  GALLERY_GET_OUTPUT_DIR: 'gallery:get-output-dir',
  GALLERY_SET_OUTPUT_DIR: 'gallery:set-output-dir',
  GALLERY_ITEM_SAVED: 'gallery:item-saved'
} as const

export type IpcChannel = (typeof IPC_CHANNELS)[keyof typeof IPC_CHANNELS]
