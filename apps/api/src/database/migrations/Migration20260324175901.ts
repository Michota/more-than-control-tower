import { Migration } from "@mikro-orm/migrations";

export class Migration20260324175901 extends Migration {
    override async up(): Promise<void> {
        this.addSql(`alter table "stock_entry" drop column "location_in_warehouse";`);
    }

    override async down(): Promise<void> {
        this.addSql(`alter table "stock_entry" add "location_in_warehouse" varchar(255) null;`);
    }
}
