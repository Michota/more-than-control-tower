import { defineEntity, p } from "@mikro-orm/core";
import { SystemUser } from "../../system/database/system-user.entity.js";

const AuthCredentialsSchema = defineEntity({
    name: "AuthCredentials",
    tableName: "auth_credentials",
    properties: {
        id: p.uuid().primary(),
        systemUser: () => p.manyToOne(SystemUser).fieldName("user_id").deleteRule("cascade").unique(),
        passwordHash: p.string(),
    },
});

class AuthCredentials extends AuthCredentialsSchema.class {}

AuthCredentialsSchema.setClass(AuthCredentials);

export { AuthCredentials, AuthCredentialsSchema };
