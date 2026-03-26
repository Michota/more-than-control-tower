import { ValueObjectWithSchema } from "../../../shared/ddd/value-object-with-schema.abstract.js";
import z from "zod";
import { PermissionOverrideState } from "./permission-override-state.enum.js";

const permissionOverrideSchema = z.object({
    permissionKey: z.string().min(1),
    state: z.enum(PermissionOverrideState),
});

export type PermissionOverrideProperties = z.infer<typeof permissionOverrideSchema>;

export class PermissionOverride extends ValueObjectWithSchema<PermissionOverrideProperties> {
    protected get schema() {
        return permissionOverrideSchema;
    }

    get permissionKey(): string {
        return this.properties.permissionKey;
    }

    get state(): PermissionOverrideState {
        return this.properties.state;
    }
}
