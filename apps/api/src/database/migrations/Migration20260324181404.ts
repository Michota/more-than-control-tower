import { Migration } from "@mikro-orm/migrations";

export class Migration20260324181404 extends Migration {
    override async up(): Promise<void> {
        this.addSql(`alter table "sector" add "weight_capacity_grams" int not null;`);
    }

    override async down(): Promise<void> {
        this.addSql(`alter table "sector" drop column "weight_capacity_grams";`);
    }
}
