# inventory

## Purpose
Stock levels and stock-movement history for `product_variants`. Read by `cart`/`orders` (stock checks, reservation) once those features exist; writes come from admin manual adjustment today, and later from checkout/returns.

## Owned tables
`inventory_items`, `inventory_movements` (`DATABASE.md` §2).

## Public API (exported by `InventoryModule`)
- `InventoryService.getStock(variantId)` — current `quantity_on_hand`/`quantity_reserved`/`quantity_available` for a variant.
- `InventoryService.adjustStock(variantId, dto)` — atomic delta adjustment + movement log entry, `409 INVENTORY_INSUFFICIENT_STOCK` if it would go negative.

Other features must go through `InventoryService` — never import `InventoryItem`/`InventoryMovement` entities or their repositories directly (`PROJECT-RULES.md` §3).

## Key decisions
- **No auto-provisioning of `inventory_items` rows.** `inventory_items.variant_id` is a 1:1 PK/FK to `product_variants` (`DATABASE.md` §2), but `catalog` has no variant-creation endpoint yet (`API_SPEC.md` only exposes `GET .../variants`). So this feature does not listen for a `catalog` variant-created event — there's nothing to listen for. A variant with no `inventory_items` row (never provisioned) and a variant that doesn't exist are **indistinguishable** at this API: both return `404 INVENTORY_ITEM_NOT_FOUND`. Revisit this once catalog gets a variant-write path — the natural fix is a `catalog.variant.created` event this module listens to, per the events-based cross-feature pattern in `ARCHITECTURE.md` §5.
- **`quantity_available` is a DB-generated `STORED` column** (`quantity_on_hand - quantity_reserved`), so `InventoryItemRepository.save()` cannot return its post-update value — TypeORM doesn't refetch `insert:false/update:false` columns. `InventoryService.adjustStock` re-reads the row (`findByVariantIdFresh`) after the update+movement insert, inside the same transaction, before building the response.
- **`adjustStock` runs in one `dataSource.transaction()`** mirroring the pattern in `identity/services/auth.service.ts`: `SELECT ... FOR UPDATE` on `inventory_items` (`findByVariantIdForUpdate`, pessimistic write lock) → validate the resulting `quantity_on_hand >= 0` → update → insert `inventory_movements` row → re-read. The row lock prevents two concurrent adjustments from both reading the same starting quantity and both deciding a negative delta is safe.
- **`inventory_movements.type` is `text` + CHECK, not a PG enum**, per `DATABASE.md` §4 ("use text + CHECK for sets that churn") — mirrored as `MovementType` in this feature's own `types/`, not `shared/enums/`, since that guidance is specifically for stable PG enum types.
- **No reservation flow yet.** `quantity_reserved` exists in the schema and is read in the response, but nothing writes it — that's `cart`/`orders`' checkout reservation logic, built when those features land. Today `adjustStock` only ever changes `quantity_on_hand`.
- **`GET` is public, `PATCH .../adjust` is admin-only**, per `API_SPEC.md` §6 — reusing the `@Public()`/`@Roles('admin')` decorators and global `RolesGuard` introduced by `catalog`, not reinventing auth.

## Error codes
`INVENTORY_ITEM_NOT_FOUND` (404, not in `API_SPEC.md`'s representative list but follows the same `<FEATURE>_<DESCRIPTOR>` format), `INVENTORY_INSUFFICIENT_STOCK` (409, `details.variantId` set — matches the shape `orders`' checkout error is expected to reuse per `API_SPEC.md` §7).

## Events
None emitted or consumed yet. See the auto-provisioning gap above for the planned `catalog.variant.created` listener.

## Testing
- `tests/inventory.service.spec.ts` — unit, repositories mocked; covers `getStock` not-found, `adjustStock` happy path, insufficient-stock 409, not-found.
- Real-Postgres test of the `FOR UPDATE` lock + generated column under concurrent adjustment deferred (no test DB harness for this module yet) — flag before relying on this under real concurrent admin load.
