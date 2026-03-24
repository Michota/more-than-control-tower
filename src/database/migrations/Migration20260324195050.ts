import { Migration } from "@mikro-orm/migrations";

export class Migration20260324195050 extends Migration {
    override async up(): Promise<void> {
        this.addSql(`alter table "stock_entry" add "attributes" jsonb not null default '[]';`);

        this.addSql(`alter table "warehouse" drop column "latitude", drop column "longitude";`);
    }

    override async down(): Promise<void> {
        this.addSql(`alter table "stock_entry" drop column "attributes";`);

        this.addSql(
            `alter table "warehouse" add "latitude" numeric(10,0) not null, add "longitude" numeric(10,0) not null;`,
        );
    }
}
