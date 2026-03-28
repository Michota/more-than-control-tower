import z from "zod";
import { ValueObjectWithSchema } from "../../../shared/ddd/value-object-with-schema.abstract.js";
import { CrewMemberRole } from "./crew-member-role.enum.js";

const crewMemberSchema = z.object({
    employeeId: z.string().min(1),
    employeeName: z.string().min(1),
    role: z.enum(CrewMemberRole),
});

export type CrewMemberProperties = z.infer<typeof crewMemberSchema>;

export class CrewMember extends ValueObjectWithSchema<CrewMemberProperties> {
    protected get schema() {
        return crewMemberSchema;
    }

    get employeeId(): string {
        return this.properties.employeeId;
    }

    get employeeName(): string {
        return this.properties.employeeName;
    }

    get role(): CrewMemberRole {
        return this.properties.role;
    }
}
