import { Migration } from "@mikro-orm/migrations";

export class Migration20260320160103 extends Migration {
    override async up(): Promise<void> {
        this.addSql(
            `create table "customer" ("id" uuid not null, "name" varchar(255) not null, "description" varchar(255) null, primary key ("id"));`,
        );

        this.addSql(
            `create table "customer_address" ("id" uuid not null, "label" varchar(255) null, "country" varchar(255) not null, "state" varchar(255) not null, "city" varchar(255) not null, "postal_code" varchar(255) not null, "street" varchar(255) not null, "customer_id" uuid not null, primary key ("id"));`,
        );

        this.addSql(
            `create table "customer_contact" ("id" uuid not null, "type" text not null, "title" varchar(255) not null, "description" varchar(255) null, "value" varchar(255) not null, "customer_id" uuid not null, primary key ("id"));`,
        );

        this.addSql(
            `create table "items_category" ("id" uuid not null, "name" varchar(255) not null, "description" varchar(255) null, primary key ("id"));`,
        );

        this.addSql(
            `create table "price_type" ("id" uuid not null, "name" varchar(255) not null, primary key ("id"));`,
        );
        this.addSql(`alter table "price_type" add constraint "price_type_name_unique" unique ("name");`);

        this.addSql(
            `create table "product" ("id" uuid not null, "name" varchar(255) not null, "description" varchar(255) null, "category_id" uuid not null, "vat_rate" numeric(10,0) not null, "available_from" timestamptz not null, "available_to" timestamptz null, primary key ("id"));`,
        );

        this.addSql(
            `create table "price" ("id" uuid not null, "amount" numeric(10,0) not null, "currency" varchar(3) not null, "valid_from" timestamptz not null, "valid_to" timestamptz null, "product_id" uuid not null, "price_type_id" uuid null, primary key ("id"));`,
        );

        this.addSql(
            `create table "order" ("id" uuid not null, "cost" numeric(10,0) null, "currency" varchar(3) not null, "status" text not null, "order_lines" jsonb not null default '[]', "customer_id" uuid not null, primary key ("id"));`,
        );

        this.addSql(
            `alter table "customer_address" add constraint "customer_address_customer_id_foreign" foreign key ("customer_id") references "customer" ("id");`,
        );

        this.addSql(
            `alter table "customer_contact" add constraint "customer_contact_customer_id_foreign" foreign key ("customer_id") references "customer" ("id");`,
        );
        this.addSql(
            `alter table "customer_contact" add constraint "customer_contact_type_check" check ("type" in ('phone', 'email'));`,
        );

        this.addSql(
            `alter table "product" add constraint "product_category_id_foreign" foreign key ("category_id") references "items_category" ("id");`,
        );

        this.addSql(
            `alter table "price" add constraint "price_product_id_foreign" foreign key ("product_id") references "product" ("id");`,
        );
        this.addSql(
            `alter table "price" add constraint "price_price_type_id_foreign" foreign key ("price_type_id") references "price_type" ("id") on delete set null;`,
        );

        this.addSql(
            `alter table "order" add constraint "order_status_check" check ("status" in ('DRAFTED', 'PLACED', 'IN_PROGRESS', 'CANCELLED', 'COMPLETED'));`,
        );
    }

    override async down(): Promise<void> {
        this.addSql(`alter table "customer_address" drop constraint "customer_address_customer_id_foreign";`);
        this.addSql(`alter table "customer_contact" drop constraint "customer_contact_customer_id_foreign";`);
        this.addSql(`alter table "product" drop constraint "product_category_id_foreign";`);
        this.addSql(`alter table "price" drop constraint "price_price_type_id_foreign";`);
        this.addSql(`alter table "price" drop constraint "price_product_id_foreign";`);

        this.addSql(`drop table if exists "customer" cascade;`);
        this.addSql(`drop table if exists "customer_address" cascade;`);
        this.addSql(`drop table if exists "customer_contact" cascade;`);
        this.addSql(`drop table if exists "items_category" cascade;`);
        this.addSql(`drop table if exists "price_type" cascade;`);
        this.addSql(`drop table if exists "product" cascade;`);
        this.addSql(`drop table if exists "price" cascade;`);
        this.addSql(`drop table if exists "order" cascade;`);
    }
}
