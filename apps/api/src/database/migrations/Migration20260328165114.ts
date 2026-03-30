import { Migration } from "@mikro-orm/migrations";

export class Migration20260328165114 extends Migration {
    override async up(): Promise<void> {
        this.addSql(
            `create table "activity_log_entry" ("id" uuid not null, "employee_id" uuid not null, "action" varchar(255) not null, "details" varchar(255) null, "occurred_at" timestamptz not null, primary key ("id"));`,
        );
    }

    override async down(): Promise<void> {
        this.addSql(`drop table if exists "activity_log_entry" cascade;`);
    }
}
