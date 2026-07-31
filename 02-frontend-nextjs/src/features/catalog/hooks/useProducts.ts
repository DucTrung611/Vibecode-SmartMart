import { useInfiniteQuery } from "@tanstack/react-query";
import * as catalogService from "../services/catalog.service";
import { ProductListFilters, ProductListResult } from "../types/catalog.types";

// Server-rendered first page is passed in as `initialPage` (the route's
// server component already fetched it for SSR) — the hook only takes over
// for "load more" clicks from there, avoiding a duplicate fetch on mount.
export function useProducts(
  filters: Omit<ProductListFilters, "cursor">,
  initialPage: ProductListResult,
) {
  return useInfiniteQuery({
    queryKey: ["catalog", "products", filters],
    queryFn: ({ pageParam }) =>
      catalogService.fetchProducts({ ...filters, cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? (lastPage.nextCursor ?? undefined) : undefined,
    initialData: { pages: [initialPage], pageParams: [undefined] },
  });
}
