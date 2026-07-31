"use client";

import { Button } from "@/shared/components/Button";
import { useProducts } from "../hooks/useProducts";
import { ProductListFilters, ProductListResult } from "../types/catalog.types";
import { ProductCard } from "./ProductCard";

interface ProductGridProps {
  filters: Omit<ProductListFilters, "cursor">;
  initialPage: ProductListResult;
}

export function ProductGrid({ filters, initialPage }: ProductGridProps) {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useProducts(filters, initialPage);

  const products = data?.pages.flatMap((page) => page.items) ?? [];

  if (products.length === 0) {
    return (
      <p className="py-16 text-center text-(--color-muted-foreground)">
        No products found.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
      {hasNextPage && (
        <div className="flex justify-center">
          <Button
            variant="secondary"
            onClick={() => fetchNextPage()}
            isLoading={isFetchingNextPage}
          >
            Load more
          </Button>
        </div>
      )}
    </div>
  );
}
