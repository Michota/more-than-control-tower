import { Migration } from "@mikro-orm/migrations";

export class Migration20260326082314 extends Migration {
    override async up(): Promise<void> {
        this.addSql(
            `create table if not exists "employee" ("id" uuid not null, "user_id" varchar(255) null, "first_name" varchar(255) not null, "last_name" varchar(255) not null, "email" varchar(255) null, "phone" varchar(255) null, "status" text not null, primary key ("id"));`,
        );
        this.addSql(`
            do $$ begin
                if not exists (select 1 from pg_constraint where conname = 'employee_user_id_unique') then
                    alter table "employee" add constraint "employee_user_id_unique" unique ("user_id");
                end if;
            end $$;
        `);

        this.addSql(
            `create table if not exists "employee_permission_override" ("id" uuid not null default gen_random_uuid(), "permission_key" varchar(255) not null, "state" text not null, "employee_id" uuid not null, primary key ("id"));`,
        );

        this.addSql(
            `create table if not exists "employee_position_assignment" ("id" uuid not null default gen_random_uuid(), "position_key" varchar(255) not null, "assigned_at" timestamptz not null, "qualifications" jsonb not null default '[]', "employee_id" uuid not null, primary key ("id"));`,
        );

        this.addSql(
            `create table if not exists "system_user" ("id" uuid not null, "email" varchar(255) not null, "first_name" varchar(255) not null, "last_name" varchar(255) not null, "roles" text[] not null, "status" text not null, primary key ("id"));`,
        );
        this.addSql(`
            do $$ begin
                if not exists (select 1 from pg_constraint where conname = 'system_user_email_unique') then
                    alter table "system_user" add constraint "system_user_email_unique" unique ("email");
                end if;
            end $$;
        `);

        this.addSql(`
            do $$ begin
                if not exists (select 1 from pg_constraint where conname = 'employee_status_check') then
                    alter table "employee" add constraint "employee_status_check" check ("status" in ('active', 'inactive'));
                end if;
            end $$;
        `);

        this.addSql(`
            do $$ begin
                if not exists (select 1 from pg_constraint where conname = 'employee_permission_override_employee_id_foreign') then
                    alter table "employee_permission_override" add constraint "employee_permission_override_employee_id_foreign" foreign key ("employee_id") references "employee" ("id");
                end if;
            end $$;
        `);
        this.addSql(`
            do $$ begin
                if not exists (select 1 from pg_constraint where conname = 'employee_permission_override_state_check') then
                    alter table "employee_permission_override" add constraint "employee_permission_override_state_check" check ("state" in ('allowed', 'denied'));
                end if;
            end $$;
        `);

        this.addSql(`
            do $$ begin
                if not exists (select 1 from pg_constraint where conname = 'employee_position_assignment_employee_id_foreign') then
                    alter table "employee_position_assignment" add constraint "employee_position_assignment_employee_id_foreign" foreign key ("employee_id") references "employee" ("id");
                end if;
            end $$;
        `);

        this.addSql(`
            do $$ begin
                if not exists (select 1 from pg_constraint where conname = 'system_user_status_check') then
                    alter table "system_user" add constraint "system_user_status_check" check ("status" in ('unactivated', 'activated', 'suspended'));
                end if;
            end $$;
        `);

        this.addSql(`alter table "customer" add column if not exists "customer_type" text not null default 'b2c';`);
        this.addSql(`alter table "customer" add column if not exists "note" varchar(255) null;`);
        this.addSql(`alter table "customer" add column if not exists "first_name" varchar(255) null;`);
        this.addSql(`alter table "customer" add column if not exists "last_name" varchar(255) null;`);
        this.addSql(`alter table "customer" add column if not exists "company_name" varchar(255) null;`);
        this.addSql(`alter table "customer" add column if not exists "nip" varchar(255) null;`);
        this.addSql(`
            do $$ begin
                if not exists (select 1 from pg_constraint where conname = 'customer_customer_type_check') then
                    alter table "customer" add constraint "customer_customer_type_check" check ("customer_type" in ('b2c', 'b2b', 'b2a'));
                end if;
            end $$;
        `);

        this.addSql(`alter table "customer_address" add column if not exists "note" varchar(255) null;`);

        this.addSql(`alter table "customer_contact" drop constraint if exists "customer_contact_type_check";`);
        this.addSql(`alter table "customer_contact" add column if not exists "note" varchar(255) null;`);
        this.addSql(`alter table "customer_contact" add column if not exists "custom_label" varchar(255) null;`);
        this.addSql(`alter table "customer_contact" add column if not exists "history" jsonb not null default '[]';`);
        this.addSql(
            `alter table "customer_contact" add constraint "customer_contact_type_check" check ("type" in ('phone', 'email', 'custom'));`,
        );
    }

    override async down(): Promise<void> {
        this.addSql(
            `alter table "employee_permission_override" drop constraint "employee_permission_override_employee_id_foreign";`,
        );
        this.addSql(
            `alter table "employee_position_assignment" drop constraint "employee_position_assignment_employee_id_foreign";`,
        );

        this.addSql(`drop table if exists "employee" cascade;`);
        this.addSql(`drop table if exists "employee_permission_override" cascade;`);
        this.addSql(`drop table if exists "employee_position_assignment" cascade;`);
        this.addSql(`drop table if exists "system_user" cascade;`);

        this.addSql(`alter table "customer" drop constraint "customer_customer_type_check";`);
        this.addSql(
            `alter table "customer" drop column "customer_type", drop column "note", drop column "first_name", drop column "last_name", drop column "company_name", drop column "nip";`,
        );

        this.addSql(`alter table "customer_address" drop column "note";`);

        this.addSql(`alter table "customer_contact" drop constraint "customer_contact_type_check";`);
        this.addSql(
            `alter table "customer_contact" drop column "note", drop column "custom_label", drop column "history";`,
        );
        this.addSql(
            `alter table "customer_contact" add constraint "customer_contact_type_check" check ("type" in ('phone', 'email'));`,
        );
    }
}
