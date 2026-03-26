import { defineEntity, p } from "@mikro-orm/core";
import { PermissionOverrideState } from "../domain/permission-override-state.enum.js";
import { Employee } from "./employee.entity.js";

const PermissionOverrideSchema = defineEntity({
    name: "PermissionOverride",
    tableName: "employee_permission_override",
    properties: {
        id: p.uuid().primary().defaultRaw("gen_random_uuid()"),
        permissionKey: p.string(),
        state: p.enum(() => PermissionOverrideState),
        employee: () => p.manyToOne(Employee).inversedBy("permissionOverrides"),
    },
});

class PermissionOverride extends PermissionOverrideSchema.class {}

PermissionOverrideSchema.setClass(PermissionOverride);

export { PermissionOverride, PermissionOverrideSchema };
