import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { AppException } from '../exceptions/app.exception';

interface ErrorBody {
  code: string;
  message: string;
  details: unknown;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const { status, error } = this.resolve(exception);

    if (status >= 500) {
      this.logger.error(error.message, (exception as Error)?.stack);
    }

    response.status(status).json({ success: false, error });
  }

  private resolve(exception: unknown): { status: number; error: ErrorBody } {
    if (exception instanceof AppException) {
      return {
        status: exception.getStatus(),
        error: {
          code: exception.code,
          message: exception.message,
          details: exception.details,
        },
      };
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      const message =
        typeof body === 'string'
          ? body
          : ((body as { message?: string | string[] }).message ??
            exception.message);

      if (status === 400 && Array.isArray(message)) {
        return {
          status,
          error: {
            code: 'VALIDATION_FAILED',
            message: 'Validation failed',
            details: message,
          },
        };
      }

      return {
        status,
        error: {
          code: this.fallbackCode(status),
          message: Array.isArray(message) ? message.join(', ') : message,
          details: null,
        },
      };
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      error: {
        code: 'COMMON_INTERNAL_ERROR',
        message: 'Internal server error',
        details: null,
      },
    };
  }

  private fallbackCode(status: number): string {
    switch (status) {
      case 404:
        return 'COMMON_NOT_FOUND';
      case 429:
        return 'COMMON_RATE_LIMITED';
      case 401:
        return 'AUTH_TOKEN_INVALID';
      case 403:
        return 'AUTH_FORBIDDEN';
      default:
        return 'COMMON_INTERNAL_ERROR';
    }
  }
}
