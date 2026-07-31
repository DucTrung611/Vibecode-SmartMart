import { MigrationInterface, QueryRunner } from 'typeorm';

// Raw SQL throughout: enum type, partial unique indexes, and the shared
// set_updated_at() trigger function are not modelled by TypeORM decorators
// (DATABASE.md §5). set_updated_at() is created here as the first feature
// to need it — later features attaching it to their own tables should only
// add a CREATE TRIGGER, never recreate the function.
export class CreateIdentitySchema1785474745442 implements MigrationInterface {
  name = 'CreateIdentitySchema1785474745442';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "user_status" AS ENUM ('active', 'suspended')`,
    );

    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION set_updated_at()
      RETURNS trigger AS $$
      BEGIN
        NEW.updated_at = now();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "email" citext NOT NULL,
        "password_hash" text,
        "status" user_status NOT NULL DEFAULT 'active',
        "preferences" jsonb NOT NULL DEFAULT '{}',
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "users_email_uq" ON "users" ("email") WHERE "deleted_at" IS NULL`,
    );
    await queryRunner.query(`CREATE INDEX ON "users" ("status")`);
    await queryRunner.query(`
      CREATE TRIGGER users_set_updated_at BEFORE UPDATE ON "users"
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
    `);

    await queryRunner.query(`
      CREATE TABLE "roles" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "code" text NOT NULL UNIQUE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "user_roles" (
        "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "role_id" uuid NOT NULL REFERENCES "roles"("id") ON DELETE CASCADE,
        PRIMARY KEY ("user_id", "role_id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "user_identities" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "provider" text NOT NULL,
        "provider_user_id" text NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        UNIQUE ("provider", "provider_user_id")
      )
    `);
    await queryRunner.query(`CREATE INDEX ON "user_identities" ("user_id")`);

    await queryRunner.query(`
      CREATE TABLE "auth_sessions" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "refresh_token_hash" text NOT NULL UNIQUE,
        "expires_at" timestamptz NOT NULL,
        "revoked_at" timestamptz,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(
      `CREATE INDEX ON "auth_sessions" ("user_id") WHERE "revoked_at" IS NULL`,
    );
    await queryRunner.query(`
      CREATE TRIGGER auth_sessions_set_updated_at BEFORE UPDATE ON "auth_sessions"
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
    `);

    await queryRunner.query(`
      CREATE TABLE "user_addresses" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "recipient_name" text NOT NULL,
        "line1" text NOT NULL,
        "city" text NOT NULL,
        "country_code" char(2) NOT NULL,
        "is_default_shipping" boolean NOT NULL DEFAULT false,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "user_addresses_default_shipping_uq" ON "user_addresses" ("user_id") WHERE "is_default_shipping"`,
    );
    await queryRunner.query(`
      CREATE TRIGGER user_addresses_set_updated_at BEFORE UPDATE ON "user_addresses"
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "user_addresses"`);
    await queryRunner.query(`DROP TABLE "auth_sessions"`);
    await queryRunner.query(`DROP TABLE "user_identities"`);
    await queryRunner.query(`DROP TABLE "user_roles"`);
    await queryRunner.query(`DROP TABLE "roles"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP FUNCTION IF EXISTS set_updated_at()`);
    await queryRunner.query(`DROP TYPE "user_status"`);
  }
}
