import { defineEntity, p } from "@mikro-orm/core";
import { Employee } from "./employee.entity.js";
import { QualificationAttribute } from "./qualification-attribute.embeddable.js";

const PositionAssignmentSchema = defineEntity({
    name: "PositionAssignment",
    tableName: "employee_position_assignment",
    properties: {
        id: p.uuid().primary().defaultRaw("gen_random_uuid()"),
        positionKey: p.string(),
        assignedAt: p.datetime(),
        qualifications: p.embedded(QualificationAttribute).array().default([]),
        employee: () => p.manyToOne(Employee).inversedBy("positionAssignments"),
    },
});

class PositionAssignment extends PositionAssignmentSchema.class {}

PositionAssignmentSchema.setClass(PositionAssignment);

export { PositionAssignment, PositionAssignmentSchema };
