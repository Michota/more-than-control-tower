import { Migration } from "@mikro-orm/migrations";

export class Migration20260328112642 extends Migration {
    override async up(): Promise<void> {
        this.addSql(
            `create table "journey" ("id" uuid not null, "route_id" uuid not null, "route_name" varchar(255) not null, "status" text not null, "scheduled_date" varchar(255) not null, "vehicle_ids" text[] not null default '{}', "representative_ids" text[] not null default '{}', "stops" jsonb not null default '[]', primary key ("id"));`,
        );

        this.addSql(
            `create table "route" ("id" uuid not null, "name" varchar(255) not null, "status" text not null, "vehicle_ids" text[] not null default '{}', "representative_ids" text[] not null default '{}', "stops" jsonb not null default '[]', "schedule_type" text null, "schedule_days_of_week" text[] null, "schedule_days_of_month" text[] null, "schedule_specific_dates" text[] null, primary key ("id"));`,
        );

        this.addSql(
            `create table "vehicle" ("id" uuid not null, "name" varchar(255) not null, "status" text not null, "required_license_category" text not null, "attributes" jsonb not null default '[]', "vin" varchar(255) null, "license_plate" varchar(255) null, "note" varchar(255) null, "warehouse_id" uuid null, primary key ("id"));`,
        );

        this.addSql(
            `alter table "journey" add constraint "journey_status_check" check ("status" in ('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'));`,
        );

        this.addSql(
            `alter table "route" add constraint "route_status_check" check ("status" in ('ACTIVE', 'INACTIVE', 'ARCHIVED'));`,
        );
        this.addSql(
            `alter table "route" add constraint "route_schedule_type_check" check ("schedule_type" in ('DAYS_OF_WEEK', 'DAYS_OF_MONTH', 'SPECIFIC_DATES'));`,
        );

        this.addSql(
            `alter table "vehicle" add constraint "vehicle_status_check" check ("status" in ('ACTIVE', 'INACTIVE'));`,
        );
        this.addSql(
            `alter table "vehicle" add constraint "vehicle_required_license_category_check" check ("required_license_category" in ('B', 'C', 'C+E'));`,
        );
    }

    override async down(): Promise<void> {
        this.addSql(`drop table if exists "journey" cascade;`);
        this.addSql(`drop table if exists "route" cascade;`);
        this.addSql(`drop table if exists "vehicle" cascade;`);
    }
}
