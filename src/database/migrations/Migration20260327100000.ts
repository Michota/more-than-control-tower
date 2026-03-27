import { Migration } from "@mikro-orm/migrations";

export class Migration20260327100000 extends Migration {
    override async up(): Promise<void> {
        this.addSql(
            `alter table "employee_position_assignment" add column "assigned_by" varchar(255) not null default 'system';`,
        );
        this.addSql(`alter table "employee_position_assignment" alter column "assigned_by" drop default;`);
    }

    override async down(): Promise<void> {
        this.addSql(`alter table "employee_position_assignment" drop column "assigned_by";`);
    }
}
