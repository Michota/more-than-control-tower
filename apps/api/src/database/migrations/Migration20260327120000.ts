import { Migration } from "@mikro-orm/migrations";

export class Migration20260327120000 extends Migration {
    override async up(): Promise<void> {
        this.addSql(`alter table "system_user" add column "name" varchar(255);`);
        this.addSql(`update "system_user" set "name" = "first_name" || ' ' || "last_name";`);
        this.addSql(`alter table "system_user" alter column "name" set not null;`);
        this.addSql(`alter table "system_user" drop column "first_name";`);
        this.addSql(`alter table "system_user" drop column "last_name";`);
    }

    override async down(): Promise<void> {
        this.addSql(`alter table "system_user" add column "first_name" varchar(255);`);
        this.addSql(`alter table "system_user" add column "last_name" varchar(255);`);
        this.addSql(
            `update "system_user" set "first_name" = split_part("name", ' ', 1), "last_name" = substring("name" from position(' ' in "name") + 1);`,
        );
        this.addSql(`alter table "system_user" alter column "first_name" set not null;`);
        this.addSql(`alter table "system_user" alter column "last_name" set not null;`);
        this.addSql(`alter table "system_user" drop column "name";`);
    }
}
