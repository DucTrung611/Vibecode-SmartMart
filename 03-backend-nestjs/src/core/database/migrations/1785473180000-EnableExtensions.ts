import { MigrationInterface, QueryRunner } from 'typeorm';

// Raw SQL required: extensions aren't modelled by the ORM (DATABASE.md §5).
export class EnableExtensions1785473180000 implements MigrationInterface {
  name = 'EnableExtensions1785473180000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "citext"`);
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pg_trgm"`);
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "ltree"`);
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "vector"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP EXTENSION IF EXISTS "vector"`);
    await queryRunner.query(`DROP EXTENSION IF EXISTS "ltree"`);
    await queryRunner.query(`DROP EXTENSION IF EXISTS "pg_trgm"`);
    await queryRunner.query(`DROP EXTENSION IF EXISTS "citext"`);
    await queryRunner.query(`DROP EXTENSION IF EXISTS "pgcrypto"`);
  }
}
