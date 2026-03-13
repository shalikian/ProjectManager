/**
 * Parameter definition types for node configuration controls.
 * Parameters are editable via the properties panel and do not require
 * a port connection — they represent static configuration values.
 */

/** The UI control type rendered for a parameter. */
export type ParameterType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'select'
  | 'slider'
  | 'text-area'

/** Constraints applied to a parameter based on its type. */
export interface ParameterConstraints {
  /** Minimum value (applies to number and slider types). */
  min?: number

  /** Maximum value (applies to number and slider types). */
  max?: number

  /** Step increment (applies to number and slider types). */
  step?: number

  /** Allowed values for select type. */
  options?: Array<{ value: string | number; label: string }>
}

/**
 * Defines a configurable parameter on a node.
 * Parameters are displayed in the properties panel as form controls.
 */
export interface ParameterDefinition {
  /** Internal identifier for the parameter (must be unique within the node). */
  name: string

  /** The UI control type to render for this parameter. */
  type: ParameterType

  /** Human-readable label shown in the UI. */
  label: string

  /** Default value used when the parameter has not been set by the user. */
  default: string | number | boolean

  /** Optional constraints that restrict valid values. */
  constraints?: ParameterConstraints
}
