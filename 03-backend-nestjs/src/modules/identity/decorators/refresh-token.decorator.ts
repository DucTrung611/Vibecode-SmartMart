import {
  createParamDecorator,
  ExecutionContext,
  HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';
import { AppException } from '../../../shared/exceptions/app.exception';
import { REFRESH_TOKEN_COOKIE } from '../constants/identity.constants';

export const RefreshToken = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const token = request.cookies?.[REFRESH_TOKEN_COOKIE] as string | undefined;
    if (!token) {
      throw new AppException(
        'AUTH_SESSION_INVALID',
        'Refresh token cookie is missing',
        HttpStatus.UNAUTHORIZED,
      );
    }
    return token;
  },
);
