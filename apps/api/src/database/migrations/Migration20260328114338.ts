import { Migration } from "@mikro-orm/migrations";

export class Migration20260328114338 extends Migration {
    override async up(): Promise<void> {
        this.addSql(
            `create table "stock_transfer_request" ("id" uuid not null, "good_id" uuid not null, "quantity" int not null, "from_warehouse_id" uuid not null, "to_warehouse_id" uuid not null, "status" text not null, "note" varchar(255) null, "requested_by" varchar(255) null, "rejection_reason" varchar(255) null, primary key ("id"));`,
        );

        this.addSql(
            `alter table "stock_transfer_request" add constraint "stock_transfer_request_status_check" check ("status" in ('PENDING', 'FULFILLED', 'CANCELLED', 'REJECTED'));`,
        );
    }

    override async down(): Promise<void> {
        this.addSql(`drop table if exists "stock_transfer_request" cascade;`);
    }
}
