@AGENTS.md

# Frontend: SmartMart (02-frontend-nextjs)

## Tech Stack
- Language: TypeScript
- Framework: Next.js (App Router)
- State management: TanStack Query (server state) + Zustand (minimal global state — auth session, cart badge, theme); feature-local Zustand stores need no provider wiring
- Styling: TailwindCSS
- Routing: Next.js App Router (file-based, route groups for `(public)` / `(shop)` / `(account)`)
- HTTP client: Axios instance in `shared/lib/api-client.ts` — one interceptor layer handles `Authorization: Bearer` attachment and silent token refresh on `401 AUTH_TOKEN_EXPIRED`; SSE (chat) uses a shared `shared/lib/sse-client.ts` stream reader

## Documentation

### Must Read
- @docs/PROJECT-RULES.md - Conventions, patterns, MUST/MUST NOT
- @docs/ARCHITECTURE-FRONTEND.md - Folder structure, layers, feature anatomy

### Reference
- @../01-share-docs/API_SPEC.md - API contract (endpoints, auth flow, response envelope, error codes to consume)
- @../01-share-docs/DATABASE.md - Schema (entity shapes returned by the API)

## Quick Reference

### Feature Location
`features/[name]/` - feature-based, self-contained vertical slices (`product-catalog`, `cart`, `orders`, `chat`, `visual-search`, ...), mirroring the backend's `modules/` 1:1; see ARCHITECTURE-FRONTEND.md §2-3

### Response Handling
API responses follow `{ success, data, meta? }` / `{ success: false, error: { code, message, details } }` (API_SPEC.md §4) — unwrap this envelope once in `shared/lib/api-client.ts`, don't repeat it per call site

### Error Code Format
`<FEATURE>_<DESCRIPTOR>`, `UPPER_SNAKE_CASE` - e.g. `CATALOG_PRODUCT_NOT_FOUND`, `CART_ITEM_OUT_OF_STOCK` (API_SPEC.md §5)

### Server vs Client Components
Server Components by default for data-heavy/SEO pages (catalog, product pages call a feature's `service.ts` directly for server-rendered initial data); `'use client'` only where genuine interactivity is needed (cart, chat, visual-search, forms) — see PROJECT-RULES.md §[Next.js-Specific Additions]

### Design System
Before building new UI or picking colors/typography, use the `ui-ux-pro-max` skill (stack `nextjs`) instead of inventing a palette — its output must still fit our Tailwind + component conventions (PROJECT-RULES.md §4, §6). If `design-system/smartmart/MASTER.md` exists, read and follow it as the source of truth rather than regenerating; only ask to regenerate if the user explicitly wants a redesign.
