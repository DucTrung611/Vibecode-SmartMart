import { randomBytes, createHash } from 'crypto';
import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectDataSource } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { DataSource } from 'typeorm';
import { AppException } from '../../../shared/exceptions/app.exception';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import { UserResponseDto } from '../dto/user-response.dto';
import { UserRepository } from '../repositories/user.repository';
import { RoleRepository } from '../repositories/role.repository';
import { UserRoleRepository } from '../repositories/user-role.repository';
import { AuthSessionRepository } from '../repositories/auth-session.repository';
import { toUserResponse } from '../utils/identity.mapper';

const BCRYPT_COST = 10;
const DEFAULT_ROLE_CODE = 'customer';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  refreshTokenExpiresAt: Date;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly userRepository: UserRepository,
    private readonly roleRepository: RoleRepository,
    private readonly userRoleRepository: UserRoleRepository,
    private readonly authSessionRepository: AuthSessionRepository,
  ) {}

  async register(dto: RegisterDto): Promise<UserResponseDto> {
    const existing = await this.userRepository.findByEmail(dto.email);
    if (existing) {
      throw new AppException(
        'IDENTITY_EMAIL_TAKEN',
        `Email ${dto.email} is already registered`,
        HttpStatus.CONFLICT,
      );
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_COST);

    return this.dataSource.transaction(async (manager) => {
      const user = this.userRepository.create({
        email: dto.email,
        passwordHash,
      });
      const saved = await this.userRepository.save(user, manager);

      const role = await this.roleRepository.findByCode(DEFAULT_ROLE_CODE);
      if (role) {
        await this.userRoleRepository.assignRole(saved.id, role.id, manager);
      } else {
        this.logger.warn(
          `Default role "${DEFAULT_ROLE_CODE}" not found — user ${saved.id} registered without a role`,
        );
      }

      return toUserResponse(saved);
    });
  }

  async login(dto: LoginDto): Promise<AuthTokens> {
    const user = await this.userRepository.findByEmail(dto.email);
    const passwordValid =
      user?.passwordHash &&
      (await bcrypt.compare(dto.password, user.passwordHash));

    // Same error for "no such user" and "wrong password" — avoids
    // leaking which emails are registered (user enumeration).
    if (!user || !passwordValid) {
      throw new AppException(
        'IDENTITY_INVALID_CREDENTIALS',
        'Invalid email or password',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const accessToken = this.signAccessToken(user.id, []);
    const { refreshToken, refreshTokenHash, expiresAt } =
      this.issueRefreshToken();

    await this.authSessionRepository.save(
      this.authSessionRepository.create({
        userId: user.id,
        refreshTokenHash,
        expiresAt,
      }),
    );

    return { accessToken, refreshToken, refreshTokenExpiresAt: expiresAt };
  }

  async refresh(rawRefreshToken: string): Promise<AuthTokens> {
    const presentedHash = this.hashRefreshToken(rawRefreshToken);

    // The transaction must COMMIT even on the reuse/expired/not-found
    // paths (the revoke-all side effect needs to persist), so those paths
    // return a status instead of throwing — throwing inside
    // dataSource.transaction() rolls back everything the callback did,
    // including the revocation we're relying on. The AppException is
    // thrown after the transaction has resolved, outside its callback.
    const result = await this.dataSource.transaction<
      AuthTokens | 'not_found' | 'reused' | 'expired'
    >(async (manager) => {
      const session =
        await this.authSessionRepository.findByRefreshTokenHashForUpdate(
          presentedHash,
          manager,
        );

      if (!session) return 'not_found';

      if (session.revokedAt) {
        // Reuse of an already-rotated token is a breach signal: revoke
        // every active session for this user, not just this one.
        await this.authSessionRepository.revokeAllActiveForUser(
          session.userId,
          manager,
        );
        return 'reused';
      }

      if (session.expiresAt.getTime() < Date.now()) return 'expired';

      session.revokedAt = new Date();
      await this.authSessionRepository.save(session, manager);

      const accessToken = this.signAccessToken(session.userId, []);
      const { refreshToken, refreshTokenHash, expiresAt } =
        this.issueRefreshToken();

      await this.authSessionRepository.save(
        this.authSessionRepository.create({
          userId: session.userId,
          refreshTokenHash,
          expiresAt,
        }),
        manager,
      );

      return { accessToken, refreshToken, refreshTokenExpiresAt: expiresAt };
    });

    if (result === 'not_found') {
      throw new AppException(
        'AUTH_SESSION_INVALID',
        'Refresh token is invalid',
        HttpStatus.UNAUTHORIZED,
      );
    }
    if (result === 'reused') {
      throw new AppException(
        'AUTH_SESSION_INVALID',
        'Refresh token has already been used',
        HttpStatus.UNAUTHORIZED,
      );
    }
    if (result === 'expired') {
      throw new AppException(
        'AUTH_SESSION_INVALID',
        'Refresh token has expired',
        HttpStatus.UNAUTHORIZED,
      );
    }
    return result;
  }

  async logout(rawRefreshToken: string): Promise<void> {
    const presentedHash = this.hashRefreshToken(rawRefreshToken);
    await this.dataSource.transaction(async (manager) => {
      const session =
        await this.authSessionRepository.findByRefreshTokenHashForUpdate(
          presentedHash,
          manager,
        );
      // Idempotent: missing/already-revoked session still returns success
      // so we never leak session state to the caller.
      if (session && !session.revokedAt) {
        session.revokedAt = new Date();
        await this.authSessionRepository.save(session, manager);
      }
    });
  }

  private signAccessToken(userId: string, roles: string[]): string {
    return this.jwtService.sign(
      { sub: userId, roles },
      {
        secret: this.configService.get<string>('identity.jwtSecret'),
        expiresIn: this.configService.get<string>(
          'identity.jwtAccessExpiresIn',
        ) as unknown as number,
      },
    );
  }

  private issueRefreshToken(): {
    refreshToken: string;
    refreshTokenHash: string;
    expiresAt: Date;
  } {
    const refreshToken = randomBytes(64).toString('hex');
    const days =
      this.configService.get<number>('identity.refreshTokenExpiresInDays') ??
      30;
    const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    return {
      refreshToken,
      refreshTokenHash: this.hashRefreshToken(refreshToken),
      expiresAt,
    };
  }

  private hashRefreshToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
