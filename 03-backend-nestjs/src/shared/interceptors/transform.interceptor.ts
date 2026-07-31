import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { PaginatedResult } from '../types/paginated-result.type';

interface SuccessEnvelope<T> {
  success: true;
  data: T;
  meta: { timestamp: string; pagination?: PaginatedResult<T>['pagination'] };
}

function isPaginatedResult<T>(value: unknown): value is PaginatedResult<T> {
  return (
    !!value &&
    typeof value === 'object' &&
    'items' in value &&
    'pagination' in value
  );
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  SuccessEnvelope<T>
> {
  intercept(
    _context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<SuccessEnvelope<T>> {
    return next.handle().pipe(
      map((data) => {
        const timestamp = new Date().toISOString();
        if (isPaginatedResult<T>(data)) {
          return {
            success: true as const,
            data: data.items as T,
            meta: { timestamp, pagination: data.pagination },
          };
        }
        return { success: true as const, data, meta: { timestamp } };
      }),
    );
  }
}
