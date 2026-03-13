/**
 * Public exports for the credential management module.
 */

export { CredentialStore, getCredentialStore, resetCredentialStore } from './credential-store'
export type { SaveResult, TestResult } from './credential-store'
export { registerCredentialHandlers } from './credential-ipc-handlers'
export type { MaskedCredential, CredentialSaveRequest } from './credential-ipc-handlers'
