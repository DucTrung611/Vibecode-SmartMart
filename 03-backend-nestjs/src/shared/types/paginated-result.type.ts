export interface PaginationMeta {
  limit: number;
  nextCursor: string | null;
  hasMore: boolean;
}

// Returned by a controller/service for a cursor-paginated list — the
// TransformInterceptor unwraps `items` into `data` and `pagination` into
// `meta.pagination` (API_SPEC.md §4), instead of controllers building the
// envelope by hand.
export interface PaginatedResult<T> {
  items: T[];
  pagination: PaginationMeta;
}
