import { Injectable } from "@nestjs/common";

export interface PermissionDefinition {
    /** Unique key, must be prefixed with module name and colon (e.g., "warehouse:create-receipt") */
    key: string;
    /** Display name for UI / translations (e.g., "Create Receipt") */
    name: string;
    /** Human-readable description of what this permission grants */
    description?: string;
}

/**
 * Runtime registry of all permission keys in the system.
 *
 * Each module registers its permissions during onModuleInit().
 * HR reads from this registry to validate permission overrides
 * and to display available permissions in the UI.
 *
 * Permission keys must be prefixed with the module name and a colon
 * (e.g., "freight:execute-route"). The module prefix is derived from
 * the key automatically — no separate `module` field needed.
 */
@Injectable()
export class PermissionRegistry {
    private readonly permissions = new Map<string, PermissionDefinition>();

    register(definition: PermissionDefinition): void {
        if (!definition.key.includes(":")) {
            throw new Error(
                `Permission key "${definition.key}" must be prefixed with module name (e.g., "module:action")`,
            );
        }
        this.permissions.set(definition.key, definition);
    }

    registerMany(definitions: PermissionDefinition[]): void {
        for (const def of definitions) {
            this.register(def);
        }
    }

    has(key: string): boolean {
        return this.permissions.has(key);
    }

    get(key: string): PermissionDefinition | undefined {
        return this.permissions.get(key);
    }

    getAll(): PermissionDefinition[] {
        return [...this.permissions.values()];
    }

    getByModule(module: string): PermissionDefinition[] {
        const prefix = `${module}:`;
        return [...this.permissions.values()].filter((p) => p.key.startsWith(prefix));
    }

    getAllKeys(): ReadonlySet<string> {
        return new Set(this.permissions.keys());
    }
}

export const PERMISSION_REGISTRY = Symbol("PermissionRegistry");
