import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

interface SuccessEnvelope<T> {
  success: true;
  data: T;
  meta: { timestamp: string };
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
      map((data) => ({
        success: true as const,
        data,
        meta: { timestamp: new Date().toISOString() },
      })),
    );
  }
}
