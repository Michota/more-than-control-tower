import { defineModulePermissions } from "../../shared/infrastructure/define-module-permissions.js";

const { Keys, definitions } = defineModulePermissions("freight", {
    // Vehicles
    CREATE_VEHICLE: { key: "create-vehicle", name: "Create Vehicle" },
    EDIT_VEHICLE: { key: "edit-vehicle", name: "Edit Vehicle" },
    CHANGE_VEHICLE_STATUS: { key: "change-vehicle-status", name: "Change Vehicle Status" },
    VIEW_VEHICLES: { key: "view-vehicles", name: "View Vehicles" },

    // Routes
    CREATE_ROUTE: { key: "create-route", name: "Create Route" },
    EDIT_ROUTE: { key: "edit-route", name: "Edit Route" },
    ARCHIVE_ROUTE: { key: "archive-route", name: "Archive Route" },
    CHANGE_ROUTE_STATUS: { key: "change-route-status", name: "Change Route Status" },
    VIEW_ROUTES: { key: "view-routes", name: "View Routes" },

    // Journeys
    CREATE_JOURNEY: { key: "create-journey", name: "Create Journey" },
    START_JOURNEY: { key: "start-journey", name: "Start Journey" },
    COMPLETE_JOURNEY: { key: "complete-journey", name: "Complete Journey" },
    CANCEL_JOURNEY: { key: "cancel-journey", name: "Cancel Journey" },
    VIEW_JOURNEYS: { key: "view-journeys", name: "View Journeys" },

    // Driver License Categories (capability permissions, used by other modules via FindEmployeesByPermissionQuery)
    DRIVER_LICENSE_B: { key: "driver-license-b", name: "Driver License Category B", description: "Vehicles up to 3.5t" },
    DRIVER_LICENSE_C: { key: "driver-license-c", name: "Driver License Category C", description: "Vehicles over 3.5t" },
    DRIVER_LICENSE_C_E: {
        key: "driver-license-c-e",
        name: "Driver License Category C+E",
        description: "Vehicles over 3.5t with trailer",
    },
});

export const FreightPermission = Keys;
export type FreightPermission = (typeof FreightPermission)[keyof typeof FreightPermission];
export const freightPermissionDefinitions = definitions;
