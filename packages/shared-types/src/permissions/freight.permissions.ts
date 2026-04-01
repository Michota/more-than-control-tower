import { defineModulePermissions } from "./define-module-permissions.js";

const { Keys, definitions } = defineModulePermissions("freight", {
    // Vehicles
    CREATE_VEHICLE: { key: "create-vehicle", messageKey: "permission_freight_create_vehicle" },
    EDIT_VEHICLE: { key: "edit-vehicle", messageKey: "permission_freight_edit_vehicle" },
    CHANGE_VEHICLE_STATUS: { key: "change-vehicle-status", messageKey: "permission_freight_change_vehicle_status" },
    VIEW_VEHICLES: { key: "view-vehicles", messageKey: "permission_freight_view_vehicles" },

    // Routes
    CREATE_ROUTE: { key: "create-route", messageKey: "permission_freight_create_route" },
    EDIT_ROUTE: { key: "edit-route", messageKey: "permission_freight_edit_route" },
    ARCHIVE_ROUTE: { key: "archive-route", messageKey: "permission_freight_archive_route" },
    CHANGE_ROUTE_STATUS: { key: "change-route-status", messageKey: "permission_freight_change_route_status" },
    VIEW_ROUTES: { key: "view-routes", messageKey: "permission_freight_view_routes" },

    // Journeys
    CREATE_JOURNEY: { key: "create-journey", messageKey: "permission_freight_create_journey" },
    START_JOURNEY: { key: "start-journey", messageKey: "permission_freight_start_journey" },
    COMPLETE_JOURNEY: { key: "complete-journey", messageKey: "permission_freight_complete_journey" },
    CANCEL_JOURNEY: { key: "cancel-journey", messageKey: "permission_freight_cancel_journey" },
    VIEW_JOURNEYS: { key: "view-journeys", messageKey: "permission_freight_view_journeys" },

    // Driver License Categories
    DRIVER_LICENSE_B: {
        key: "driver-license-b",
        messageKey: "permission_freight_driver_license_b",
        descriptionKey: "permission_freight_driver_license_b_desc",
    },
    DRIVER_LICENSE_C: {
        key: "driver-license-c",
        messageKey: "permission_freight_driver_license_c",
        descriptionKey: "permission_freight_driver_license_c_desc",
    },
    DRIVER_LICENSE_C_E: {
        key: "driver-license-c-e",
        messageKey: "permission_freight_driver_license_c_e",
        descriptionKey: "permission_freight_driver_license_c_e_desc",
    },
});

export const FreightPermission = Keys;
export type FreightPermission = (typeof FreightPermission)[keyof typeof FreightPermission];
export const freightPermissionDefinitions = definitions;
