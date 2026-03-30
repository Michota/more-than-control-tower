import { Migration } from "@mikro-orm/migrations";

export class Migration20260328120000 extends Migration {
    override async up(): Promise<void> {
        this.addSql(
            `alter table "order" add column "actor_id" uuid not null, add column "source" varchar(255) not null;`,
        );
    }

    override async down(): Promise<void> {
        this.addSql(`alter table "order" drop column "actor_id", drop column "source";`);
    }
}
