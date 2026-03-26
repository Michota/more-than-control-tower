import { Migration } from "@mikro-orm/migrations";

export class Migration20260326082958 extends Migration {
    override async up(): Promise<void> {
        this.addSql(
            `create table "system_user" ("id" uuid not null, "email" varchar(255) not null, "first_name" varchar(255) not null, "last_name" varchar(255) not null, "roles" text[] not null, "status" text not null, primary key ("id"));`,
        );
        this.addSql(`alter table "system_user" add constraint "system_user_email_unique" unique ("email");`);
        this.addSql(
            `alter table "system_user" add constraint "system_user_status_check" check ("status" in ('unactivated', 'activated', 'suspended'));`,
        );
    }

    override async down(): Promise<void> {
        this.addSql(`drop table if exists "system_user" cascade;`);
    }
}
