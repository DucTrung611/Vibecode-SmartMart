export interface PaginationMeta {
  limit: number;
  nextCursor: string | null;
  hasMore: boolean;
}

export interface SuccessEnvelope<T> {
  success: true;
  data: T;
  meta: { timestamp: string; pagination?: PaginationMeta };
}

export interface ErrorEnvelope {
  success: false;
  error: {
    code: string;
    message: string;
    details: unknown;
  };
}

export type ApiEnvelope<T> = SuccessEnvelope<T> | ErrorEnvelope;

export class ApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly details: unknown = null,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}
