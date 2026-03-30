import { defineEntity, p } from "@mikro-orm/core";
import { EmployeeStatus } from "../domain/employee-status.enum.js";
import { PositionAssignment } from "./position-assignment.entity.js";
import { PermissionOverride } from "./permission-override.entity.js";

const EmployeeSchema = defineEntity({
    name: "Employee",
    tableName: "employee",
    properties: {
        id: p.uuid().primary(),
        userId: p.string().nullable().unique(),
        firstName: p.string(),
        lastName: p.string(),
        email: p.string().nullable(),
        phone: p.string().nullable(),
        status: p.enum(() => EmployeeStatus),
        positionAssignments: () => p.oneToMany(PositionAssignment).mappedBy("employee").orphanRemoval(),
        permissionOverrides: () => p.oneToMany(PermissionOverride).mappedBy("employee").orphanRemoval(),
    },
});

class Employee extends EmployeeSchema.class {}

EmployeeSchema.setClass(Employee);

export { Employee, EmployeeSchema };
