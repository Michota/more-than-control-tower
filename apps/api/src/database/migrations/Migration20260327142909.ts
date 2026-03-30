import { Migration } from "@mikro-orm/migrations";

export class Migration20260327142909 extends Migration {
    override async up(): Promise<void> {
        this.addSql(
            `alter table "auth_credentials" add constraint "auth_credentials_user_id_foreign" foreign key ("user_id") references "system_user" ("id") on delete cascade;`,
        );
    }

    override async down(): Promise<void> {
        this.addSql(`alter table "auth_credentials" drop constraint "auth_credentials_user_id_foreign";`);
    }
}
