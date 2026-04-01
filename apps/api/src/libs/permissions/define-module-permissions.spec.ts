import { defineModulePermissions } from "@mtct/shared-types";

describe("defineModulePermissions", () => {
    it("produces full keys with module prefix", () => {
        const { Keys } = defineModulePermissions("warehouse", {
            CREATE_GOOD: { key: "create-good", messageKey: "permission_warehouse_create_good" },
            VIEW_GOODS: { key: "view-goods", messageKey: "permission_warehouse_view_goods" },
        });

        expect(Keys.CREATE_GOOD).toBe("warehouse:create-good");
        expect(Keys.VIEW_GOODS).toBe("warehouse:view-goods");
    });

    it("returns definitions array matching PermissionInput shape", () => {
        const { definitions } = defineModulePermissions("freight", {
            CREATE_VEHICLE: { key: "create-vehicle", messageKey: "permission_freight_create_vehicle" },
            DRIVER_LICENSE_C: {
                key: "driver-license-c",
                messageKey: "permission_freight_driver_license_c",
                descriptionKey: "permission_freight_driver_license_c_desc",
            },
        });

        expect(definitions).toEqual([
            { key: "create-vehicle", messageKey: "permission_freight_create_vehicle", descriptionKey: undefined },
            {
                key: "driver-license-c",
                messageKey: "permission_freight_driver_license_c",
                descriptionKey: "permission_freight_driver_license_c_desc",
            },
        ]);
    });

    it("definitions are compatible with registerForModule", () => {
        const { definitions } = defineModulePermissions("sales", {
            DRAFT_ORDER: { key: "draft-order", messageKey: "permission_sales_draft_order" },
        });

        for (const def of definitions) {
            expect(def).toHaveProperty("key");
            expect(def).toHaveProperty("messageKey");
        }
    });

    it("preserves definition order", () => {
        const { definitions } = defineModulePermissions("erp", {
            FIRST: { key: "first", messageKey: "permission_erp_first" },
            SECOND: { key: "second", messageKey: "permission_erp_second" },
            THIRD: { key: "third", messageKey: "permission_erp_third" },
        });

        expect(definitions.map((d) => d.key)).toEqual(["first", "second", "third"]);
    });
});
