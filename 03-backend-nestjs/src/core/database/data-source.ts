import 'dotenv/config';
import { DataSource } from 'typeorm';

// Used by the TypeORM CLI only (migration generate/run/revert) — Nest's
// runtime connection is configured separately in database.module.ts via
// TypeOrmModule.forRootAsync, per DATABASE.md §6 (synchronize: false everywhere).
export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT ?? '5432', 10),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  synchronize: false,
  entities: ['src/modules/**/entities/*.entity.ts'],
  migrations: ['src/core/database/migrations/*.ts'],
});
