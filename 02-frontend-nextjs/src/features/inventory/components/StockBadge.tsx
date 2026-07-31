"use client";

import { useVariantStock } from "../hooks/useVariantStock";

interface StockBadgeProps {
  variantId: string;
}

// Leaf client component so the surrounding product page can stay a Server
// Component (ARCHITECTURE-FRONTEND.md §[Next.js-Specific Additions]) — only
// this badge needs the client-side stock fetch.
export function StockBadge({ variantId }: StockBadgeProps) {
  const { data, isLoading, isError } = useVariantStock(variantId);

  if (isLoading) {
    return (
      <span className="text-xs text-(--color-muted-foreground)">
        Checking stock…
      </span>
    );
  }

  // A variant that's never been provisioned in inventory_items is
  // indistinguishable from one that doesn't exist (inventory's context.md,
  // "no auto-provisioning" gap) — show a neutral state rather than an error.
  if (isError || !data) {
    return (
      <span className="text-xs text-(--color-muted-foreground)">
        Stock unavailable
      </span>
    );
  }

  if (data.quantityAvailable <= 0) {
    return (
      <span className="text-xs font-medium text-(--color-destructive)">
        Out of stock
      </span>
    );
  }

  return (
    <span className="text-xs font-medium text-(--color-foreground)">
      In stock ({data.quantityAvailable})
    </span>
  );
}
