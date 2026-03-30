import { Migration } from "@mikro-orm/migrations";

export class Migration20260326110000 extends Migration {
    override async up(): Promise<void> {
        this.addSql(`
            create table if not exists "position" (
                "id" uuid not null,
                "key" varchar(255) not null,
                "display_name" varchar(255) not null,
                "permission_keys" jsonb not null default '[]',
                constraint "position_pkey" primary key ("id"),
                constraint "position_key_unique" unique ("key")
            );
        `);
    }

    override async down(): Promise<void> {
        this.addSql(`drop table if exists "position" cascade;`);
    }
}
