import type { EntityManager } from "@mikro-orm/core";
import { Seeder } from "@mikro-orm/seeder";
import { SystemUser } from "../../modules/system/database/system-user.entity.js";
import { SystemUserStatus } from "../../modules/system/domain/system-user-status.enum.js";

const DEFAULT_ADMIN_ID = "a0000000-0000-0000-0000-000000000001";

export class AdminUserSeeder extends Seeder {
    async run(em: EntityManager): Promise<void> {
        const existing = await em.findOne(SystemUser, { id: DEFAULT_ADMIN_ID });
        if (existing) {
            return;
        }

        em.create(SystemUser, {
            id: DEFAULT_ADMIN_ID,
            email: "admin@placeholder.local",
            firstName: "System",
            lastName: "Administrator",
            roles: ["administrator"],
            status: SystemUserStatus.ACTIVATED,
        });
    }
}
