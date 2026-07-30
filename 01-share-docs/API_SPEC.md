# API_SPEC.md — SmartMart REST API

Read alongside `ARCHITECTURE.md` (module boundaries) and `DATABASE.md` (schema, owned tables). Every endpoint below maps to a feature under `src/modules/`; the controller in that feature is the only place the route is defined.

## 1. Overview

| | |
|---|---|
| **Base URL** | `https://api.smartmart.com/v{version}` — e.g. `https://api.smartmart.com/v1/catalog/products` |
| **Local dev** | `http://localhost:3000/v1` |
| **Versioning** | Nest URI versioning (`VersioningType.URI`, `defaultVersion: '1'`, set in `main.ts`). Every controller declares `@Controller({ path: '...', version: '1' })`. |
| **Version bump rule** | Additive changes (new field, new endpoint) ship in `v1` with no bump. Breaking changes (removed/renamed field, changed status code, changed auth) require `v2`; `v1` stays live until deprecation window closes. |
| **Content-Type** | `application/json` for all standard requests/responses. `multipart/form-data` only for file upload endpoints (§3). |
| **Encoding** | UTF-8. Timestamps ISO 8601 UTC (`2026-07-30T09:15:00Z`) — matches `timestamptz` convention in `DATABASE.md` §4. |

## 2. Authentication

**Method:** JWT, access + refresh pair, backed by the `identity` feature's `auth_sessions` table.

| | |
|---|---|
| **Header format** | `Authorization: Bearer <access_token>` |
| **Access token** | Short-lived (15 min), signed JWT, `sub` = `users.id`, includes `roles`. Stateless — not stored server-side. |
| **Refresh token** | Long-lived (30 days), opaque random string. Only its **hash** is stored (`auth_sessions.refresh_token_hash`), returned to client as an `httpOnly`, `Secure`, `SameSite=Strict` cookie — never in a JSON body. |
| **Guest / anonymous flows** | `cart`, `tracking`, `chat` accept an `X-Anonymous-Id` header (client-generated UUID) when no `Authorization` header is present — mirrors the nullable `user_id` / `anonymous_id` columns in `DATABASE.md` §2. |

**Token flow:**
```
POST /v1/auth/login          → { accessToken }  + Set-Cookie: refreshToken (httpOnly)
POST /v1/auth/refresh        → rotates refresh token, issues new accessToken
                                (old refresh_token_hash row gets revoked_at set)
POST /v1/auth/logout         → sets auth_sessions.revoked_at = now()
```
- Refresh rotation is mandatory: each `/auth/refresh` call revokes the presented token and issues a new one. Reuse of a revoked token revokes the **entire session family** (breach signal).
- `JwtAuthGuard` (in `shared/guards/`) is registered globally; routes opt **out** via `@Public()`, not the other way around.

**Auth error handling:**

| Situation | HTTP | Error code |
|---|---|---|
| Missing/malformed `Authorization` header | 401 | `AUTH_TOKEN_MISSING` |
| Expired access token | 401 | `AUTH_TOKEN_EXPIRED` |
| Invalid signature / tampered token | 401 | `AUTH_TOKEN_INVALID` |
| Refresh token expired, revoked, or reused | 401 | `AUTH_SESSION_INVALID` |
| Valid token, insufficient role | 403 | `AUTH_FORBIDDEN` |

Client behavior on `AUTH_TOKEN_EXPIRED`: silently call `/auth/refresh` once, retry the original request; on `AUTH_SESSION_INVALID`, force re-login.

## 3. Request Conventions

**Pagination** — two modes, chosen per endpoint based on the index shape in `DATABASE.md`:
- **Offset** (`shared/dto/PaginationDto`) for small/admin lists: `?page=1&limit=20`.
- **Cursor** (keyset) for large, naturally-ordered feeds — product listings, order history, chat messages — to use the existing `(col DESC)` / BRIN indexes instead of an `OFFSET` scan: `?limit=20&cursor=<opaque_base64>`. The cursor encodes `(sort_value, id)` of the last row seen.

```
GET /v1/catalog/products?limit=24&cursor=eyJwcmljZSI6MTk5OSwiaWQiOi...
GET /v1/orders?limit=20&page=2
```

**Sorting** — `?sort=field:direction`, comma-separated for multi-key, **allow-listed per endpoint** to columns that are actually indexed (e.g. `catalog/products` allows `price`, `ratingAvg`, `createdAt` only — matching the indexes in `DATABASE.md` §2 — anything else is a `400 VALIDATION_INVALID_SORT`):
```
GET /v1/catalog/products?sort=ratingAvg:desc,price:asc
```

