import { apiFetch, apiFetchEnvelope } from "@/shared/lib/api-client";
import {
  Brand,
  CategoryNode,
  ProductDetail,
  ProductListFilters,
  ProductListResult,
  ProductVariant,
} from "../types/catalog.types";

function toQueryString(filters: ProductListFilters): string {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      params.set(key, String(value));
    }
  });
  const query = params.toString();
  return query ? `?${query}` : "";
}

// Public, SEO-relevant reads are ISR-cached (revalidate: 300, per
// ARCHITECTURE-FRONTEND.md §[Next.js-Specific Additions]) — callers pass
// no `cache` override so Next.js's fetch cache applies on the server.
export async function fetchProducts(
  filters: ProductListFilters = {},
): Promise<ProductListResult> {
  const envelope = await apiFetchEnvelope<ProductListResult["items"]>(
    `/catalog/products${toQueryString(filters)}`,
    { next: { revalidate: 300 } },
  );
  return {
    items: envelope.data,
    nextCursor: envelope.meta.pagination?.nextCursor ?? null,
    hasMore: envelope.meta.pagination?.hasMore ?? false,
  };
}

export function fetchProductBySlug(slug: string): Promise<ProductDetail> {
  return apiFetch<ProductDetail>(`/catalog/products/${slug}`, {
    next: { revalidate: 300 },
  });
}

export function fetchProductVariants(
  productId: string,
): Promise<ProductVariant[]> {
  return apiFetch<ProductVariant[]>(
    `/catalog/products/${productId}/variants`,
    { next: { revalidate: 300 } },
  );
}

export function fetchCategoryTree(): Promise<CategoryNode[]> {
  return apiFetch<CategoryNode[]>("/catalog/categories", {
    next: { revalidate: 300 },
  });
}

export function fetchBrands(): Promise<Brand[]> {
  return apiFetch<Brand[]>("/catalog/brands", { next: { revalidate: 300 } });
}
