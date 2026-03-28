export const FreightPermission = {
    // Vehicles
    CREATE_VEHICLE: "freight:create-vehicle",
    EDIT_VEHICLE: "freight:edit-vehicle",
    CHANGE_VEHICLE_STATUS: "freight:change-vehicle-status",
    VIEW_VEHICLES: "freight:view-vehicles",

    // Routes
    CREATE_ROUTE: "freight:create-route",
    EDIT_ROUTE: "freight:edit-route",
    ARCHIVE_ROUTE: "freight:archive-route",
    CHANGE_ROUTE_STATUS: "freight:change-route-status",
    VIEW_ROUTES: "freight:view-routes",

    // Journeys
    CREATE_JOURNEY: "freight:create-journey",
    START_JOURNEY: "freight:start-journey",
    COMPLETE_JOURNEY: "freight:complete-journey",
    CANCEL_JOURNEY: "freight:cancel-journey",
    VIEW_JOURNEYS: "freight:view-journeys",

    // Driver License Categories (published for other modules)
    DRIVER_LICENSE_B: "freight:driver-license-b",
    DRIVER_LICENSE_C: "freight:driver-license-c",
    DRIVER_LICENSE_C_E: "freight:driver-license-c-e",
} as const;

export type FreightPermission = (typeof FreightPermission)[keyof typeof FreightPermission];
