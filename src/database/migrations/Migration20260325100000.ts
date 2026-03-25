import { Migration } from "@mikro-orm/migrations";

export class Migration20260325100000 extends Migration {
    override async up(): Promise<void> {
        // customer: add type-specific fields and note
        this.addSql(`alter table "customer" add column "customer_type" text not null default 'b2c';`);
        this.addSql(`alter table "customer" add column "note" text null;`);
        this.addSql(`alter table "customer" add column "first_name" varchar(255) null;`);
        this.addSql(`alter table "customer" add column "last_name" varchar(255) null;`);
        this.addSql(`alter table "customer" add column "company_name" varchar(255) null;`);
        this.addSql(`alter table "customer" add column "nip" varchar(255) null;`);
        this.addSql(
            `alter table "customer" add constraint "customer_customer_type_check" check ("customer_type" in ('b2c', 'b2b', 'b2a'));`,
        );

        // customer_contact: add custom label, note, and history
        this.addSql(`alter table "customer_contact" add column "custom_label" varchar(255) null;`);
        this.addSql(`alter table "customer_contact" add column "note" text null;`);
        this.addSql(`alter table "customer_contact" add column "history" jsonb not null default '[]';`);

        // update type check constraint to include 'custom'
        this.addSql(`alter table "customer_contact" drop constraint "customer_contact_type_check";`);
        this.addSql(
            `alter table "customer_contact" add constraint "customer_contact_type_check" check ("type" in ('phone', 'email', 'custom'));`,
        );

        // customer_address: add note
        this.addSql(`alter table "customer_address" add column "note" text null;`);
    }

    override async down(): Promise<void> {
        this.addSql(`alter table "customer" drop constraint "customer_customer_type_check";`);
        this.addSql(`alter table "customer" drop column "customer_type";`);
        this.addSql(`alter table "customer" drop column "note";`);
        this.addSql(`alter table "customer" drop column "first_name";`);
        this.addSql(`alter table "customer" drop column "last_name";`);
        this.addSql(`alter table "customer" drop column "company_name";`);
        this.addSql(`alter table "customer" drop column "nip";`);

        this.addSql(`alter table "customer_contact" drop column "custom_label";`);
        this.addSql(`alter table "customer_contact" drop column "note";`);
        this.addSql(`alter table "customer_contact" drop column "history";`);
        this.addSql(`alter table "customer_contact" drop constraint "customer_contact_type_check";`);
        this.addSql(
            `alter table "customer_contact" add constraint "customer_contact_type_check" check ("type" in ('phone', 'email'));`,
        );

        this.addSql(`alter table "customer_address" drop column "note";`);
    }
}
