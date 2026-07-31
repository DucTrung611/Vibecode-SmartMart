import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthService } from '../services/auth.service';
import { UserRepository } from '../repositories/user.repository';
import { RoleRepository } from '../repositories/role.repository';
import { UserRoleRepository } from '../repositories/user-role.repository';
import { AuthSessionRepository } from '../repositories/auth-session.repository';

describe('AuthService', () => {
  let service: AuthService;
  let dataSource: { transaction: jest.Mock };
  let jwtService: { sign: jest.Mock };
  let configService: { get: jest.Mock };
  let userRepository: jest.Mocked<
    Pick<UserRepository, 'findByEmail' | 'save' | 'create'>
  >;
  let roleRepository: jest.Mocked<Pick<RoleRepository, 'findByCode'>>;
  let userRoleRepository: jest.Mocked<Pick<UserRoleRepository, 'assignRole'>>;
  let authSessionRepository: jest.Mocked<
    Pick<
      AuthSessionRepository,
      | 'create'
      | 'save'
      | 'findByRefreshTokenHashForUpdate'
      | 'revokeAllActiveForUser'
    >
  >;

  beforeEach(() => {
    dataSource = { transaction: jest.fn((cb: any) => cb({})) };
    jwtService = { sign: jest.fn().mockReturnValue('signed.jwt.token') };
    configService = {
      get: jest.fn((key: string) => {
        const values: Record<string, unknown> = {
          'identity.jwtSecret': 'secret',
          'identity.jwtAccessExpiresIn': '15m',
          'identity.refreshTokenExpiresInDays': 30,
        };
        return values[key];
      }),
    };
    userRepository = {
      findByEmail: jest.fn(),
      save: jest.fn(),
      create: jest.fn((data) => data as any),
    };
    roleRepository = { findByCode: jest.fn() };
    userRoleRepository = { assignRole: jest.fn() };
    authSessionRepository = {
      create: jest.fn((data) => data as any),
      save: jest.fn((session: any) => Promise.resolve(session)),
      findByRefreshTokenHashForUpdate: jest.fn(),
      revokeAllActiveForUser: jest.fn(),
    };

    service = new AuthService(
      dataSource as any,
      jwtService as unknown as JwtService,
      configService as unknown as ConfigService,
      userRepository as unknown as UserRepository,
      roleRepository as unknown as RoleRepository,
      userRoleRepository as unknown as UserRoleRepository,
      authSessionRepository as unknown as AuthSessionRepository,
    );
  });

  describe('register', () => {
    it('throws IDENTITY_EMAIL_TAKEN when email already exists', async () => {
      userRepository.findByEmail.mockResolvedValue({ id: 'u1' } as any);

      await expect(
        service.register({ email: 'a@test.com', password: 'password123' }),
      ).rejects.toMatchObject({ code: 'IDENTITY_EMAIL_TAKEN' });
    });

    it('hashes the password and assigns the default role', async () => {
      userRepository.findByEmail.mockResolvedValue(null);
      userRepository.save.mockImplementation((u: any) =>
        Promise.resolve({ ...u, id: 'u1', createdAt: new Date() }),
      );
      roleRepository.findByCode.mockResolvedValue({
        id: 'r1',
        code: 'customer',
      });

      const result = await service.register({
        email: 'a@test.com',
        password: 'password123',
      });

      expect(result.email).toBe('a@test.com');
      const savedArg = userRepository.save.mock.calls[0][0];
      expect(savedArg.passwordHash).not.toBe('password123');
      expect(await bcrypt.compare('password123', savedArg.passwordHash)).toBe(
        true,
      );
      expect(userRoleRepository.assignRole).toHaveBeenCalledWith(
        'u1',
        'r1',
        expect.anything(),
      );
    });
  });

  describe('login', () => {
    it('throws IDENTITY_INVALID_CREDENTIALS when email does not exist', async () => {
      userRepository.findByEmail.mockResolvedValue(null);

      await expect(
        service.login({ email: 'nobody@test.com', password: 'x' }),
      ).rejects.toMatchObject({ code: 'IDENTITY_INVALID_CREDENTIALS' });
    });

    it('throws IDENTITY_INVALID_CREDENTIALS when password is wrong', async () => {
      const passwordHash = await bcrypt.hash('correct-password', 10);
      userRepository.findByEmail.mockResolvedValue({
        id: 'u1',
        passwordHash,
      } as any);

      await expect(
        service.login({ email: 'a@test.com', password: 'wrong-password' }),
      ).rejects.toMatchObject({ code: 'IDENTITY_INVALID_CREDENTIALS' });
    });

    it('returns an access token and stores a hashed (not plaintext) refresh token', async () => {
      const passwordHash = await bcrypt.hash('correct-password', 10);
      userRepository.findByEmail.mockResolvedValue({
        id: 'u1',
        passwordHash,
      } as any);

      const result = await service.login({
        email: 'a@test.com',
        password: 'correct-password',
      });

      expect(result.accessToken).toBe('signed.jwt.token');
      expect(result.refreshToken).toHaveLength(128); // randomBytes(64).toString('hex')
      const savedSession = authSessionRepository.save.mock.calls[0][0] as any;
      expect(savedSession.refreshTokenHash).not.toBe(result.refreshToken);
      expect(savedSession.refreshTokenHash).toHaveLength(64); // sha256 hex
    });
  });

  describe('refresh', () => {
    it('rotates the session on a valid refresh token', async () => {
      authSessionRepository.findByRefreshTokenHashForUpdate.mockResolvedValue({
        id: 's1',
        userId: 'u1',
        revokedAt: null,
        expiresAt: new Date(Date.now() + 60_000),
      } as any);

      const result = await service.refresh('some-raw-token');

      expect(result.accessToken).toBe('signed.jwt.token');
      expect(
        authSessionRepository.revokeAllActiveForUser,
      ).not.toHaveBeenCalled();
      // First save() call revokes the presented session.
      expect(
        authSessionRepository.save.mock.calls[0][0].revokedAt,
      ).toBeInstanceOf(Date);
    });

    it('revokes every active session for the user on reuse of an already-rotated token', async () => {
      authSessionRepository.findByRefreshTokenHashForUpdate.mockResolvedValue({
        id: 's1',
        userId: 'u1',
        revokedAt: new Date(),
        expiresAt: new Date(Date.now() + 60_000),
      } as any);

      await expect(service.refresh('reused-token')).rejects.toMatchObject({
        code: 'AUTH_SESSION_INVALID',
      });
      expect(authSessionRepository.revokeAllActiveForUser).toHaveBeenCalledWith(
        'u1',
        expect.anything(),
      );
    });

    it('rejects an expired session', async () => {
      authSessionRepository.findByRefreshTokenHashForUpdate.mockResolvedValue({
        id: 's1',
        userId: 'u1',
        revokedAt: null,
        expiresAt: new Date(Date.now() - 60_000),
      } as any);

      await expect(service.refresh('expired-token')).rejects.toMatchObject({
        code: 'AUTH_SESSION_INVALID',
      });
    });

    it('rejects an unknown refresh token', async () => {
      authSessionRepository.findByRefreshTokenHashForUpdate.mockResolvedValue(
        null,
      );

      await expect(service.refresh('unknown-token')).rejects.toMatchObject({
        code: 'AUTH_SESSION_INVALID',
      });
    });
  });

  describe('logout', () => {
    it('is idempotent when the session is missing or already revoked', async () => {
      authSessionRepository.findByRefreshTokenHashForUpdate.mockResolvedValue(
        null,
      );

      await expect(service.logout('some-token')).resolves.toBeUndefined();
      expect(authSessionRepository.save).not.toHaveBeenCalled();
    });

    it('revokes an active session', async () => {
      authSessionRepository.findByRefreshTokenHashForUpdate.mockResolvedValue({
        id: 's1',
        userId: 'u1',
        revokedAt: null,
      } as any);

      await service.logout('some-token');

      expect(
        authSessionRepository.save.mock.calls[0][0].revokedAt,
      ).toBeInstanceOf(Date);
    });
  });
});
