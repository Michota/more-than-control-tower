import { Injectable } from "@nestjs/common";

export interface PermissionDefinition {
    /** Unique key namespaced by module (e.g., "warehouse:create-receipt") */
    key: string;
    /** Display name for UI / translations (e.g., "Create Receipt") */
    name: string;
    /** Module that owns this permission */
    module: string;
    /** Human-readable description */
    description: string;
}

/**
 * Runtime registry of all permission keys in the system.
 *
 * Each module registers its permissions during onModuleInit().
 * HR reads from this registry to validate permission overrides
 * and to display available permissions in the UI.
 *
 * This is infrastructure, not business logic — analogous to
 * MikroOrmUnitOfWork or NestjsLoggerAdapter.
 */
@Injectable()
export class PermissionRegistry {
    private readonly permissions = new Map<string, PermissionDefinition>();

    register(definition: PermissionDefinition): void {
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
        return [...this.permissions.values()].filter((p) => p.module === module);
    }

    getAllKeys(): ReadonlySet<string> {
        return new Set(this.permissions.keys());
    }
}

export const PERMISSION_REGISTRY = Symbol("PermissionRegistry");
