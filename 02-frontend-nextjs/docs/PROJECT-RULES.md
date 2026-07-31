# PROJECT-RULES.md — SmartMart Frontend

Frontend rules for **SmartMart** — feature-based Next.js. Read alongside `ARCHITECTURE.md` / `API_SPEC.md` (backend).

**Stack:** Next.js (App Router) · React · TypeScript 5.x · TanStack Query (server state) · React Context (client/global state) · Tailwind CSS · `fetch` (native)

**Confirmed deviations from the original template** (chosen when building `identity`, see its `context.md` for the reasoning): `fetch` instead of Axios — to use Next.js's built-in cache/`revalidate` options, which Axios doesn't have; React Context instead of Zustand — avoids an extra state library for state this small (session/global UI), kept feature-local with `useState`/`useReducer` for anything bigger.

## 1. Feature Structure

```
src/
├── app/                          # routes only — thin, imports from features/
│   └── (shop)/products/[slug]/page.tsx
├── features/
│   └── product-catalog/
│       ├── components/
│       │   └── ProductCard.tsx
│       ├── hooks/
│       │   └── useProductSearch.ts   # wraps TanStack Query + service
│       ├── services/
│       │   └── catalog.service.ts    # all fetch (apiFetch) calls live here
│       ├── types/
│       │   └── product.types.ts
│       ├── utils/
│       │   └── format-price.ts
│       ├── index.ts                  # public barrel — only export surface
│       └── context.md                # purpose, public API, invariants
└── shared/
    ├── components/                   # design-system primitives only (Button, Modal)
    ├── hooks/                        # useDebounce, useMediaQuery
    ├── lib/                          # api-client.ts (fetch wrapper), queryClient, sse.ts
    └── context/
        └── session-context.tsx       # auth/session — the one cross-feature global state
```

`app/` route files stay thin: `page.tsx` imports a component from `features/*/index.ts` and passes route params — no business logic in `app/`.

## 2. Naming Conventions

| Item | Style | Example |
|---|---|---|
| Feature folder | `kebab-case`, noun, mirrors backend module name | `product-catalog/`, `visual-search/` |
| Component | `PascalCase.tsx`, one per file | `ProductCard.tsx`, `CartDrawer.tsx` |
| Hook | `camelCase`, `use` prefix | `useProductSearch.ts`, `useChatStream.ts` |
| Service | `kebab-case.service.ts`; functions `camelCase` verb-first | `fetchProductBySlug()` in `catalog.service.ts` |
| Context | `kebab-case-context.tsx` | `session-context.tsx` |
| Type / Interface | `PascalCase`, no `I` prefix | `Product`, `ProductFilters` |

## 3. Feature Rules

- Self-contained: a feature's `components/`, `hooks/` are private — **only `index.ts` is importable** from outside.
- **No direct imports** between feature internals (not another feature's component, hook, or context file).
- Cross-feature communication, in order of preference:
  1. **URL params** — filters/tabs/selected-id live in the URL (`useSearchParams`), so features compose at the route level, not feature-to-feature.
  2. **Global context (minimal)** — only `shared/context/session-context.tsx` (auth) and `cart-badge` count qualify; nothing feature-specific goes global.
  3. **Events** — a small `mitt`-based event bus in `shared/lib/events.ts` for decoupled side effects (`chat` emits `product-added-to-cart` → `cart` refetches, without importing it).
- Shared **components** live in `src/shared/components/` — presentational/design-system only, never domain-aware (no `ProductCard` there).

```tsx
// DO — cross-feature via URL + own data fetch
// app/(shop)/products/page.tsx
<ProductList category={searchParams.get('category')} />

// DON'T — reaching into another feature's internals
import { useCartContext } from '../cart/context/cart-context'; // ❌ not exported
```

## 4. Component Rules

- One component per file; co-locate its test (`ProductCard.test.tsx`) and styles (Tailwind classes inline; a `.module.css` beside it only for complex one-offs).
- Props always typed via an explicit `interface XProps` — no inferred/implicit `any`.
- Max **~150 lines** per component; past that, extract a sub-component or a hook.

```tsx
// DO
interface ProductCardProps { product: Product; onAddToCart: (id: string) => void; }
export function ProductCard({ product, onAddToCart }: ProductCardProps) { ... }
```

## 5. Code Patterns (MUST follow)

- **API calls** — only inside `services/*.service.ts` (thin wrappers over `shared/lib/api-client.ts`'s `apiFetch`), called from `hooks/` via TanStack Query — never `fetch` inside a component.
- **State** — local `useState`/`useReducer` first; a feature-local React Context only for state shared by ≥2 components *within* the feature; global context only per §3.
- **Error handling** — Next.js `error.tsx` boundary per route segment for render errors; toast/notification (`shared/components/Toast`) for recoverable mutation failures — errors read `error.code` from `API_SPEC.md` §4/§5, not just `message`.
- **Loading states** — skeleton components for initial fetch, inline spinner on the triggering button for mutations. Never a blank screen.
- **Forms** — React Hook Form + Zod schema (mirrors backend `class-validator` DTO shape) via `zodResolver`.

## 6. Anti-patterns (MUST NOT)

| ❌ Don't | ✅ Do instead |
|---|---|
| `import { X } from '../cart/components/CartItem'` | Import from `../cart` (its `index.ts`) |
| `fetch(...)` inside a component | Call a `hooks/useX` that wraps `services/x.service.ts` |
| `if (total > 1000) applyDiscount()` in JSX | Move the rule server-side or into a service function |
| Passing props through 3+ intermediate components | Feature-local React Context, or component composition |
| `const [x, setX]: any = useState()` | Explicit types everywhere; `strict: true` in `tsconfig.json` |
| `style={{ color: 'red' }}` | Tailwind class; inline `style` only for computed/dynamic values |

## 7. Git Workflow

- **Branches:** `type/feature-scope-desc` — `feat/catalog-filter-sidebar`, `fix/cart-quantity-rounding`.
- **Commits:** Conventional Commits, scoped to the feature — `feat(chat): stream assistant replies via SSE`.
- **PRs:** one feature per PR where possible; must pass lint + typecheck + tests; screenshot/Loom for UI changes; 1 approval before merge.

## 8. Testing

- **Location:** colocated `ComponentName.test.tsx` / `useHook.test.ts` beside the source file; e2e specs in top-level `e2e/` (Playwright).
- **What:** hooks (data + state logic) and services (mocked API, error-path handling) unit-tested; components tested via React Testing Library for behavior, not implementation; critical flows (checkout, chat send) covered end-to-end.
- **Coverage focus:** `hooks/` and `services/` ≥ 80% — this is where the actual logic lives; presentational components are covered by render + interaction tests, not a coverage target.

## [Next.js-Specific Additions]

- **Server vs Client Components:** default to Server Components; add `'use client'` only where hooks/interactivity are needed (forms, TanStack Query, Context consumers). Route `page.tsx` files can call a feature's `service.ts` directly for server-rendered initial data — TanStack Query is for client-side refetch/mutation, not the only fetch path.
- **SSE (chat):** `useChatStream` hook wraps the browser `EventSource`/`fetch` stream reader against `POST /v1/chat/conversations/:id/messages` (`API_SPEC.md` §7) — lives in `features/chat/hooks/`, not `shared/`, since only chat streams.
- **Providers:** `QueryClientProvider` and `SessionProvider` are set up once in `src/shared/providers/providers.tsx`, mounted from `app/layout.tsx`; feature-local Context providers wrap only the subtree that needs them, not the whole app.
