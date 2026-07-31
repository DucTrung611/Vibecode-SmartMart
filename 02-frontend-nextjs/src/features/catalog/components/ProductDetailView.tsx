import Image from "next/image";
import { ProductDetail, ProductVariant } from "../types/catalog.types";
import { formatPrice } from "../utils/format-price";
import { Button } from "@/shared/components/Button";

interface ProductDetailViewProps {
  product: ProductDetail;
  variants: ProductVariant[];
}

export function ProductDetailView({ product, variants }: ProductDetailViewProps) {
  const primaryImage = product.images.find((image) => image.isPrimary) ?? product.images[0];

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-(--color-muted)">
        {primaryImage ? (
          <Image
            src={primaryImage.url}
            alt={product.name}
            fill
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover"
            priority
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-(--color-muted-foreground)">
            No image available
          </div>
        )}
      </div>

      <div className="flex flex-col gap-4">
        {product.brandName && (
          <span className="text-sm font-medium uppercase tracking-wide text-(--color-muted-foreground)">
            {product.brandName}
          </span>
        )}
        <h1 className="font-heading text-2xl font-semibold text-(--color-foreground)">
          {product.name}
        </h1>
        {product.ratingCount > 0 && (
          <span className="text-sm text-(--color-muted-foreground)">
            ★ {product.ratingAvg.toFixed(1)} ({product.ratingCount} reviews)
          </span>
        )}
        <p className="text-3xl font-semibold text-(--color-foreground)">
          {formatPrice(product.basePrice, product.currencyCode)}
        </p>
        {product.description && (
          <p className="text-(--color-muted-foreground)">{product.description}</p>
        )}

        {variants.length > 0 && (
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-(--color-foreground)">
              Options
            </span>
            <div className="flex flex-wrap gap-2">
              {variants.map((variant) => (
                <span
                  key={variant.id}
                  className="rounded-lg border border-(--color-border) px-3 py-1.5 text-sm text-(--color-foreground)"
                >
                  {Object.values(variant.optionSummary).join(" / ") || variant.sku}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* No `cart` feature yet (WORKFLOW.md builds it after inventory) — disabled placeholder so the CTA slot is visible without implying it works. */}
        <Button className="mt-4 w-full sm:w-auto" disabled title="Coming soon">
          Add to cart
        </Button>
      </div>
    </div>
  );
}
