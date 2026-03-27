import { defineEntity, p } from "@mikro-orm/core";
import { SystemUserStatus } from "../domain/system-user-status.enum.js";

const SystemUserSchema = defineEntity({
    name: "SystemUser",
    tableName: "system_user",
    properties: {
        id: p.uuid().primary(),
        email: p.string().unique(),
        name: p.string(),
        roles: p.array(),
        status: p.enum(() => SystemUserStatus),
    },
});

class SystemUser extends SystemUserSchema.class {}

SystemUserSchema.setClass(SystemUser);

export { SystemUser, SystemUserSchema };
