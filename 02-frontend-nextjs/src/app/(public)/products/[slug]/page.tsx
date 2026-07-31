import { notFound } from "next/navigation";
import { ProductDetailView } from "@/features/catalog";
import * as catalogService from "@/features/catalog/services/catalog.service";
import { ApiError } from "@/shared/types/api-envelope";

export const revalidate = 300;

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const { product, variants } = await loadProduct(slug);

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-8">
      <ProductDetailView product={product} variants={variants} />
    </div>
  );
}

async function loadProduct(slug: string) {
  try {
    const product = await catalogService.fetchProductBySlug(slug);
    const variants = await catalogService.fetchProductVariants(product.id);
    return { product, variants };
  } catch (error) {
    if (error instanceof ApiError && error.code === "CATALOG_PRODUCT_NOT_FOUND") {
      notFound();
    }
    throw error;
  }
}
