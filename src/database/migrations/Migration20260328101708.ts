import { Migration } from '@mikro-orm/migrations';

export class Migration20260328101708 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table "code" ("id" uuid not null, "good_id" uuid not null, "type" varchar(255) not null, "value" varchar(255) not null, primary key ("id"));`);
    this.addSql(`alter table "code" add constraint "code_value_unique" unique ("value");`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "code" cascade;`);
  }

}
