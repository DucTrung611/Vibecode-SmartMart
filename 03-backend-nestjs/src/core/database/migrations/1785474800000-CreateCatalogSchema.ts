import { MigrationInterface, QueryRunner } from 'typeorm';

// Raw SQL throughout: enum type, ltree/GIN/GiST/trgm indexes, generated
// tsvector column, and partial unique/partial B-tree indexes are not
// modelled by TypeORM decorators (DATABASE.md §5). set_updated_at() already
// exists (created by CreateIdentitySchema) — reused here via CREATE TRIGGER.
export class CreateCatalogSchema1785474800000 implements MigrationInterface {
  name = 'CreateCatalogSchema1785474800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "product_status" AS ENUM ('draft', 'published', 'archived')`,
    );

    await queryRunner.query(`
      CREATE TABLE "brands" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" text NOT NULL,
        "slug" citext NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "brands_slug_uq" ON "brands" ("slug")`,
    );
    await queryRunner.query(`
      CREATE TRIGGER brands_set_updated_at BEFORE UPDATE ON "brands"
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
    `);

    await queryRunner.query(`
      CREATE TABLE "categories" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "parent_id" uuid REFERENCES "categories"("id") ON DELETE RESTRICT,
        "name" text NOT NULL,
        "slug" citext NOT NULL,
        "path" ltree NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "categories_slug_uq" ON "categories" ("slug")`,
    );
    await queryRunner.query(`CREATE INDEX ON "categories" ("parent_id")`);
    await queryRunner.query(
      `CREATE INDEX "categories_path_gist_idx" ON "categories" USING GIST ("path")`,
    );
    await queryRunner.query(`
      CREATE TRIGGER categories_set_updated_at BEFORE UPDATE ON "categories"
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
    `);

    await queryRunner.query(`
      CREATE TABLE "products" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "brand_id" uuid REFERENCES "brands"("id") ON DELETE SET NULL,
        "name" text NOT NULL,
        "slug" citext NOT NULL,
        "description" text,
        "status" product_status NOT NULL DEFAULT 'draft',
        "base_price" numeric(12,2) NOT NULL,
        "currency_code" char(3) NOT NULL DEFAULT 'USD',
        "attributes" jsonb NOT NULL DEFAULT '{}',
        "tags" text[] NOT NULL DEFAULT '{}',
        "rating_avg" real NOT NULL DEFAULT 0,
        "rating_count" integer NOT NULL DEFAULT 0,
        "total_sold" integer NOT NULL DEFAULT 0,
        "search_vector" tsvector GENERATED ALWAYS AS (
          to_tsvector('english', coalesce("name", '') || ' ' || coalesce("description", ''))
        ) STORED,
        "published_at" timestamptz,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "products_slug_uq" ON "products" ("slug") WHERE "deleted_at" IS NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX ON "products" ("status", "published_at" DESC)`,
    );
    await queryRunner.query(
      `CREATE INDEX "products_search_vector_idx" ON "products" USING GIN ("search_vector")`,
    );
    await queryRunner.query(
      `CREATE INDEX "products_name_trgm_idx" ON "products" USING GIN ("name" gin_trgm_ops)`,
    );
    await queryRunner.query(
      `CREATE INDEX "products_attributes_idx" ON "products" USING GIN ("attributes" jsonb_path_ops)`,
    );
    await queryRunner.query(
      `CREATE INDEX "products_tags_idx" ON "products" USING GIN ("tags")`,
    );
    await queryRunner.query(
      `CREATE INDEX "products_base_price_idx" ON "products" ("base_price") WHERE "deleted_at" IS NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX "products_rating_avg_idx" ON "products" ("rating_avg" DESC)`,
    );
    await queryRunner.query(`
      CREATE TRIGGER products_set_updated_at BEFORE UPDATE ON "products"
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
    `);

    await queryRunner.query(`
      CREATE TABLE "product_categories" (
        "product_id" uuid NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
        "category_id" uuid NOT NULL REFERENCES "categories"("id") ON DELETE RESTRICT,
        "is_primary" boolean NOT NULL DEFAULT false,
        PRIMARY KEY ("product_id", "category_id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX ON "product_categories" ("category_id", "product_id")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "product_categories_primary_uq" ON "product_categories" ("product_id") WHERE "is_primary"`,
    );

    await queryRunner.query(`
      CREATE TABLE "product_options" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "product_id" uuid NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
        "name" text NOT NULL,
        UNIQUE ("product_id", "name")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "product_option_values" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "option_id" uuid NOT NULL REFERENCES "product_options"("id") ON DELETE CASCADE,
        "value" text NOT NULL,
        "metadata" jsonb NOT NULL DEFAULT '{}',
        UNIQUE ("option_id", "value")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "product_variants" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "product_id" uuid NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
        "sku" citext NOT NULL,
        "price" numeric(12,2) NOT NULL,
        "currency_code" char(3) NOT NULL DEFAULT 'USD',
        "option_summary" jsonb NOT NULL DEFAULT '{}',
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "product_variants_sku_uq" ON "product_variants" ("sku") WHERE "deleted_at" IS NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX "product_variants_product_active_idx" ON "product_variants" ("product_id") WHERE "is_active"`,
    );
    await queryRunner.query(`
      CREATE TRIGGER product_variants_set_updated_at BEFORE UPDATE ON "product_variants"
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
    `);

    await queryRunner.query(`
      CREATE TABLE "product_variant_option_values" (
        "variant_id" uuid NOT NULL REFERENCES "product_variants"("id") ON DELETE CASCADE,
        "option_value_id" uuid NOT NULL REFERENCES "product_option_values"("id") ON DELETE CASCADE,
        PRIMARY KEY ("variant_id", "option_value_id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX ON "product_variant_option_values" ("option_value_id")`,
    );

    await queryRunner.query(`
      CREATE TABLE "product_images" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "product_id" uuid NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
        "variant_id" uuid REFERENCES "product_variants"("id") ON DELETE SET NULL,
        "url" text NOT NULL,
        "position" integer NOT NULL DEFAULT 0,
        "is_primary" boolean NOT NULL DEFAULT false,
        "checksum" text,
        "created_at" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(
      `CREATE INDEX ON "product_images" ("product_id", "position")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "product_images_primary_uq" ON "product_images" ("product_id") WHERE "is_primary"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "product_images"`);
    await queryRunner.query(`DROP TABLE "product_variant_option_values"`);
    await queryRunner.query(`DROP TABLE "product_variants"`);
    await queryRunner.query(`DROP TABLE "product_option_values"`);
    await queryRunner.query(`DROP TABLE "product_options"`);
    await queryRunner.query(`DROP TABLE "product_categories"`);
    await queryRunner.query(`DROP TABLE "products"`);
    await queryRunner.query(`DROP TABLE "categories"`);
    await queryRunner.query(`DROP TABLE "brands"`);
    await queryRunner.query(`DROP TYPE "product_status"`);
  }
}
