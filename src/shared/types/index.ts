/**
 * Core type system for the node-based image generation editor.
 *
 * All types are exported from this barrel file so both the main process
 * and renderer process can import from `@shared/types`.
 *
 * @example
 *   import { NodeDefinition, PortType, isTypeCompatible } from '@shared/types'
 */

export type { AppInfo, NodeData, NodeType } from './app-types'
export type { PortDefinition } from './port-definition'
export type { ParameterDefinition, ParameterConstraints, ParameterType } from './parameter-definition'
export type { ExecutionContext, ExecutionLogger, LogLevel } from './execution-context'
export type { NodeDefinition, NodeExecuteFunction } from './node-definition'
export { PortType, PORT_TYPE_REGISTRY, isTypeCompatible } from './port-types'
export type { PortTypeMetadata } from './port-types'
