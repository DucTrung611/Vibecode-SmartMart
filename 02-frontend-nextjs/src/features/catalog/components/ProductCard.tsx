import Image from "next/image";
import Link from "next/link";
import { ProductSummary } from "../types/catalog.types";
import { formatPrice } from "../utils/format-price";

interface ProductCardProps {
  product: ProductSummary;
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <Link
      href={`/products/${product.slug}`}
      className="group flex cursor-pointer flex-col overflow-hidden rounded-xl border border-(--color-border) bg-(--color-background) transition-all duration-200 hover:-translate-y-0.5 hover:shadow-(--shadow-md)"
    >
      <div className="relative aspect-square w-full bg-(--color-muted)">
        {product.primaryImageUrl ? (
          <Image
            src={product.primaryImageUrl}
            alt={product.name}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            className="object-cover transition-transform duration-200 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-(--color-muted-foreground)">
            No image
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-4">
        {product.brandName && (
          <span className="text-xs font-medium uppercase tracking-wide text-(--color-muted-foreground)">
            {product.brandName}
          </span>
        )}
        <h3 className="line-clamp-2 font-heading text-sm font-semibold text-(--color-foreground)">
          {product.name}
        </h3>
        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="font-semibold text-(--color-foreground)">
            {formatPrice(product.basePrice, product.currencyCode)}
          </span>
          {product.ratingCount > 0 && (
            <span className="text-xs text-(--color-muted-foreground)">
              ★ {product.ratingAvg.toFixed(1)} ({product.ratingCount})
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
