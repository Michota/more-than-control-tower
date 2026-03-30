import { defineEntity, p } from "@mikro-orm/core";

const CrewMemberSchema = defineEntity({
    name: "CrewMemberRecord",
    embeddable: true,
    properties: {
        employeeId: p.string(),
        employeeName: p.string(),
        role: p.string(),
    },
});

class CrewMemberRecord extends CrewMemberSchema.class {}

CrewMemberSchema.setClass(CrewMemberRecord);

export { CrewMemberRecord, CrewMemberSchema };