**Filtering** — one query param per filterable field, mapped in the repository to the underlying GIN/trgm/jsonb index:
```
GET /v1/catalog/products?category=running-shoes&brand=nike&minPrice=50&maxPrice=200&tags=summer,sale&q=trail
```

**Request body** — JSON, `camelCase` keys (mapped to `snake_case` columns in the entity layer), validated by `class-validator` DTOs with `whitelist: true, forbidNonWhitelisted: true` (`PROJECT-RULES.md` §4) — unknown fields are a `400`, not silently dropped.

**File upload** — `multipart/form-data`, `FileInterceptor`/`FilesInterceptor`, used only by:
| Endpoint | Field | Limits |
|---|---|---|
| `POST /v1/catalog/products/:id/images` | `file` | ≤ 8 MB, `image/jpeg\|png\|webp`, uploaded to object storage, URL written to `product_images.url` |
| `POST /v1/visual-search` | `image` | ≤ 8 MB, same types, never persisted — streamed to the embedding model then discarded |

**Idempotency** — mutating endpoints that create money-moving side effects require an `Idempotency-Key` header (client-generated UUID), checked against `payments.idempotency_key`:
```
POST /v1/payments
Idempotency-Key: 3f1a9e2b-...
```
A retry with the same key returns the original response instead of double-charging.

## 4. Response Format

Enforced globally by `TransformInterceptor` / `AllExceptionsFilter` (`shared/interceptors/`, `shared/filters/`) — controllers never build this envelope by hand.

**Success:**
```json
{
  "success": true,
  "data": { "id": "b3c1...", "name": "Trail Runner Pro" },
  "meta": { "timestamp": "2026-07-30T09:15:00Z" }
}
```

**Success (paginated):**
```json
{
  "success": true,
  "data": [ { "...": "..." } ],
  "meta": {
    "timestamp": "2026-07-30T09:15:00Z",
    "pagination": { "limit": 24, "nextCursor": "eyJwcmljZSI6...", "hasMore": true }
  }
}
```

**Error:**
```json
{
  "success": false,
  "error": {
    "code": "CATALOG_PRODUCT_NOT_FOUND",
    "message": "Product 8f2a... not found",
    "details": null
  }
}
```
`details` carries structured info when useful — e.g. `class-validator` field errors — and is `null` otherwise. Never expose stack traces or raw SQL errors in `details` outside `development`.

## 5. Error Codes

**Format:** `<FEATURE>_<DESCRIPTOR>`, `UPPER_SNAKE_CASE` — e.g. `CATALOG_PRODUCT_NOT_FOUND`, `CART_ITEM_OUT_OF_STOCK`. This adapts the template's `[FEATURE]_[NUMBER]` scheme to the descriptive style `PROJECT-RULES.md` §4 already establishes (`PRODUCT_NOT_FOUND`): a numeric code needs a lookup table to be readable in logs, a descriptive one is self-explanatory and still greppable/groupable by feature prefix.

**Cross-cutting codes** (not tied to one feature):

| Code | HTTP | Meaning |
|---|---|---|
| `VALIDATION_FAILED` | 400 | DTO validation failed; `details` lists per-field errors |
| `AUTH_TOKEN_MISSING` / `_EXPIRED` / `_INVALID` | 401 | See §2 |
| `AUTH_SESSION_INVALID` | 401 | Refresh token expired/revoked/reused |
| `AUTH_FORBIDDEN` | 403 | Authenticated but lacks required role |
| `COMMON_NOT_FOUND` | 404 | Generic fallback when no feature-specific code applies |
| `COMMON_RATE_LIMITED` | 429 | Throttle exceeded |
| `COMMON_INTERNAL_ERROR` | 500 | Unhandled exception, caught by `AllExceptionsFilter` |

**Representative per-feature codes:**

| Feature | Example codes |
|---|---|
| `identity` | `IDENTITY_EMAIL_TAKEN` (409), `IDENTITY_INVALID_CREDENTIALS` (401) |
| `catalog` | `CATALOG_PRODUCT_NOT_FOUND` (404), `CATALOG_SLUG_CONFLICT` (409) |
| `inventory` | `INVENTORY_INSUFFICIENT_STOCK` (409) |
| `cart` | `CART_ITEM_OUT_OF_STOCK` (409), `CART_MAX_ITEMS_EXCEEDED` (422) |
| `orders` | `ORDERS_EMPTY_CART` (400), `ORDERS_INVALID_STATUS_TRANSITION` (409) |
| `payments` | `PAYMENTS_DECLINED` (402), `PAYMENTS_IDEMPOTENCY_CONFLICT` (409) |
| `reviews` | `REVIEWS_ALREADY_REVIEWED` (409) — one review per `(product_id, user_id)` |
| `chat` | `CHAT_CONVERSATION_NOT_FOUND` (404), `CHAT_MODEL_TIMEOUT` (504) |
| `visual-search` | `VISUAL_SEARCH_UNSUPPORTED_IMAGE` (415) |

