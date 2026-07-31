import { MigrationInterface, QueryRunner } from 'typeorm';

// Data seed kept separate from schema DDL (CreateIdentitySchema) so schema
// migrations stay pure and re-runnable/reviewable independently of seed data.
export class SeedIdentityRoles1785474777476 implements MigrationInterface {
  name = 'SeedIdentityRoles1785474777476';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "roles" ("code") VALUES ('customer'), ('admin')
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM "roles" WHERE "code" IN ('customer', 'admin')`,
    );
  }
}
