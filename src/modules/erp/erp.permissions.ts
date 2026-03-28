export const ErpPermission = {
    CREATE_ACTIVITY: "erp:create-activity",
    VIEW_ACTIVITIES: "erp:view-activities",
    LOG_WORKING_HOURS: "erp:log-working-hours",
    EDIT_WORKING_HOURS: "erp:edit-working-hours",
    LOCK_WORKING_HOURS: "erp:lock-working-hours",
    VIEW_WORKING_HOURS: "erp:view-working-hours",
} as const;

export type ErpPermission = (typeof ErpPermission)[keyof typeof ErpPermission];
