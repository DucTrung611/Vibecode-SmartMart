# identity (frontend)

## Purpose
Register/login/logout UI, session state, and profile display — consumes the backend `identity` feature (`03-backend-nestjs/src/modules/identity/`).

## Public API (`index.ts`)
- `RegisterForm`, `LoginForm`, `ProfileCard` — page-level components.
- `SessionBootstrap` — mounted once in `shared/providers/providers.tsx`; restores session on page load via the refresh cookie.
- `useCurrentUser` — TanStack Query wrapper over `GET /users/me`, seeded from session context.

## Key decisions
- **`fetch`, not Axios** (`shared/lib/api-client.ts`) — deliberate deviation from the original `PROJECT-RULES.md` draft, chosen to use Next.js's built-in fetch caching (`next: {revalidate}`) for future public endpoints (catalog, etc). Identity's own calls mostly use `cache: 'no-store'` since they're user-specific.
- **React Context, not Zustand** (`shared/context/session-context.tsx`) — deliberate deviation from the original `PROJECT-RULES.md` draft, to avoid a state library the app doesn't otherwise need. `shared/lib/auth-token.ts` holds the access token *outside* React (a plain module-level variable) so the non-React `apiFetch` retry logic can read/write it without a hook; `SessionContext.setSession()`/`clearSession()` are the only things that touch both the React state and the token holder, keeping them in sync.
- **Access token is in-memory only** (never localStorage) — matches the backend's bearer-token design (only the refresh token is a persisted, httpOnly cookie). Consequence: a full page reload loses the in-memory token even though the backend session is still valid, so `SessionBootstrap` calls `/auth/refresh` once on mount to restore it.
- **`login`'s `onSuccess` sets the access token *before* calling `getProfile()`** (`hooks/useLogin.ts`) — `getProfile()` needs `Authorization: Bearer <token>`, and `apiFetch` reads the token from `shared/lib/auth-token.ts` synchronously; setting it via `setSession()` alone would be too late since that call happens after `getProfile()` resolves.
- **`proxy.ts`** (app-level, not in this feature) gates the `(account)` route group by the mere *presence* of the `refresh_token` cookie — not signature verification (proxy runs on the Edge and shouldn't call the API). Real validation happens via the API + `apiFetch`'s `AUTH_SESSION_INVALID` handling.
- **Cross-port cookies in dev:** backend runs on `:6060`, frontend on `:3001`. The `refresh_token` cookie is host-only for `localhost` (no port scoping), so it's sent/received across both — this is dev-only behavior; production will need real CORS/cookie-domain configuration once frontend and backend are on different hosts.

## Out of scope (deferred)
- Address CRUD UI (backend supports it; no UI yet).
- Playwright e2e (only Jest + RTL unit/component tests exist).

## Testing
`identity.service.spec.ts` (mocked `global.fetch`), hook tests (mocked service), `LoginForm.test.tsx`/`RegisterForm.test.tsx` (RTL — validation errors, submit calls the right service).
