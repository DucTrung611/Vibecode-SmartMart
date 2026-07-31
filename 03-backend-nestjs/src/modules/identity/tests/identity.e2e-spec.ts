import {
  INestApplication,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../../../app.module';

// Runs against the real docker-compose Postgres (DATABASE.md's read-committed
// + real unique-constraint behavior can't be faithfully mocked) — requires
// `docker compose up -d postgres` and migrations already applied.
describe('identity (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  const email = `e2e-${Date.now()}@test.com`;
  const password = 'Password123!';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
    app.use(cookieParser());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    dataSource = moduleFixture.get(DataSource);
  });

  afterAll(async () => {
    await dataSource.query('DELETE FROM users WHERE email = $1', [email]);
    await app.close();
  });

  it('register -> login -> access protected route -> refresh rotation -> reuse detection -> logout -> refresh after logout', async () => {
    const server = app.getHttpServer();

    // Register
    const registerRes = await request(server)
      .post('/v1/auth/register')
      .send({ email, password })
      .expect(201);
    expect(registerRes.body.data.email).toBe(email);
    expect(registerRes.body.data.passwordHash).toBeUndefined();

    // Duplicate register
    await request(server)
      .post('/v1/auth/register')
      .send({ email, password })
      .expect(409)
      .expect((res) => {
        expect(res.body.error.code).toBe('IDENTITY_EMAIL_TAKEN');
      });

    // Login
    const agent = request.agent(server);
    const loginRes = await agent
      .post('/v1/auth/login')
      .send({ email, password })
      .expect(200);
    const accessToken = loginRes.body.data.accessToken as string;
    const originalCookie = loginRes.headers['set-cookie'];
    expect(accessToken).toBeTruthy();
    expect(originalCookie).toBeTruthy();

    // Protected route without token
    await request(server)
      .get('/v1/users/me')
      .expect(401)
      .expect((res) => {
        expect(res.body.error.code).toBe('AUTH_TOKEN_MISSING');
      });

    // Protected route with token
    await request(server)
      .get('/v1/users/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect((res) => {
        expect(res.body.data.email).toBe(email);
      });

    // Valid refresh rotates the cookie (agent carries the cookie jar)
    const refreshRes = await agent.post('/v1/auth/refresh').expect(200);
    expect(refreshRes.body.data.accessToken).toBeTruthy();

    // Replaying the OLD (now-revoked) refresh cookie is detected as reuse
    const reuseRes = await request(server)
      .post('/v1/auth/refresh')
      .set('Cookie', originalCookie)
      .expect(401);
    expect(reuseRes.body.error.code).toBe('AUTH_SESSION_INVALID');

    // The reuse-detection revoke-all also killed the just-rotated session
    const refreshAfterBreachRes = await agent
      .post('/v1/auth/refresh')
      .expect(401);
    expect(refreshAfterBreachRes.body.error.code).toBe('AUTH_SESSION_INVALID');
  });

  it('logout revokes the session and a subsequent refresh fails', async () => {
    const server = app.getHttpServer();
    const logoutEmail = `e2e-logout-${Date.now()}@test.com`;

    await request(server)
      .post('/v1/auth/register')
      .send({ email: logoutEmail, password })
      .expect(201);

    const agent = request.agent(server);
    const loginRes = await agent
      .post('/v1/auth/login')
      .send({ email: logoutEmail, password })
      .expect(200);
    const accessToken = loginRes.body.data.accessToken as string;

    await agent
      .post('/v1/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(204);

    await agent
      .post('/v1/auth/refresh')
      .expect(401)
      .expect((res) => {
        expect(res.body.error.code).toBe('AUTH_SESSION_INVALID');
      });

    await dataSource.query('DELETE FROM users WHERE email = $1', [logoutEmail]);
  });

  it('only one address can be the default shipping address', async () => {
    const server = app.getHttpServer();
    const addrEmail = `e2e-addr-${Date.now()}@test.com`;

    await request(server)
      .post('/v1/auth/register')
      .send({ email: addrEmail, password })
      .expect(201);

    const agent = request.agent(server);
    const loginRes = await agent
      .post('/v1/auth/login')
      .send({ email: addrEmail, password })
      .expect(200);
    const accessToken = loginRes.body.data.accessToken as string;
    const auth = () => `Bearer ${accessToken}`;

    await request(server)
      .post('/v1/users/me/addresses')
      .set('Authorization', auth())
      .send({
        recipientName: 'A',
        line1: '1 St',
        city: 'Hanoi',
        countryCode: 'VN',
        isDefaultShipping: true,
      })
      .expect(201);

    await request(server)
      .post('/v1/users/me/addresses')
      .set('Authorization', auth())
      .send({
        recipientName: 'B',
        line1: '2 St',
        city: 'HCMC',
        countryCode: 'VN',
        isDefaultShipping: true,
      })
      .expect(201);

    const listRes = await request(server)
      .get('/v1/users/me/addresses')
      .set('Authorization', auth())
      .expect(200);

    const defaults = listRes.body.data.filter(
      (a: { isDefaultShipping: boolean }) => a.isDefaultShipping,
    );
    expect(defaults).toHaveLength(1);
    expect(defaults[0].recipientName).toBe('B');

    await dataSource.query('DELETE FROM users WHERE email = $1', [addrEmail]);
  });
});
