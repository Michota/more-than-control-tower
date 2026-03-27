import { PermissionRegistry } from "./permission-registry.js";

describe("PermissionRegistry", () => {
    let registry: PermissionRegistry;

    beforeEach(() => {
        registry = new PermissionRegistry();
    });

    const warehousePermission = () => ({
        key: "warehouse:create-receipt",
        name: "Create Receipt",
        description: "Create a new goods receipt",
    });

    const freightPermission = () => ({
        key: "freight:execute-route",
        name: "Execute Route",
        description: "Execute a delivery route",
    });

    describe("register()", () => {
        it("registers a permission", () => {
            registry.register(warehousePermission());

            expect(registry.has("warehouse:create-receipt")).toBe(true);
        });

        it("overwrites an existing permission with the same key", () => {
            registry.register(warehousePermission());
            registry.register({ ...warehousePermission(), name: "Updated Name" });

            expect(registry.get("warehouse:create-receipt")?.name).toBe("Updated Name");
        });

        it("throws when key has no module prefix", () => {
            expect(() => registry.register({ key: "no-prefix", name: "Bad", description: "test" })).toThrow(
                /must be prefixed/,
            );
        });
    });

    describe("registerMany()", () => {
        it("registers multiple permissions", () => {
            registry.registerMany([warehousePermission(), freightPermission()]);

            expect(registry.has("warehouse:create-receipt")).toBe(true);
            expect(registry.has("freight:execute-route")).toBe(true);
        });
    });

    describe("has()", () => {
        it("returns false for unregistered key", () => {
            expect(registry.has("unknown:permission")).toBe(false);
        });
    });

    describe("get()", () => {
        it("returns the permission definition", () => {
            registry.register(warehousePermission());

            const result = registry.get("warehouse:create-receipt");

            expect(result?.key).toBe("warehouse:create-receipt");
            expect(result?.name).toBe("Create Receipt");
            expect(result?.description).toBe("Create a new goods receipt");
        });

        it("returns undefined for unknown key", () => {
            expect(registry.get("unknown:permission")).toBeUndefined();
        });
    });

    describe("getAll()", () => {
        it("returns all registered permissions", () => {
            registry.registerMany([warehousePermission(), freightPermission()]);

            expect(registry.getAll()).toHaveLength(2);
        });

        it("returns empty array when nothing registered", () => {
            expect(registry.getAll()).toEqual([]);
        });
    });

    describe("getByModule()", () => {
        it("filters by key prefix", () => {
            registry.registerMany([
                warehousePermission(),
                { key: "warehouse:view-stock", name: "View Stock", description: "View stock levels" },
                freightPermission(),
            ]);

            const warehousePerms = registry.getByModule("warehouse");

            expect(warehousePerms).toHaveLength(2);
            expect(warehousePerms.every((p) => p.key.startsWith("warehouse:"))).toBe(true);
        });

        it("returns empty array for unknown module", () => {
            registry.register(warehousePermission());

            expect(registry.getByModule("crm")).toEqual([]);
        });
    });

    describe("getAllKeys()", () => {
        it("returns a set of all permission keys", () => {
            registry.registerMany([warehousePermission(), freightPermission()]);

            const keys = registry.getAllKeys();

            expect(keys.has("warehouse:create-receipt")).toBe(true);
            expect(keys.has("freight:execute-route")).toBe(true);
            expect(keys.size).toBe(2);
        });
    });
});
