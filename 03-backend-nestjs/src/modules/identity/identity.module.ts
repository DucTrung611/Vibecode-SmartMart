import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Role } from './entities/role.entity';
import { UserRole } from './entities/user-role.entity';
import { UserIdentity } from './entities/user-identity.entity';
import { AuthSession } from './entities/auth-session.entity';
import { UserAddress } from './entities/user-address.entity';
import identityConfig from './identity.config';
import { UserRepository } from './repositories/user.repository';
import { RoleRepository } from './repositories/role.repository';
import { UserRoleRepository } from './repositories/user-role.repository';
import { AuthSessionRepository } from './repositories/auth-session.repository';
import { UserAddressRepository } from './repositories/user-address.repository';
import { AuthService } from './services/auth.service';
import { UsersService } from './services/users.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { AuthController } from './auth.controller';
import { UsersController } from './users.controller';

@Module({
  imports: [
    ConfigModule.forFeature(identityConfig),
    TypeOrmModule.forFeature([
      User,
      Role,
      UserRole,
      UserIdentity,
      AuthSession,
      UserAddress,
    ]),
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('identity.jwtSecret'),
        signOptions: {
          expiresIn: config.get<string>(
            'identity.jwtAccessExpiresIn',
          ) as unknown as number,
        },
      }),
    }),
  ],
  controllers: [AuthController, UsersController],
  providers: [
    AuthService,
    UsersService,
    JwtStrategy,
    UserRepository,
    RoleRepository,
    UserRoleRepository,
    AuthSessionRepository,
    UserAddressRepository,
  ],
  exports: [AuthService, UsersService],
})
export class IdentityModule {}
