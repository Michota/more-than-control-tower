import type { EntityManager } from "@mikro-orm/core";
import { Seeder } from "@mikro-orm/seeder";
import { randomUUID } from "crypto";
import { Position } from "../../modules/hr/database/position.entity.js";

const DEFAULT_POSITIONS = [
    { key: "freight:driver", displayName: "Driver", permissionKeys: [] },
    { key: "freight:dispatcher", displayName: "Dispatcher", permissionKeys: [] },
    { key: "delivery:rsr", displayName: "Sales Representative", permissionKeys: [] },
    { key: "warehouse:worker", displayName: "Warehouse Worker", permissionKeys: [] },
    { key: "hr:worker", displayName: "HR Worker", permissionKeys: [] },
    { key: "accountancy:accountant", displayName: "Accountant", permissionKeys: [] },
];

export class DefaultPositionsSeeder extends Seeder {
    async run(em: EntityManager): Promise<void> {
        for (const pos of DEFAULT_POSITIONS) {
            const existing = await em.findOne(Position, { key: pos.key });
            if (existing) {
                continue;
            }

            em.create(Position, {
                id: randomUUID(),
                key: pos.key,
                displayName: pos.displayName,
                permissionKeys: pos.permissionKeys,
            });
        }
    }
}
