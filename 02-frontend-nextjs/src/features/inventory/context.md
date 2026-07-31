# inventory (frontend)

## Purpose
Displays live stock levels for a `product_variants` row — consumes the backend `inventory` feature (`03-backend-nestjs/src/modules/inventory/`). No write UI yet (`PATCH .../adjust` is admin-only, no admin surface exists on this frontend).

## Public API (`index.ts`)
- `StockBadge` — leaf client component, renders "In stock (N)" / "Out of stock" / "Stock unavailable" for a given `variantId`.
- `useVariantStock` — TanStack Query wrapper around `GET /inventory/variants/:variantId`.
- `VariantStock` — type mirroring `InventoryResponseDto` from the backend.

## Key decisions
- **`StockBadge` is the only client boundary, not the whole product page.** `catalog`'s `ProductDetailView` stays a Server Component; `StockBadge` is `'use client'` at the leaf, per `ARCHITECTURE-FRONTEND.md` §[Next.js-Specific Additions] ("`'use client'` only at the leaf that needs hooks/state/interactivity"). Fetching stock server-side alongside the product/variants was considered and rejected: stock is far more volatile than product data (which is ISR-cached at `revalidate: 300`), so it's fetched client-side, uncached, per variant.
- **No distinction between "variant not found" and "not yet provisioned."** Mirrors the backend gap documented in its `context.md` — both surface as `INVENTORY_ITEM_NOT_FOUND`, and `StockBadge` renders the same neutral "Stock unavailable" for any error, not just genuine 404s.
- **One `useVariantStock` call per variant.** `ProductDetailView` renders a `StockBadge` per variant already listed in its option chips — no aggregate "is anything in stock" query, since there's no variant-selection UI yet to aggregate against.
- **No mutation hook.** `PATCH /inventory/variants/:variantId/adjust` is admin-only and there's no admin UI in this app yet; add a `useAdjustStock` mutation when one exists.

## Out of scope (deferred)
- Admin stock-adjustment UI.
- Reserving/decrementing stock from `cart` — `cart` doesn't exist yet; when it's built it should import `useVariantStock`/`fetchVariantStock` from this feature's `index.ts` rather than re-implementing the fetch.

## Testing
- `services/inventory.service.test.ts` — mocked `apiFetch`.
- Component/hook tests for `StockBadge`/`useVariantStock` deferred — thin wrappers over the tested service; add if a bug surfaces there.
