import { Migration } from "@mikro-orm/migrations";

export class Migration20260324174702 extends Migration {
    override async up(): Promise<void> {
        this.addSql(
            `create table "sector" ("id" uuid not null, "name" varchar(255) not null, "description" varchar(255) null, "warehouse_id" uuid not null, "dimension_length" numeric(10,0) not null, "dimension_width" numeric(10,0) not null, "dimension_height" numeric(10,0) not null, "dimension_unit" varchar(255) not null, "capabilities" jsonb not null, "status" text not null, primary key ("id"));`,
        );

        this.addSql(
            `alter table "sector" add constraint "sector_status_check" check ("status" in ('ACTIVE', 'INACTIVE'));`,
        );

        this.addSql(`alter table "stock_entry" add "sector_id" uuid null;`);

        this.addSql(`alter table "warehouse" add "type" text not null;`);
        this.addSql(
            `alter table "warehouse" add constraint "warehouse_type_check" check ("type" in ('REGULAR', 'MOBILE'));`,
        );
    }

    override async down(): Promise<void> {
        this.addSql(`drop table if exists "sector" cascade;`);

        this.addSql(`alter table "stock_entry" drop column "sector_id";`);

        this.addSql(`alter table "warehouse" drop constraint "warehouse_type_check";`);
        this.addSql(`alter table "warehouse" drop column "type";`);
    }
}
