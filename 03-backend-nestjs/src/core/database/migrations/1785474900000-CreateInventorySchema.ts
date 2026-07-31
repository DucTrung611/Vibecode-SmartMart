import { MigrationInterface, QueryRunner } from 'typeorm';

// Raw SQL: quantity_available is a generated column and both indexes are
// partial — neither is modelled by TypeORM decorators (DATABASE.md §5).
// set_updated_at() already exists (created by CreateIdentitySchema).
export class CreateInventorySchema1785474900000
  implements MigrationInterface
{
  name = 'CreateInventorySchema1785474900000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "inventory_items" (
        "variant_id" uuid PRIMARY KEY REFERENCES "product_variants"("id"),
        "quantity_on_hand" integer NOT NULL DEFAULT 0 CHECK ("quantity_on_hand" >= 0),
        "quantity_reserved" integer NOT NULL DEFAULT 0 CHECK ("quantity_reserved" >= 0),
        "quantity_available" integer GENERATED ALWAYS AS (
          "quantity_on_hand" - "quantity_reserved"
        ) STORED,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "inventory_items_low_stock_idx" ON "inventory_items" ("quantity_available") WHERE "quantity_available" <= 5`,
    );
    await queryRunner.query(`
      CREATE TRIGGER inventory_items_set_updated_at BEFORE UPDATE ON "inventory_items"
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
    `);

    await queryRunner.query(`
      CREATE TABLE "inventory_movements" (
        "id" bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        "variant_id" uuid NOT NULL REFERENCES "product_variants"("id"),
        "type" text NOT NULL CHECK ("type" IN ('restock', 'correction', 'damage', 'return', 'manual_adjustment')),
        "quantity_delta" integer NOT NULL,
        "reference_type" text,
        "reference_id" uuid,
        "created_at" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "inventory_movements_variant_created_idx" ON "inventory_movements" ("variant_id", "created_at" DESC)`,
    );
    await queryRunner.query(
      `CREATE INDEX "inventory_movements_reference_idx" ON "inventory_movements" ("reference_type", "reference_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "inventory_movements"`);
    await queryRunner.query(`DROP TABLE "inventory_items"`);
  }
}
