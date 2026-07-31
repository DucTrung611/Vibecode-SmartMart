# catalog (frontend)

## Purpose
Product listing (search/filter/sort), product detail, category navigation — consumes the backend `catalog` feature (`03-backend-nestjs/src/modules/catalog/`).

## Public API (`index.ts`)
- `ProductGrid`, `ProductFilters`, `CategoryNav`, `ProductDetailView`, `ProductCard` — page-level/composable components.
- `useProducts` — TanStack Query `useInfiniteQuery` wrapper for "load more" pagination.
- Types mirroring the backend's response DTOs (`ProductSummary`, `ProductDetail`, `ProductVariant`, `CategoryNode`, `Brand`, `ProductListFilters`, `ProductListResult`).

## Key decisions
- **Listing is Server-Component-first, client-interactive only for "load more".** `app/(public)/products/page.tsx` fetches the first page + category tree server-side (SSR, ISR `revalidate: 300`) and passes it as `initialData` into `useProducts` (`useInfiniteQuery`) — the client only takes over when "Load more" is clicked, so the initial page never double-fetches.
- **Filters live in the URL, not feature state** (`category`, `brand`, `q`, `sort`, `minPrice`, `maxPrice`), per `ARCHITECTURE-FRONTEND.md` §5 — `ProductFilters` (client) edits `searchParams` via `router.push`, the route's server component re-fetches on navigation. `CategoryNav` links do the same (`?category=slug`).
- **`shared/lib/api-client.ts` gained `apiFetchEnvelope`.** `apiFetch` previously discarded `envelope.meta` entirely — fine for `identity` (nothing paginated), but `catalog`'s product list needs `meta.pagination.{nextCursor,hasMore}` (`API_SPEC.md` §4), which the unwrapped `T` return has nowhere to carry. `apiFetch` now calls `apiFetchEnvelope` internally and returns `.data`, so existing callers are unaffected; `catalog.service.fetchProducts` is the first caller of the new export.
- **`next/image` requires the backend host allow-listed** (`next.config.ts` → `images.remotePatterns`, `localhost:6060/static/**`) since product images are cross-origin from the frontend's own port in dev. The backend's static file serving itself isn't wired up yet either (see backend `catalog/context.md`) — images will 404 until that lands; the frontend code is written against the contract, not blocked on it.
- **No cart integration yet.** `ProductDetailView`'s "Add to cart" button is a disabled placeholder — `cart` is the next feature in `WORKFLOW.md`'s build order, not built yet.
- **Variant display is read-only** — the detail page lists each variant's flattened `optionSummary` as a static chip; no selection/quantity/stock-aware UI since `cart`/`inventory` don't exist on the frontend yet.

## Out of scope (deferred)
- Brand filter UI (service function `fetchBrands` exists; no component consumes it yet — add a `BrandNav`/filter chip when a design calls for it).
- Cart integration (`Add to cart` button).
- Reviews on the product detail page (`reviews` feature not built yet).

## Testing
- `services/catalog.service.test.ts` — mocked `apiFetch`/`apiFetchEnvelope`.
- `components/ProductCard.test.tsx` — RTL, renders name/price/image fallback.
- Hook/route-level tests deferred — `useProducts` and the two route files are thin wrappers over the tested service; add if a bug surfaces there.
