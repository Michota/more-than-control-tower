import { Global, Module } from "@nestjs/common";
import { PermissionRegistry, PERMISSION_REGISTRY } from "./permission-registry.js";

@Global()
@Module({
    providers: [
        {
            provide: PERMISSION_REGISTRY,
            useFactory: () => new PermissionRegistry(),
        },
    ],
    exports: [PERMISSION_REGISTRY],
})
export class PermissionRegistryModule {}
