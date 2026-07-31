# catalog

## Purpose
Brands, categories, products, variants, and images — the central product data every other commerce feature (`inventory`, `cart`, `orders`, `reviews`) and every AI feature reads through. `catalog` depends on nothing else.

## Owned tables
`brands`, `categories`, `products`, `product_categories`, `product_options`, `product_option_values`, `product_variants`, `product_variant_option_values`, `product_images` (`DATABASE.md` §2).

## Public API (exported by `CatalogModule`)
- `ProductsService` — `listProducts`, `getProductBySlug`, `getVariants`, `createProduct`, `updateProduct`, `uploadImage`.
- `CategoriesService` — `getCategoryTree`.
- `BrandsService` — `listBrands`.

Other features must go through these services (e.g. `cart` resolving a `product_variants` price) — never import `catalog`'s entities/repositories directly (`PROJECT-RULES.md` §3).

## Key decisions
- **No ORM relations between catalog entities.** Every table maps to a plain entity with foreign-key id columns only (no `@ManyToOne`/`@OneToMany`) — same pattern as `identity`. Cross-table reads (e.g. brand name for a product) are separate repository calls batched in the service, not `find({ relations })`, to avoid the join explosion `DATABASE.md` §6 warns about on `products → variants → option_values`.
- **Variant reads never join option tables.** `product_variants.option_summary` is the registered denormalization (`DATABASE.md` §4) that flattens a variant's option values onto the row — `GET /catalog/products/:id/variants` reads it directly. `product_options`/`product_option_values`/`product_variant_option_values` exist in the schema (owned here) but have no repository yet — nothing reads them until a write path that maintains `option_summary` is built. Documented gap, not an oversight.
- **Product list is cursor-paginated, single sort key only.** `sort=field:dir,...` is parsed but only the first key is honored — the cursor only encodes `(sortValue, id)` for one column (`API_SPEC.md` §3 says the same: "encodes `(sort_value, id)` of the last row seen", singular). Sortable columns are allow-listed to `price`→`basePrice`, `ratingAvg`, `createdAt` (`PRODUCT_SORT_COLUMNS` in `types/catalog.types.ts`) — anything else throws `VALIDATION_INVALID_SORT` (400). Keyset comparison is a manual `(col, id) < (cursorVal, cursorId)` QueryBuilder condition (`ProductRepository.findList`), not TypeORM's `skip`/`take`, per the `DATABASE.md` §6 gotcha that `take`/`skip` with joins forces a subquery.
- **Public product list is always `status = 'published'`, non-deleted.** No status filter is exposed on `GET /catalog/products` — admins editing drafts read them via `getProductBySlug`/`getProductById`-style lookups elsewhere if ever needed; out of scope today since no such endpoint exists in `API_SPEC.md` §6.
- **Admin-only writes use a new `RolesGuard` + `@Roles()` decorator** (`shared/guards/roles.guard.ts`, `shared/decorators/roles.decorator.ts`) — didn't exist before this feature since `identity` had no admin-gated routes yet. Runs after the global `JwtAuthGuard`; routes without `@Roles()` are unaffected. Throws `AUTH_FORBIDDEN` (403), matching `API_SPEC.md` §2/§5.
- **Pagination envelope support added to the shared `TransformInterceptor`.** It previously only ever wrapped `{ timestamp }` meta (no feature needed pagination yet). It now detects a `{ items, pagination }` shape (`shared/types/paginated-result.type.ts`) and unwraps it into `data`/`meta.pagination` per `API_SPEC.md` §4, instead of every paginated controller building the envelope by hand.
- **Slug conflicts are checked explicitly, not relied on for the partial unique index to throw.** `ProductsService.createProduct`/`updateProduct` look up the slug first and throw `CATALOG_SLUG_CONFLICT` (409) with a clear message — letting the DB constraint fail would surface `AllExceptionsFilter`'s generic `COMMON_INTERNAL_ERROR` fallback for pg unique-violation errors, which isn't handled today.
- **Image upload has no object storage yet.** `POST /catalog/products/:id/images` writes the file to local disk (`catalog.imageStorageDir`, default `uploads/products/`) and builds a URL from `catalog.imageBaseUrl` (default `/static/products`) — a deliberate stand-in documented in `catalog.config.ts`, not wired to any CDN/bucket. Swap the body of `ProductsService.uploadImage` for a real uploader later; the method's contract (`(productId, file) => ImageResponseDto`) shouldn't need to change. No static file serving is registered in `main.ts` yet either — uploaded files are written but not yet servable over HTTP.
- **Category tree is built in-memory from a flat, active-only list**, not via `path` ltree queries — `categories.path` is populated by the migration/seed layer (not yet built) and reserved for future subtree queries (`DATABASE.md` §2); `CategoriesService.getCategoryTree` only needs `parent_id` to nest today's dataset size.
- **`product_categories.is_primary`** is set on create via `categoryId` (a single primary category), matching the partial unique index `product_categories_primary_uq`. There's no endpoint yet to attach additional (non-primary) categories to a product — add one when a real caller needs it.

## Error codes
`CATALOG_PRODUCT_NOT_FOUND` (404), `CATALOG_SLUG_CONFLICT` (409), `CATALOG_UNSUPPORTED_IMAGE` (415, not in `API_SPEC.md`'s representative list but follows the same `<FEATURE>_<DESCRIPTOR>` format), `VALIDATION_INVALID_SORT` (400).

## Events
None emitted yet. `orders`/`reviews` will eventually need to read/update `products.rating_avg`/`total_sold` — out of scope here; those are that feature's write path against a shared table, not a `catalog` responsibility.

## Testing
- `tests/products.service.spec.ts`, `tests/categories.service.spec.ts`, `tests/brands.service.spec.ts` — unit, repositories mocked.
- Repository/e2e tests (real Postgres, cursor pagination correctness, GIN/trgm search) deferred — not written yet; flag before relying on `ProductRepository.findList` in production.
