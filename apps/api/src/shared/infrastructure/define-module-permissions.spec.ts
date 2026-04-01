import { defineModulePermissions } from "./define-module-permissions.js";

describe("defineModulePermissions", () => {
    it("produces full keys with module prefix", () => {
        const { Keys } = defineModulePermissions("warehouse", {
            CREATE_GOOD: { key: "create-good", name: "Create Good" },
            VIEW_GOODS: { key: "view-goods", name: "View Goods" },
        });

        expect(Keys.CREATE_GOOD).toBe("warehouse:create-good");
        expect(Keys.VIEW_GOODS).toBe("warehouse:view-goods");
    });

    it("returns definitions array matching PermissionInput shape", () => {
        const { definitions } = defineModulePermissions("freight", {
            CREATE_VEHICLE: { key: "create-vehicle", name: "Create Vehicle" },
            DRIVER_LICENSE_C: {
                key: "driver-license-c",
                name: "Driver License Category C",
                description: "Vehicles over 3.5t",
            },
        });

        expect(definitions).toEqual([
            { key: "create-vehicle", name: "Create Vehicle", description: undefined },
            { key: "driver-license-c", name: "Driver License Category C", description: "Vehicles over 3.5t" },
        ]);
    });

    it("definitions are compatible with registerForModule", () => {
        const { definitions } = defineModulePermissions("sales", {
            DRAFT_ORDER: { key: "draft-order", name: "Draft Order" },
        });

        // Each definition has 'key' and 'name' — the required PermissionInput fields
        for (const def of definitions) {
            expect(def).toHaveProperty("key");
            expect(def).toHaveProperty("name");
        }
    });

    it("preserves definition order", () => {
        const { definitions } = defineModulePermissions("erp", {
            FIRST: { key: "first", name: "First" },
            SECOND: { key: "second", name: "Second" },
            THIRD: { key: "third", name: "Third" },
        });

        expect(definitions.map((d) => d.key)).toEqual(["first", "second", "third"]);
    });
});
