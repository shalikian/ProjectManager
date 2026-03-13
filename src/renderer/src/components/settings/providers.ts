/**
 * Provider configuration for the settings dialog.
 * Add new providers here — the dialog renders them automatically.
 */

import type { ProviderSection } from './types'

export const PROVIDERS: ProviderSection[] = [
  {
    id: 'google-vertex-ai',
    label: 'Google Vertex AI',
    fields: [
      {
        key: 'google-vertex-ai:project-id',
        label: 'Project ID',
        placeholder: 'my-gcp-project',
        isSecret: false
      },
      {
        key: 'google-vertex-ai:region',
        label: 'Region',
        placeholder: 'us-central1',
        isSecret: false
      },
      {
        key: 'google-vertex-ai:api-key',
        label: 'API Key',
        placeholder: 'AIzaSy...',
        isSecret: true
      },
      {
        key: 'google-vertex-ai:service-account-path',
        label: 'Service Account JSON Path',
        placeholder: '/path/to/service-account.json',
        isSecret: false
      }
    ]
  }
]
