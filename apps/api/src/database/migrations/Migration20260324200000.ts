import { Migration } from "@mikro-orm/migrations";

export class Migration20260324200000 extends Migration {
    override async up(): Promise<void> {
        this.addSql(`
            CREATE OR REPLACE FUNCTION prevent_stock_entry_delete_with_quantity()
            RETURNS TRIGGER AS $$
            BEGIN
                IF OLD.quantity > 0 THEN
                    RAISE EXCEPTION 'Cannot delete stock entry % because it has quantity %', OLD.id, OLD.quantity
                        USING ERRCODE = 'check_violation';
                END IF;
                RETURN OLD;
            END;
            $$ LANGUAGE plpgsql;
        `);

        this.addSql(`
            CREATE TRIGGER trg_prevent_stock_entry_delete
            BEFORE DELETE ON "stock_entry"
            FOR EACH ROW
            EXECUTE FUNCTION prevent_stock_entry_delete_with_quantity();
        `);
    }

    override async down(): Promise<void> {
        this.addSql(`DROP TRIGGER IF EXISTS trg_prevent_stock_entry_delete ON "stock_entry";`);
        this.addSql(`DROP FUNCTION IF EXISTS prevent_stock_entry_delete_with_quantity();`);
    }
}
