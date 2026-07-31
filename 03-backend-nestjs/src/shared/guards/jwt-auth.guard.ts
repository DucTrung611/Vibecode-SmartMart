import { ExecutionContext, HttpStatus, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { TokenExpiredError } from 'jsonwebtoken';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { AppException } from '../exceptions/app.exception';
import { CurrentUserPayload } from '../types/current-user.type';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    return super.canActivate(context);
  }

  handleRequest<TUser = CurrentUserPayload>(
    err: unknown,
    user: TUser | false,
    info: unknown,
  ): TUser {
    if (err || !user) {
      if (info instanceof TokenExpiredError) {
        throw new AppException(
          'AUTH_TOKEN_EXPIRED',
          'Access token has expired',
          HttpStatus.UNAUTHORIZED,
        );
      }
      const message = (info as Error)?.message;
      if (!message || message === 'No auth token') {
        throw new AppException(
          'AUTH_TOKEN_MISSING',
          'Authorization header is missing',
          HttpStatus.UNAUTHORIZED,
        );
      }
      throw new AppException(
        'AUTH_TOKEN_INVALID',
        'Access token is invalid',
        HttpStatus.UNAUTHORIZED,
      );
    }
    return user;
  }
}
