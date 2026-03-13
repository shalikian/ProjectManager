/**
 * Port definition types for node inputs and outputs.
 */

import { PortType } from './port-types'

/**
 * Defines a single input or output port on a node.
 * Ports carry typed data between connected nodes.
 */
export interface PortDefinition {
  /** Internal identifier for the port (must be unique within the node). */
  name: string

  /** The data type this port accepts or produces. */
  type: PortType

  /** Human-readable label shown in the UI. */
  label: string

  /**
   * Optional default value used when no connection is present.
   * Only applicable to input ports.
   */
  defaultValue?: unknown
}
