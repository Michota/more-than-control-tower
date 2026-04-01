export interface PermissionInput {
    /** Permission key without module prefix (e.g., "create-receipt") */
    key: string;
    /**
     * Display name for UI / translations (e.g., "Create Receipt").
     * TODO: Replace with a translationKey (Paraglide message ID) once backend-frontend
     * translation strategy is established. Currently hardcoded English strings.
     */
    name: string;
    /** Human-readable description of what this permission grants */
    description?: string;
}

interface PermissionDef {
    readonly key: string;
    readonly name: string;
    readonly description?: string;
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
 *     CREATE_GOOD: { key: "create-good", name: "Create Good" },
 *     VIEW_GOODS: { key: "view-goods", name: "View Goods" },
 * });
 *
 * // Keys.CREATE_GOOD === "warehouse:create-good" (typed as string literal)
 * // definitions === [{ key: "create-good", name: "Create Good" }, ...]
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
        inputs.push({ key: def.key, name: def.name, description: def.description });
    }

    return { Keys: keys as any, definitions: inputs };
}
