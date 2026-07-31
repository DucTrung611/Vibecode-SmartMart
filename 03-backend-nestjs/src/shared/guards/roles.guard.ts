import {
  CanActivate,
  ExecutionContext,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { AppException } from '../exceptions/app.exception';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { CurrentUserPayload } from '../types/current-user.type';

// Runs after JwtAuthGuard (registered globally, order preserved by Nest) —
// routes with no @Roles() metadata are allowed through unchanged.
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredRoles || requiredRoles.length === 0) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user as CurrentUserPayload | undefined;
    if (!user || !requiredRoles.some((role) => user.roles.includes(role))) {
      throw new AppException(
        'AUTH_FORBIDDEN',
        'Insufficient role for this action',
        HttpStatus.FORBIDDEN,
      );
    }
    return true;
  }
}
