import type { EntityManager } from "@mikro-orm/core";
import { Seeder } from "@mikro-orm/seeder";
import { AdminUserSeeder } from "./admin-user.seeder.js";
import { DefaultPositionsSeeder } from "./default-positions.seeder.js";

export class DatabaseSeeder extends Seeder {
    async run(em: EntityManager): Promise<void> {
        return this.call(em, [AdminUserSeeder, DefaultPositionsSeeder]);
    }
}
