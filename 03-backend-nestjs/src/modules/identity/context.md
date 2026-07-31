# identity

## Purpose
Auth (register/login/JWT session), user profile, and shipping addresses. Foundation feature — every other feature depends on it for `user_id`/`X-Anonymous-Id` identity, but `identity` itself depends on nothing else.

## Owned tables
`users`, `user_identities`, `roles`, `user_roles`, `auth_sessions`, `user_addresses` (`DATABASE.md` §2).

## Public API (exported by `IdentityModule`)
- `AuthService` — `register`, `login`, `refresh`, `logout`.
- `UsersService` — `getProfile`, `updateProfile`, `listAddresses`, `createAddress`, `updateAddress`, `deleteAddress`.

Other features must go through these services (e.g. `orders` looking up a shipping address) — never import `identity`'s entities/repositories directly (`PROJECT-RULES.md` §3).

## Key decisions
- **Password hash: bcrypt (cost 10).** Slow+salted on purpose — passwords are low-entropy human input needing offline-brute-force resistance.
- **Refresh token hash: SHA-256, not bcrypt.** The token itself is `crypto.randomBytes(64)` (512 bits of entropy), so it doesn't need a slow hash to resist brute force, and refresh happens more often than login — a fast deterministic hash keeps that path cheap. Same pattern as Laravel Sanctum / typical opaque-token APIs.
- **Refresh rotation + reuse detection:** every `/auth/refresh` revokes the presented session and issues a new one, inside a transaction with `SELECT ... FOR UPDATE` on the session row (prevents two concurrent refreshes from both rotating). If the presented token is already revoked, that's treated as a breach signal — **every** active session for that user is revoked. Implementation detail worth remembering: the revoke-all side effect must NOT be inside the same `dataSource.transaction()` call that then throws, because throwing rolls back the whole transaction and undoes the revocation. `AuthService.refresh` returns a status string from inside the transaction and throws only after it has committed — see the comment in `services/auth.service.ts`.
- **Login/register do not leak which emails are registered.** `login` throws the same `IDENTITY_INVALID_CREDENTIALS` for "no such user" and "wrong password". `register` returns only the profile, no auto-login (product decision, not a technical constraint).
- **Default shipping address invariant:** the partial unique index `user_addresses_default_shipping_uq` allows only one `is_default_shipping = true` row per user. `UsersService.createAddress`/`updateAddress` unset the previous default inside a transaction before writing, to avoid a race with the constraint. Deleting the current default does not auto-promote another address.
- **Soft delete:** `users.deleted_at` relies on TypeORM's built-in `@DeleteDateColumn()` — standard `find()`/`findOneBy()` calls already exclude soft-deleted rows. The only place this can silently break is a raw `QueryBuilder` on `users` that forgets `deletedAt IS NULL` — none exist today in `UserRepository`, but watch for this if one is added (`DATABASE.md` §4 calls this "the #1 bug source").
- **Repository base class:** deliberately NOT extracted to `shared/`. Only `users` needs the soft-delete-aware pattern right now; revisit if a second feature needs the same thing.
- **Error code namespaces:** `AUTH_TOKEN_MISSING/_EXPIRED/_INVALID`, `AUTH_SESSION_INVALID`, `AUTH_FORBIDDEN` are fixed by `API_SPEC.md` §2/§5 and kept as-is (not renamed to `IDENTITY_*`). All other identity errors use `IDENTITY_*` (`IDENTITY_EMAIL_TAKEN`, `IDENTITY_INVALID_CREDENTIALS`, `IDENTITY_USER_NOT_FOUND`, `IDENTITY_ADDRESS_NOT_FOUND`).

## Shared infra this feature introduced
`src/shared/{filters,interceptors,guards,decorators,exceptions,types}` were built as part of this feature (first module in the repo) — kept intentionally minimal. `PaginationDto` and correlation-id middleware were deliberately deferred, not built speculatively.

## Events
None emitted yet. If a future feature needs to react to registration/login (e.g. a `notifications` welcome email), add `identity.user.registered` etc. via `EventEmitter2` at that point — not built ahead of a real consumer.

## Testing
- `tests/auth.service.spec.ts`, `tests/users.service.spec.ts` — unit, repositories mocked.
- `tests/user.repository.spec.ts` — integration, real Postgres (soft-delete exclusion can't be faithfully mocked).
- `tests/identity.e2e-spec.ts` — full HTTP flow against real Postgres: register → login → protected route → refresh rotation → reuse detection → logout → default-address invariant.

Both integration and e2e tests require `docker compose up -d postgres` (repo root) with migrations applied (`npm run migration:run`).