**HTTP status usage:**

| Status | Used for |
|---|---|
| `200` | Successful GET/PATCH/POST that doesn't create a resource |
| `201` | Successful POST that creates a resource (`Location` header set) |
| `204` | Successful DELETE, no body |
| `400` | Malformed request / validation failure |
| `401` | Missing/invalid/expired auth |
| `402` | Payment declined |
| `403` | Authenticated, forbidden |
| `404` | Resource not found |
| `409` | Conflict (duplicate, stale state, invalid transition) |
| `415` | Unsupported media type (bad upload) |
| `422` | Semantically invalid (business-rule rejection) |
| `429` | Rate limited |
| `500` / `504` | Server error / upstream (model) timeout |

## 6. Endpoints by Feature

### `identity`
| Method | Path | Description | Auth |
|---|---|---|---|
| POST | `/v1/auth/register` | Create account | Public |
| POST | `/v1/auth/login` | Issue access + refresh token | Public |
| POST | `/v1/auth/refresh` | Rotate refresh, issue new access token | Refresh cookie |
| POST | `/v1/auth/logout` | Revoke session | JWT |
| GET | `/v1/users/me` | Current user profile | JWT |
| PATCH | `/v1/users/me` | Update profile/preferences | JWT |
| GET | `/v1/users/me/addresses` | List addresses | JWT |
| POST | `/v1/users/me/addresses` | Add address | JWT |
| PATCH | `/v1/users/me/addresses/:id` | Update address | JWT |
| DELETE | `/v1/users/me/addresses/:id` | Remove address | JWT |

### `catalog`
| Method | Path | Description | Auth |
|---|---|---|---|
| GET | `/v1/catalog/products` | List/search/filter products | Public |
| GET | `/v1/catalog/products/:slug` | Product detail | Public |
| GET | `/v1/catalog/products/:id/variants` | Variants + option values | Public |
| GET | `/v1/catalog/categories` | Category tree | Public |
| GET | `/v1/catalog/brands` | Brand list | Public |
| POST | `/v1/catalog/products` | Create product | JWT (admin) |
| PATCH | `/v1/catalog/products/:id` | Update product | JWT (admin) |
| POST | `/v1/catalog/products/:id/images` | Upload product image | JWT (admin) |

### `inventory`
| Method | Path | Description | Auth |
|---|---|---|---|
| GET | `/v1/inventory/variants/:variantId` | Stock levels for a variant | Public |
| PATCH | `/v1/inventory/variants/:variantId/adjust` | Manual stock adjustment | JWT (admin) |

### `cart`
| Method | Path | Description | Auth |
|---|---|---|---|
| GET | `/v1/cart` | Get active cart | JWT or `X-Anonymous-Id` |
| POST | `/v1/cart/items` | Add item | JWT or `X-Anonymous-Id` |
| PATCH | `/v1/cart/items/:itemId` | Update quantity | JWT or `X-Anonymous-Id` |
| DELETE | `/v1/cart/items/:itemId` | Remove item | JWT or `X-Anonymous-Id` |
| POST | `/v1/cart/merge` | Merge anonymous cart into user cart on login | JWT |

### `orders`
| Method | Path | Description | Auth |
|---|---|---|---|
| POST | `/v1/orders` | Checkout (cart → order, in one DB transaction) | JWT or guest email |
| GET | `/v1/orders` | List own orders | JWT |
| GET | `/v1/orders/:id` | Order detail | JWT (owner) |
| GET | `/v1/orders/:id/status-history` | Status transitions | JWT (owner) |
| POST | `/v1/orders/:id/returns` | Request a return | JWT (owner) |

### `payments`
| Method | Path | Description | Auth |
|---|---|---|---|
| POST | `/v1/payments` | Charge for an order (idempotent) | JWT (owner) |
| GET | `/v1/payments/:id` | Payment detail | JWT (owner) |
| POST | `/v1/payments/:id/refunds` | Issue a refund | JWT (admin) |

### `reviews`
| Method | Path | Description | Auth |
|---|---|---|---|
| GET | `/v1/catalog/products/:productId/reviews` | List published reviews | Public |
| POST | `/v1/catalog/products/:productId/reviews` | Submit review (verified if `order_item_id` present) | JWT |
| POST | `/v1/reviews/:id/vote` | Mark helpful/unhelpful | JWT |

### `tracking`
| Method | Path | Description | Auth |
|---|---|---|---|
| POST | `/v1/tracking/events` | Ingest batched behavior events | JWT or `X-Anonymous-Id` |

