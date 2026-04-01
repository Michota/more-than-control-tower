export interface PermissionInput {
    /** Permission key without module prefix (e.g., "create-receipt") */
    key: string;
    /** Paraglide message ID for the display name (e.g., "permission_warehouse_create_good") */
    messageKey: string;
    /** Paraglide message ID for the description (e.g., "permission_warehouse_create_good_desc") */
    descriptionKey?: string;
}

interface PermissionDef {
    readonly key: string;
    readonly messageKey: string;
    readonly descriptionKey?: string;
}

/**
 * Defines permissions for a module from a single source of truth.
 *
 * Returns:
 * - `Keys` — const object with full keys (module-prefixed) for use with @RequirePermission
 * - `definitions` — PermissionInput[] for passing to permissionRegistry.registerForModule()
 *
 * @example
 * ```ts
 * const { Keys, definitions } = defineModulePermissions("warehouse", {
 *     CREATE_GOOD: { key: "create-good", messageKey: "permission_warehouse_create_good" },
 *     VIEW_GOODS: { key: "view-goods", messageKey: "permission_warehouse_view_goods" },
 * });
 *
 * // Keys.CREATE_GOOD === "warehouse:create-good" (typed as string literal)
 * // definitions === [{ key: "create-good", messageKey: "permission_warehouse_create_good" }, ...]
 * ```
 */
export function defineModulePermissions<TModule extends string, const TDefs extends Record<string, PermissionDef>>(
    module: TModule,
    definitions: TDefs,
): {
    Keys: Readonly<{ [K in keyof TDefs]: `${TModule}:${TDefs[K]["key"]}` }>;
    definitions: PermissionInput[];
} {
    const keys: Record<string, string> = {};
    const inputs: PermissionInput[] = [];

    for (const [enumKey, def] of Object.entries(definitions)) {
        keys[enumKey] = `${module}:${def.key}`;
        inputs.push({ key: def.key, messageKey: def.messageKey, descriptionKey: def.descriptionKey });
    }

    return { Keys: keys as any, definitions: inputs };
}
