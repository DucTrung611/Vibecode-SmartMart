import { CategoryNav, ProductFilters, ProductGrid } from "@/features/catalog";
import * as catalogService from "@/features/catalog/services/catalog.service";

interface ProductsPageProps {
  searchParams: Promise<{
    category?: string;
    brand?: string;
    q?: string;
    sort?: string;
    minPrice?: string;
    maxPrice?: string;
  }>;
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams;
  const filters = {
    category: params.category,
    brand: params.brand,
    q: params.q,
    sort: params.sort,
    minPrice: params.minPrice ? Number(params.minPrice) : undefined,
    maxPrice: params.maxPrice ? Number(params.maxPrice) : undefined,
  };

  const [initialPage, categories] = await Promise.all([
    catalogService.fetchProducts(filters),
    catalogService.fetchCategoryTree(),
  ]);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-8 lg:flex-row">
      <aside className="lg:w-56 lg:shrink-0">
        <CategoryNav categories={categories} activeSlug={params.category} />
      </aside>
      <div className="flex flex-1 flex-col gap-6">
        <ProductFilters />
        <ProductGrid filters={filters} initialPage={initialPage} />
      </div>
    </div>
  );
}
