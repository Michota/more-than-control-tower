import { defineEntity, p } from "@mikro-orm/core";

const AuthCredentialsSchema = defineEntity({
    name: "AuthCredentials",
    tableName: "auth_credentials",
    properties: {
        id: p.uuid().primary(),
        userId: p.uuid().unique(),
        passwordHash: p.string(),
    },
});

class AuthCredentials extends AuthCredentialsSchema.class {}

AuthCredentialsSchema.setClass(AuthCredentials);

export { AuthCredentials, AuthCredentialsSchema };
