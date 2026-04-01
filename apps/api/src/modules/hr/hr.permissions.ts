import { defineModulePermissions } from "../../shared/infrastructure/define-module-permissions.js";

const { Keys, definitions } = defineModulePermissions("hr", {
    MANAGE_AVAILABILITY: {
        key: "manage-availability",
        name: "Manage Availability",
        description: "Confirm/reject availability and set availability without approval",
    },
});

export const HrPermission = Keys;
export type HrPermission = (typeof HrPermission)[keyof typeof HrPermission];
export const hrPermissionDefinitions = definitions;
