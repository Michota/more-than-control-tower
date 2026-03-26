/**
 * Shared kernel types for position definitions.
 *
 * Each module declares its own positions (e.g., Freight defines "Driver",
 * Warehouse defines "Warehouse Worker"). HR reads these definitions when
 * assigning positions to employees and validating qualifications.
 *
 * Position-to-permission mappings are NOT part of PositionDefinition —
 * they are owned by the HR module.
 */

export type QualificationValueType = "STRING" | "NUMBER" | "STRING_ARRAY";

export interface QualificationSchemaEntry {
    /** Unique key within the position (e.g., "licenseCategory") */
    key: string;
    /** Data type of the qualification value */
    type: QualificationValueType;
    /** Human-readable description */
    description: string;
    /** Whether this qualification must be provided when assigning the position */
    required?: boolean;
}

export interface PositionDefinition {
    /** Globally unique key, namespaced by module (e.g., "freight:driver") */
    key: string;
    /** Module that owns this position definition */
    module: string;
    /** Human-readable display name (e.g., "Driver") */
    displayName: string;
    /** Schema of valid qualification attributes for this position */
    qualificationSchema: readonly QualificationSchemaEntry[];
}
