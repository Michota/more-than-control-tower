import { Global, Module } from "@nestjs/common";
import { PermissionRegistry, PERMISSION_REGISTRY } from "./permission-registry.js";
import { AUTHORIZATION_PORT } from "../auth/authorization.port.js";
import { HrAuthorizationAdapter } from "../auth/hr-authorization.adapter.js";

@Global()
@Module({
    providers: [
        {
            provide: PERMISSION_REGISTRY,
            useFactory: () => new PermissionRegistry(),
        },
        {
            provide: AUTHORIZATION_PORT,
            useClass: HrAuthorizationAdapter,
        },
    ],
    exports: [PERMISSION_REGISTRY, AUTHORIZATION_PORT],
})
export class PermissionRegistryModule {}
