import { PermissionRegistry } from "./permission-registry.js";

describe("PermissionRegistry", () => {
    let registry: PermissionRegistry;

    beforeEach(() => {
        registry = new PermissionRegistry();
    });

    describe("registerForModule()", () => {
        it("registers permissions with module prefix", () => {
            registry.registerForModule("warehouse", [{ key: "create-receipt", name: "Create Receipt" }]);

            expect(registry.has("warehouse:create-receipt")).toBe(true);
        });

        it("stores full key and module on the definition", () => {
            registry.registerForModule("warehouse", [
                { key: "create-receipt", name: "Create Receipt", description: "Create a new goods receipt" },
            ]);

            const result = registry.get("warehouse:create-receipt");

            expect(result?.key).toBe("create-receipt");
            expect(result?.fullKey).toBe("warehouse:create-receipt");
            expect(result?.module).toBe("warehouse");
            expect(result?.name).toBe("Create Receipt");
            expect(result?.description).toBe("Create a new goods receipt");
        });

        it("registers multiple permissions for a module", () => {
            registry.registerForModule("freight", [
                { key: "execute-route", name: "Execute Route" },
                { key: "view-routes", name: "View Routes" },
            ]);

            expect(registry.has("freight:execute-route")).toBe(true);
            expect(registry.has("freight:view-routes")).toBe(true);
        });

        it("registers permissions from different modules", () => {
            registry.registerForModule("warehouse", [{ key: "create-receipt", name: "Create Receipt" }]);
            registry.registerForModule("freight", [{ key: "execute-route", name: "Execute Route" }]);

            expect(registry.has("warehouse:create-receipt")).toBe(true);
            expect(registry.has("freight:execute-route")).toBe(true);
        });

        it("description is optional", () => {
            registry.registerForModule("warehouse", [{ key: "view-stock", name: "View Stock" }]);

            expect(registry.get("warehouse:view-stock")?.description).toBeUndefined();
        });
    });

    describe("has()", () => {
        it("returns false for unregistered key", () => {
            expect(registry.has("unknown:permission")).toBe(false);
        });
    });

    describe("get()", () => {
        it("returns undefined for unknown key", () => {
            expect(registry.get("unknown:permission")).toBeUndefined();
        });
    });

    describe("getAll()", () => {
        it("returns all registered permissions", () => {
            registry.registerForModule("warehouse", [{ key: "create-receipt", name: "Create Receipt" }]);
            registry.registerForModule("freight", [{ key: "execute-route", name: "Execute Route" }]);

            expect(registry.getAll()).toHaveLength(2);
        });

        it("returns empty array when nothing registered", () => {
            expect(registry.getAll()).toEqual([]);
        });
    });

    describe("getByModule()", () => {
        it("filters by module", () => {
            registry.registerForModule("warehouse", [
                { key: "create-receipt", name: "Create Receipt" },
                { key: "view-stock", name: "View Stock" },
            ]);
            registry.registerForModule("freight", [{ key: "execute-route", name: "Execute Route" }]);

            const warehousePerms = registry.getByModule("warehouse");

            expect(warehousePerms).toHaveLength(2);
            expect(warehousePerms.every((p) => p.module === "warehouse")).toBe(true);
        });

        it("returns empty array for unknown module", () => {
            registry.registerForModule("warehouse", [{ key: "create-receipt", name: "Create Receipt" }]);

            expect(registry.getByModule("crm")).toEqual([]);
        });
    });

    describe("getAllKeys()", () => {
        it("returns full keys with module prefix", () => {
            registry.registerForModule("warehouse", [{ key: "create-receipt", name: "Create Receipt" }]);
            registry.registerForModule("freight", [{ key: "execute-route", name: "Execute Route" }]);

            const keys = registry.getAllKeys();

            expect(keys.has("warehouse:create-receipt")).toBe(true);
            expect(keys.has("freight:execute-route")).toBe(true);
            expect(keys.size).toBe(2);
        });
    });
});
