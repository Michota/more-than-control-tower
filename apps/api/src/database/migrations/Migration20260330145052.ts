import { Migration } from "@mikro-orm/migrations";

export class Migration20260330145052 extends Migration {
    override async up(): Promise<void> {
        this.addSql(
            `create table "wallet" ("id" uuid not null, "employee_id" uuid not null, "currency" varchar(3) not null, primary key ("id"));`,
        );
        this.addSql(`alter table "wallet" add constraint "wallet_employee_id_unique" unique ("employee_id");`);

        this.addSql(
            `create table "wallet_transaction" ("id" uuid not null, "wallet_id" uuid not null, "type" text not null, "amount" numeric(10,0) not null, "currency" varchar(3) not null, "method" text not null, "reason" varchar(255) not null, "initiated_by" uuid not null, "occurred_at" timestamptz not null, primary key ("id"));`,
        );

        this.addSql(
            `alter table "wallet_transaction" add constraint "wallet_transaction_type_check" check ("type" in ('CREDIT', 'DEBIT', 'CHARGE'));`,
        );
        this.addSql(
            `alter table "wallet_transaction" add constraint "wallet_transaction_method_check" check ("method" in ('CASH', 'TRANSFER', 'OTHER'));`,
        );
    }

    override async down(): Promise<void> {
        this.addSql(`drop table if exists "wallet_transaction" cascade;`);
        this.addSql(`drop table if exists "wallet" cascade;`);
    }
}
