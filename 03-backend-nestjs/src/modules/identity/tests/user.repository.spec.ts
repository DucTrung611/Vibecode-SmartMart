import 'dotenv/config';
import { DataSource } from 'typeorm';
import { User } from '../entities/user.entity';
import { UserIdentity } from '../entities/user-identity.entity';
import { UserRole } from '../entities/user-role.entity';
import { Role } from '../entities/role.entity';
import { AuthSession } from '../entities/auth-session.entity';
import { UserAddress } from '../entities/user-address.entity';
import { UserRepository } from '../repositories/user.repository';

// Exercises TypeORM's real @DeleteDateColumn exclusion behavior against
// Postgres — this can't be faithfully mocked (DATABASE.md §4's "#1 bug
// source" is specifically about raw SQL forgetting the deleted_at filter).
// Requires `docker compose up -d postgres` with migrations applied.
describe('UserRepository (integration)', () => {
  let dataSource: DataSource;
  let repository: UserRepository;
  const email = `repo-test-${Date.now()}@test.com`;

  beforeAll(async () => {
    dataSource = new DataSource({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT ?? '5432', 10),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      entities: [User, UserIdentity, UserRole, Role, AuthSession, UserAddress],
      synchronize: false,
    });
    await dataSource.initialize();
    repository = new UserRepository(dataSource.getRepository(User));
  });

  afterAll(async () => {
    await dataSource.query('DELETE FROM users WHERE email = $1', [email]);
    await dataSource.destroy();
  });

  it('excludes a soft-deleted user from findByEmail', async () => {
    const user = repository.create({ email, passwordHash: 'x' });
    const saved = await repository.save(user);

    expect(await repository.findByEmail(email)).not.toBeNull();

    await dataSource.getRepository(User).softDelete(saved.id);

    expect(await repository.findByEmail(email)).toBeNull();
  });
});