### `recommendations`
| Method | Path | Description | Auth |
|---|---|---|---|
| GET | `/v1/recommendations/for-you` | Personalized feed (may read replica, seconds-stale) | JWT or `X-Anonymous-Id` |
| GET | `/v1/catalog/products/:id/similar` | Similar products | Public |

### `chat`
| Method | Path | Description | Auth |
|---|---|---|---|
| POST | `/v1/chat/conversations` | Start a conversation | JWT or `X-Anonymous-Id` |
| GET | `/v1/chat/conversations/:id` | Conversation + message history | JWT (owner) or `X-Anonymous-Id` |
| POST | `/v1/chat/conversations/:id/messages` | Send message, streamed assistant reply (SSE, §8) | JWT (owner) or `X-Anonymous-Id` |
| POST | `/v1/chat/messages/:id/feedback` | Thumbs up/down on a reply | JWT or `X-Anonymous-Id` |

### `visual-search`
| Method | Path | Description | Auth |
|---|---|---|---|
| POST | `/v1/visual-search` | Upload image → matching products | Public |

## 7. Endpoint Details

### `POST /v1/orders` — checkout
Runs inside the single `QueryRunner` transaction described in `DATABASE.md` §6 (`SELECT ... FOR UPDATE` on inventory → order + items → cart converted).

**Request:**
```json
{ "cartId": "b7e2...", "shippingAddressId": "a1c9...", "paymentMethodId": "pm_9f..." }
```
**Response `201`:**
```json
{
  "success": true,
  "data": {
    "id": "0c44...",
    "orderNumber": "SM-2026-000482",
    "status": "pending_payment",
    "total": 129.98,
    "items": [ { "productName": "Trail Runner Pro", "quantity": 1, "unitPrice": 129.98 } ]
  },
  "meta": { "timestamp": "2026-07-30T09:15:00Z" }
}
```
**Error cases:** `ORDERS_EMPTY_CART` (400), `INVENTORY_INSUFFICIENT_STOCK` (409, includes `details.variantId`), `CART_ITEM_OUT_OF_STOCK` (409) if stock changed since last cart read.

### `POST /v1/chat/conversations/:id/messages` — send message
Request is standard JSON; response is a **Server-Sent Events stream**, not the standard envelope (see §8 for why).

**Request:**
```json
{ "content": "Show me waterproof trail shoes under $150" }
```
**Response (`Content-Type: text/event-stream`):**
```
event: token
data: {"text":"Here are"}

event: product
data: {"productId":"8f2a...","name":"Trail Runner Pro","position":1,"reason":"waterproof, in budget"}

event: done
data: {"messageId":"91af...","inputTokens":142,"outputTokens":38}
```
**Error cases:** `CHAT_CONVERSATION_NOT_FOUND` (404, before stream opens), `CHAT_MODEL_TIMEOUT` — sent as an `event: error` frame mid-stream, since headers are already flushed.

### `POST /v1/visual-search` — image search
**Request:** `multipart/form-data`, field `image`.
**Response `200`:**
```json
{
  "success": true,
  "data": [
    { "productId": "8f2a...", "name": "Trail Runner Pro", "distance": 0.081 },
    { "productId": "3c91...", "name": "All-Terrain Hiker", "distance": 0.114 }
  ],
  "meta": { "timestamp": "2026-07-30T09:15:00Z" }
}
```
Matches the HNSW cosine-distance query pattern in `DATABASE.md` §6 (`product_image_embeddings`, `is_active`, `model_version` filtered before ANN search).
**Error cases:** `VISUAL_SEARCH_UNSUPPORTED_IMAGE` (415), `COMMON_INTERNAL_ERROR` (500) if the embedding model is unreachable — never surfaces a raw model error to the client.

## 8. Tech-Specific Additions

**Server-Sent Events for chat** — `chat` is the one place the standard JSON envelope doesn't apply. Token-by-token AI replies use Nest's `@Sse()` decorator returning an `Observable`, not a Bull queue: the controller streams directly while the service still enforces the "don't block on inference" rule from `PROJECT-RULES.md` §8 by handing generation off to the AI provider call and forwarding its stream. Reconnection: client sends `Last-Event-ID`; the `chat` service replays from `chat_messages` for that conversation.

**No GraphQL / gRPC / WebSockets** — the API is REST + SSE only. GraphQL was considered for the product catalog (flexible field selection) but rejected to keep one query pattern across a 5–10 person team; WebSockets were considered for chat but SSE is sufficient since the client never needs to push mid-stream.

**Rate limiting** — `@nestjs/throttler`, global default (e.g. 100 req/min/IP), tighter per-route overrides on `POST /v1/auth/login` (brute-force) and `POST /v1/visual-search` (compute-expensive) via `@Throttle()`.
