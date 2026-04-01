import { defineModulePermissions } from "./define-module-permissions.js";

const { Keys, definitions } = defineModulePermissions("hr", {
    MANAGE_AVAILABILITY: {
        key: "manage-availability",
        messageKey: "permission_hr_manage_availability",
        descriptionKey: "permission_hr_manage_availability_desc",
    },
});

export const HrPermission = Keys;
export type HrPermission = (typeof HrPermission)[keyof typeof HrPermission];
export const hrPermissionDefinitions = definitions;
