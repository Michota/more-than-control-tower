import { Migration } from "@mikro-orm/migrations";

export class Migration20260326100000 extends Migration {
    override async up(): Promise<void> {
        // employee table
        this.addSql(`
            create table "employee" (
                "id" uuid not null,
                "user_id" varchar(255) null,
                "first_name" varchar(255) not null,
                "last_name" varchar(255) not null,
                "email" varchar(255) null,
                "phone" varchar(255) null,
                "status" text not null,
                constraint "employee_pkey" primary key ("id"),
                constraint "employee_status_check" check ("status" in ('active', 'inactive'))
            );
        `);
        this.addSql(`alter table "employee" add constraint "employee_user_id_unique" unique ("user_id");`);

        // employee_position_assignment table
        this.addSql(`
            create table "employee_position_assignment" (
                "id" uuid not null default gen_random_uuid(),
                "position_key" varchar(255) not null,
                "assigned_at" timestamptz not null,
                "qualifications" jsonb not null default '[]',
                "employee_id" uuid not null,
                constraint "employee_position_assignment_pkey" primary key ("id"),
                constraint "employee_position_assignment_employee_id_fkey"
                    foreign key ("employee_id") references "employee" ("id")
                    on update cascade on delete cascade
            );
        `);

        // employee_permission_override table
        this.addSql(`
            create table "employee_permission_override" (
                "id" uuid not null default gen_random_uuid(),
                "permission_key" varchar(255) not null,
                "state" text not null,
                "employee_id" uuid not null,
                constraint "employee_permission_override_pkey" primary key ("id"),
                constraint "employee_permission_override_state_check" check ("state" in ('allowed', 'denied')),
                constraint "employee_permission_override_employee_id_fkey"
                    foreign key ("employee_id") references "employee" ("id")
                    on update cascade on delete cascade
            );
        `);
    }

    override async down(): Promise<void> {
        this.addSql(`drop table if exists "employee_permission_override" cascade;`);
        this.addSql(`drop table if exists "employee_position_assignment" cascade;`);
        this.addSql(`drop table if exists "employee" cascade;`);
    }
}
