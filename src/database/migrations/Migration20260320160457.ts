import { Migration } from "@mikro-orm/migrations";

export class Migration20260320160457 extends Migration {
    override async up(): Promise<void> {
        this.addSql(`alter table "customer_address" alter column "id" set default gen_random_uuid();`);

        this.addSql(`alter table "customer_contact" alter column "id" set default gen_random_uuid();`);
    }

    override async down(): Promise<void> {
        this.addSql(`alter table "customer_address" alter column "id" drop default;`);

        this.addSql(`alter table "customer_contact" alter column "id" drop default;`);
    }
}
