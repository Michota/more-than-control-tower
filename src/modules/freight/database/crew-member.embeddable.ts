import { defineEntity, p } from "@mikro-orm/core";
import { CrewMemberRole } from "../domain/crew-member-role.enum.js";

const CrewMemberSchema = defineEntity({
    name: "CrewMemberRecord",
    embeddable: true,
    properties: {
        employeeId: p.string(),
        employeeName: p.string(),
        role: p.enum(() => CrewMemberRole),
    },
});

class CrewMemberRecord extends CrewMemberSchema.class {}

CrewMemberSchema.setClass(CrewMemberRecord);

export { CrewMemberRecord, CrewMemberSchema };
