/**
 * Shared kernel types for qualification schemas.
 *
 * These types are used by the HR module's Position entity to define
 * what qualifications a position requires. They live in shared kernel
 * because cross-module queries reference them in response types.
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
