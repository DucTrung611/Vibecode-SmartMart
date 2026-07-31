export type ProductStatus = "draft" | "published" | "archived";

export interface ProductSummary {
  id: string;
  name: string;
  slug: string;
  status: ProductStatus;
  basePrice: number;
  currencyCode: string;
  ratingAvg: number;
  ratingCount: number;
  brandName: string | null;
  primaryImageUrl: string | null;
}

export interface ProductImage {
  id: string;
  url: string;
  position: number;
  isPrimary: boolean;
}

export interface ProductDetail extends ProductSummary {
  description: string | null;
  attributes: Record<string, unknown>;
  tags: string[];
  images: ProductImage[];
}

export interface ProductVariant {
  id: string;
  sku: string;
  price: number;
  currencyCode: string;
  optionSummary: Record<string, string>;
  isActive: boolean;
}

export interface CategoryNode {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  isActive: boolean;
  children: CategoryNode[];
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
}

// Mirrors the query params ProductsController.listProducts accepts
// (API_SPEC.md §3) — all optional, all strings/numbers as sent over the wire.
export interface ProductListFilters {
  limit?: number;
  cursor?: string;
  sort?: string;
  category?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  tags?: string;
  q?: string;
}

export interface ProductListResult {
  items: ProductSummary[];
  nextCursor: string | null;
  hasMore: boolean;
}
