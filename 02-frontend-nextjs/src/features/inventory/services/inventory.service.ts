import { apiFetch } from "@/shared/lib/api-client";
import { VariantStock } from "../types/inventory.types";

// Stock changes far more often than product/variant data, so unlike
// catalog's `revalidate: 300` reads this is never cached — always a
// fresh request (per-variant, client-side via useVariantStock).
export function fetchVariantStock(variantId: string): Promise<VariantStock> {
  return apiFetch<VariantStock>(`/inventory/variants/${variantId}`, {
    cache: "no-store",
  });
}
