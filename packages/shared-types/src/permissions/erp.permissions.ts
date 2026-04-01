import { defineModulePermissions } from "./define-module-permissions.js";

const { Keys, definitions } = defineModulePermissions("erp", {
    CREATE_ACTIVITY: { key: "create-activity", messageKey: "permission_erp_create_activity" },
    DELETE_ACTIVITY: { key: "delete-activity", messageKey: "permission_erp_delete_activity" },
    VIEW_ACTIVITIES: { key: "view-activities", messageKey: "permission_erp_view_activities" },
    LOG_WORKING_HOURS: { key: "log-working-hours", messageKey: "permission_erp_log_working_hours" },
    EDIT_WORKING_HOURS: { key: "edit-working-hours", messageKey: "permission_erp_edit_working_hours" },
    DELETE_WORKING_HOURS: { key: "delete-working-hours", messageKey: "permission_erp_delete_working_hours" },
    LOCK_WORKING_HOURS: { key: "lock-working-hours", messageKey: "permission_erp_lock_working_hours" },
    MANAGE_WORKING_HOURS: {
        key: "manage-working-hours",
        messageKey: "permission_erp_manage_working_hours",
        descriptionKey: "permission_erp_manage_working_hours_desc",
    },
    VIEW_WORKING_HOURS: { key: "view-working-hours", messageKey: "permission_erp_view_working_hours" },
    VIEW_ACTIVITY_LOG: { key: "view-activity-log", messageKey: "permission_erp_view_activity_log" },
    MANAGE_WALLET: {
        key: "manage-wallet",
        messageKey: "permission_erp_manage_wallet",
        descriptionKey: "permission_erp_manage_wallet_desc",
    },
    VIEW_WALLET: {
        key: "view-wallet",
        messageKey: "permission_erp_view_wallet",
        descriptionKey: "permission_erp_view_wallet_desc",
    },
});

export const ErpPermission = Keys;
export type ErpPermission = (typeof ErpPermission)[keyof typeof ErpPermission];
export const erpPermissionDefinitions = definitions;
