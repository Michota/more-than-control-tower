export const ErpPermission = {
    CREATE_ACTIVITY: "erp:create-activity",
    DELETE_ACTIVITY: "erp:delete-activity",
    VIEW_ACTIVITIES: "erp:view-activities",
    LOG_WORKING_HOURS: "erp:log-working-hours",
    EDIT_WORKING_HOURS: "erp:edit-working-hours",
    DELETE_WORKING_HOURS: "erp:delete-working-hours",
    LOCK_WORKING_HOURS: "erp:lock-working-hours",
    VIEW_WORKING_HOURS: "erp:view-working-hours",
    MANAGE_WORKING_HOURS: "erp:manage-working-hours",
    VIEW_ACTIVITY_LOG: "erp:view-activity-log",
} as const;

export type ErpPermission = (typeof ErpPermission)[keyof typeof ErpPermission];
