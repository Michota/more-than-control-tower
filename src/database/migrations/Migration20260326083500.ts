import { Migration } from "@mikro-orm/migrations";

export class Migration20260326083500 extends Migration {
    override async up(): Promise<void> {
        this.addSql(`
      insert into "system_user" ("id", "email", "first_name", "last_name", "roles", "status")
      values (
        'a0000000-0000-0000-0000-000000000001',
        'admin@placeholder.local',
        'System',
        'Administrator',
        '{administrator}',
        'activated'
      )
      on conflict ("id") do nothing;
    `);
    }

    override async down(): Promise<void> {
        this.addSql(`delete from "system_user" where "id" = 'a0000000-0000-0000-0000-000000000001';`);
    }
}
