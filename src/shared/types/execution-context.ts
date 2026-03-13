/**
 * Execution context passed to node execute functions.
 * Provides utilities for progress reporting, secret retrieval,
 * cancellation, and logging.
 */

/** Log levels supported by the execution logger. */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

/** Logger interface available during node execution. */
export interface ExecutionLogger {
  debug(message: string, ...args: unknown[]): void
  info(message: string, ...args: unknown[]): void
  warn(message: string, ...args: unknown[]): void
  error(message: string, ...args: unknown[]): void
}

/**
 * Context object injected into every node's execute function.
 * Provides runtime utilities for progress, secrets, cancellation, and logging.
 */
export interface ExecutionContext {
  /**
   * Report execution progress as a value between 0 and 1.
   * @param progress - Fraction of work completed (0.0 to 1.0)
   * @param message - Optional human-readable status message
   */
  reportProgress(progress: number, message?: string): void

  /**
   * Retrieve a named secret (e.g. API key) from secure storage.
   * @param key - The name of the secret to retrieve
   * @returns The secret value, or undefined if not found
   */
  getSecret(key: string): Promise<string | undefined>

  /**
   * AbortSignal for detecting cancellation of the execution.
   * Nodes should check this signal and throw if aborted.
   */
  abortSignal: AbortSignal

  /** Logger for emitting structured log messages during execution. */
  logger: ExecutionLogger
}
