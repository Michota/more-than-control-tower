import { Migration } from "@mikro-orm/migrations";

export class Migration20260327110000 extends Migration {
    override async up(): Promise<void> {
        this.addSql(`
            create table if not exists "auth_credentials" (
                "id" uuid not null,
                "user_id" uuid not null,
                "password_hash" varchar(255) not null,
                constraint "auth_credentials_pkey" primary key ("id")
            );
        `);
        this.addSql(`
            do $$ begin
                if not exists (select 1 from pg_constraint where conname = 'auth_credentials_user_id_unique') then
                    alter table "auth_credentials" add constraint "auth_credentials_user_id_unique" unique ("user_id");
                end if;
            end $$;
        `);
    }

    override async down(): Promise<void> {
        this.addSql(`drop table if exists "auth_credentials";`);
    }
}
