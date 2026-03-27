import { Migration } from "@mikro-orm/migrations";

export class Migration20260327110000 extends Migration {
    override async up(): Promise<void> {
        this.addSql(`
            create table "auth_credentials" (
                "id" uuid not null,
                "user_id" uuid not null,
                "password_hash" varchar(255) not null,
                constraint "auth_credentials_pkey" primary key ("id")
            );
        `);
        this.addSql(
            `alter table "auth_credentials" add constraint "auth_credentials_user_id_unique" unique ("user_id");`,
        );
    }

    override async down(): Promise<void> {
        this.addSql(`drop table if exists "auth_credentials";`);
    }
}
