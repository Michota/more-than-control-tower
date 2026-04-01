import { defineModulePermissions } from "./define-module-permissions.js";

const { Keys, definitions } = defineModulePermissions("erp", {
    CREATE_ACTIVITY: { key: "create-activity", name: "Create Activity" },
    DELETE_ACTIVITY: { key: "delete-activity", name: "Delete Activity" },
    VIEW_ACTIVITIES: { key: "view-activities", name: "View Activities" },
    LOG_WORKING_HOURS: { key: "log-working-hours", name: "Log Working Hours" },
    EDIT_WORKING_HOURS: { key: "edit-working-hours", name: "Edit Working Hours" },
    DELETE_WORKING_HOURS: { key: "delete-working-hours", name: "Delete Working Hours" },
    LOCK_WORKING_HOURS: { key: "lock-working-hours", name: "Lock Working Hours" },
    MANAGE_WORKING_HOURS: {
        key: "manage-working-hours",
        name: "Manage Working Hours",
        description: "View, edit, and lock working hours for any employee",
    },
    VIEW_WORKING_HOURS: { key: "view-working-hours", name: "View Working Hours" },
    VIEW_ACTIVITY_LOG: { key: "view-activity-log", name: "View Activity Log" },
    MANAGE_WALLET: { key: "manage-wallet", name: "Manage Wallet", description: "Credit and debit wallet operations" },
    VIEW_WALLET: { key: "view-wallet", name: "View Wallet", description: "View wallet balance and transactions" },
});

export const ErpPermission = Keys;
export type ErpPermission = (typeof ErpPermission)[keyof typeof ErpPermission];
export const erpPermissionDefinitions = definitions;
