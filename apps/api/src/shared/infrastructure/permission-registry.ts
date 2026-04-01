import { Injectable } from "@nestjs/common";
import type { PermissionInput, PermissionDefinition } from "../../libs/permissions/index.js";

/**
 * Runtime registry of all permission keys in the system.
 *
 * Each module registers its permissions during onModuleInit() by calling
 * registerForModule("warehouse", [...]) — the registry prefixes each key
 * with the module name automatically. Modules never hardcode the prefix.
 *
 * All lookups (has, get) use the full key (e.g., "warehouse:create-receipt").
 */
@Injectable()
export class PermissionRegistry {
    private readonly permissions = new Map<string, PermissionDefinition>();

    registerForModule(module: string, definitions: PermissionInput[]): void {
        for (const def of definitions) {
            const fullKey = `${module}:${def.key}`;
            this.permissions.set(fullKey, {
                ...def,
                fullKey,
                module,
            });
        }
    }

    has(fullKey: string): boolean {
        return this.permissions.has(fullKey);
    }

    get(fullKey: string): PermissionDefinition | undefined {
        return this.permissions.get(fullKey);
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
