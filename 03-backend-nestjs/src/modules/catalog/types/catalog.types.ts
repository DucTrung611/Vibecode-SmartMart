export type ProductSortField = 'price' | 'ratingAvg' | 'createdAt';
export type SortDirection = 'asc' | 'desc';

export interface ProductSortKey {
  field: ProductSortField;
  direction: SortDirection;
}

export interface ProductListFilters {
  category?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  tags?: string[];
  q?: string;
}

export interface ProductListQuery {
  limit: number;
  cursor?: string;
  sort: ProductSortKey;
  filters: ProductListFilters;
}

// Allow-listed to columns that are actually indexed (API_SPEC.md §3,
// DATABASE.md §2) — the property name on the `Product` entity, not the
// public `sort=` query value.
export const PRODUCT_SORT_COLUMNS: Record<ProductSortField, string> = {
  price: 'basePrice',
  ratingAvg: 'ratingAvg',
  createdAt: 'createdAt',
};
