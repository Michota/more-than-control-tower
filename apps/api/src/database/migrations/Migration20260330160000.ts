import { Migration } from "@mikro-orm/migrations";

export class Migration20260330160000 extends Migration {
    override async up(): Promise<void> {
        this.addSql(
            `create table "employee_availability_entry" ("id" uuid not null, "employee_id" uuid not null, "date" varchar(255) not null, "start_time" varchar(255) not null, "end_time" varchar(255) not null, "status" text not null, "locked" boolean not null default false, primary key ("id"));`,
        );

        this.addSql(
            `alter table "employee_availability_entry" add constraint "employee_availability_entry_status_check" check ("status" in ('pending_approval', 'confirmed'));`,
        );
    }

    override async down(): Promise<void> {
        this.addSql(`drop table if exists "employee_availability_entry" cascade;`);
    }
}
