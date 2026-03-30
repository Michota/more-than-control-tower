import { Migration } from "@mikro-orm/migrations";

export class Migration20260328122502 extends Migration {
    override async up(): Promise<void> {
        this.addSql(
            `create table "activity" ("id" uuid not null, "name" varchar(255) not null, "description" varchar(255) null, primary key ("id"));`,
        );

        this.addSql(
            `create table "working_hours_entry" ("id" uuid not null, "employee_id" uuid not null, "date" date not null, "hours" numeric(10,0) not null, "note" varchar(255) null, "activity_id" uuid null, "status" text not null, "locked_by" uuid null, primary key ("id"));`,
        );

        this.addSql(
            `alter table "working_hours_entry" add constraint "working_hours_entry_status_check" check ("status" in ('OPEN', 'LOCKED'));`,
        );
    }

    override async down(): Promise<void> {
        this.addSql(`drop table if exists "activity" cascade;`);
        this.addSql(`drop table if exists "working_hours_entry" cascade;`);
    }
}
