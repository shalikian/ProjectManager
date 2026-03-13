/**
 * Port type registry for the node system.
 * Defines the 5 core data types that can flow between node ports,
 * each with a color hex code and compatibility rules.
 *
 * A const object is used instead of TypeScript enum to ensure full
 * compatibility with esbuild's strip-only transform (used by Vite/Vitest).
 */

/** The 5 core port types supported by the node system. */
export const PortType = {
  IMAGE: 'IMAGE',
  TEXT: 'TEXT',
  NUMBER: 'NUMBER',
  JSON: 'JSON',
  ANY: 'ANY'
} as const

/** Union type of all valid port type string values. */
export type PortType = (typeof PortType)[keyof typeof PortType]

/** Metadata for a port type including display color. */
export interface PortTypeMetadata {
  color: string
  label: string
}

/** Registry of port type metadata keyed by PortType. */
export const PORT_TYPE_REGISTRY: Record<PortType, PortTypeMetadata> = {
  [PortType.IMAGE]: { color: '#64B5F6', label: 'Image' },
  [PortType.TEXT]: { color: '#81C784', label: 'Text' },
  [PortType.NUMBER]: { color: '#FFB74D', label: 'Number' },
  [PortType.JSON]: { color: '#CE93D8', label: 'JSON' },
  [PortType.ANY]: { color: '#9E9E9E', label: 'Any' }
}

/**
 * Determines whether a connection from source to target is type-compatible.
 * ANY type is compatible with all other types in both directions.
 *
 * @param source - The port type of the output (source) port
 * @param target - The port type of the input (target) port
 * @returns true if the types are compatible and a connection is valid
 */
export function isTypeCompatible(source: PortType, target: PortType): boolean {
  if (source === PortType.ANY || target === PortType.ANY) {
    return true
  }
  return source === target
}
