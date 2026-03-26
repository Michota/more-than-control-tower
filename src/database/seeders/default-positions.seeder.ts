import type { EntityManager } from "@mikro-orm/core";
import { Seeder } from "@mikro-orm/seeder";
import { randomUUID } from "crypto";
import { Position } from "../../modules/hr/database/position.entity.js";

const DEFAULT_POSITIONS = [
    {
        key: "freight:driver",
        displayName: "Driver",
        qualificationSchema: [
            {
                key: "licenseCategory",
                type: "STRING",
                description: "Driving license category (e.g., B, C, CE)",
                required: true,
            },
        ],
        permissionKeys: [],
    },
    {
        key: "freight:dispatcher",
        displayName: "Dispatcher",
        qualificationSchema: [],
        permissionKeys: [],
    },
    {
        key: "delivery:rsr",
        displayName: "Sales Representative",
        qualificationSchema: [],
        permissionKeys: [],
    },
    {
        key: "warehouse:worker",
        displayName: "Warehouse Worker",
        qualificationSchema: [
            { key: "productHandling", type: "STRING_ARRAY", description: "Product categories the worker can handle" },
        ],
        permissionKeys: [],
    },
    {
        key: "hr:worker",
        displayName: "HR Worker",
        qualificationSchema: [],
        permissionKeys: [],
    },
    {
        key: "accountancy:accountant",
        displayName: "Accountant",
        qualificationSchema: [],
        permissionKeys: [],
    },
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
                qualificationSchema: pos.qualificationSchema,
                permissionKeys: pos.permissionKeys,
            });
        }
    }
}
