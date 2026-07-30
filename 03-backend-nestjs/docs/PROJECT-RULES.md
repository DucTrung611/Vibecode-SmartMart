# PROJECT-RULES.md

Backend rules for **SmartMart** — feature-based NestJS. Read alongside `DATABASE.md`.

**Stack:** TypeScript 5.x · NestJS 10.x · TypeORM 0.3.x + PostgreSQL

## 1. Feature Structure

```
src/modules/product-catalog/
├── product-catalog.controller.ts
├── product-catalog.module.ts
├── services/
│   └── product-catalog.service.ts
├── repositories/
│   └── product.repository.ts
├── dto/
│   ├── create-product.dto.ts
│   └── product-response.dto.ts
├── entities/
│   └── product.entity.ts
├── types/
│   └── product-catalog.types.ts
├── utils/
│   └── slug.util.ts
├── tests/
│   ├── product-catalog.service.spec.ts
│   └── product-catalog.e2e-spec.ts
└── context.md          # feature purpose, owned tables, public API, invariants
```

Every module is a **NestJS `@Module`** exporting only its service(s) — never its repository or entities.

## 2. Naming Conventions

| Item | Style | Example |
|---|---|---|
| Feature folder | `kebab-case`, noun | `product-catalog/`, `visual-search/` |
| File | `kebab-case.type.ts` | `create-order.dto.ts`, `order.repository.ts` |
| Class | `PascalCase` + suffix matches file type | `OrderService`, `CreateOrderDto`, `OrderRepository` |
| Method / function | `camelCase`, verb-first | `findActiveCart()`, `calculateShippingFee()` |
| Variable / constant | `camelCase`; module-level constants `UPPER_SNAKE_CASE` | `orderTotal`, `MAX_CART_ITEMS` |
| Interface / Type | `PascalCase`, no `I` prefix | `OrderSummary`, not `IOrderSummary` |
| Enum | `PascalCase` type, `PascalCase` members | `OrderStatus.Pending` |

## 3. Feature Rules

- A feature owns its tables (see `DATABASE.md` §2) and is the **only** module allowed to inject its repositories.
- **No direct imports** between feature internals — not entities, not repositories, not services' private methods.
- Cross-feature communication, in order of preference:
  1. **Shared service** — import the other module and inject its exported service.
  2. **Domain events** — `EventEmitter2` for side effects that shouldn't block the caller (e.g. `order.placed` → `recommendations` updates affinities).
  3. **Shared DI tokens** — for cross-cutting concerns (cache, config) via `shared/`.
- Shared code lives in `src/shared/`: `shared/enums`, `shared/decorators`, `shared/filters`, `shared/interceptors`, `shared/dto` (e.g. `PaginationDto`), `shared/config`.

```ts
// DO — cross-feature via exported service
import { CatalogService } from '../catalog/catalog.service';
constructor(private readonly catalogService: CatalogService) {}
const product = await this.catalogService.findById(productId);

// DON'T — reaching into another feature's internals
import { ProductRepository } from '../catalog/repositories/product.repository';
```

## 4. Code Patterns

**Errors** — throw Nest's built-in `HttpException` subclasses from the service layer; a global `AllExceptionsFilter` (in `shared/filters/`) formats every response. Never `console.log` an error and swallow it.

```ts
// DO
if (!product) throw new NotFoundException(`Product ${id} not found`);

// DON'T
if (!product) return null; // caller has to guess why
```

**Validation** — `class-validator` decorators on every DTO; enable globally via `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true })` in `main.ts`. Controllers never hand-check input.

```ts
export class CreateOrderDto {
  @IsUUID() userId: string;
  @IsArray() @ValidateNested({ each: true }) @Type(() => OrderItemDto)
  items: OrderItemDto[];
}
```

**Logging** — Nest's built-in `Logger`, one instance per class (`new Logger(OrderService.name)`), never `console.log`. Log at service boundaries (entry with key params, and failures), not inside tight loops.

**Response format** — a global `TransformInterceptor` wraps every success response; errors go through `AllExceptionsFilter`:

```json
{ "success": true, "data": { "...": "..." }, "meta": { "timestamp": "..." } }
{ "success": false, "error": { "code": "PRODUCT_NOT_FOUND", "message": "..." } }
```

## 5. Anti-patterns (MUST NOT)

| ❌ Don't | ✅ Do instead |
|---|---|
| `import { X } from '../orders/entities/order.entity'` from another feature | Import `OrdersService` and call its public method |
| Two modules importing each other's modules (circular) | Extract the shared contract into `shared/` or emit an event |
| `if (dto.total > 1000000) applyDiscount()` in a controller | Move all business rules into the service/usecase layer |
| `this.dataSource.query(...)` inside a service or controller | All SQL/QueryBuilder calls live in `*.repository.ts` |
| `const API_KEY = 'sk-...'` in code | `ConfigService.get('PAYMENT_API_KEY')`, sourced from env/secrets |

## 6. Git Workflow

- **Branches:** `type/feature-scope-short-desc` — `feat/chat-add-product-cards`, `fix/orders-refund-amount`, `chore/catalog-index-tuning`.
- **Commits:** [Conventional Commits](https://www.conventionalcommits.org/), scoped to the feature — `feat(chat): attach product cards to assistant replies`, `fix(inventory): prevent negative reserved stock`.
- **PRs:** one feature/module per PR where possible; PR description states which tables/entities are touched; must include tests; must pass lint + typecheck + CI migrations-against-snapshot check; needs 1 approval from a code owner of the touched module before merge.

## 7. Testing

- **Location:** colocated in the feature's `tests/` folder — no separate top-level `test/` tree except e2e bootstrap.
- **Naming:** `*.service.spec.ts` (unit), `*.repository.spec.ts` (unit, mocked DB), `*.e2e-spec.ts` (integration, real test DB via Testcontainers).
- **Structure:** Arrange–Act–Assert, one `describe` per method, `it('should ...')`:

```ts
describe('OrderService.placeOrder', () => {
  it('should throw when cart is empty', async () => {
    await expect(service.placeOrder(emptyCartId)).rejects.toThrow(BadRequestException);
  });
});
```

- **Coverage:** ≥ 80% lines on `services/` and `repositories/`; controllers covered via e2e, not unit mocks. CI fails under threshold.

## 8. NestJS-Specific Conventions

- **Module wiring:** `TypeOrmModule.forFeature([Order, OrderItem])` inside the feature module only; `exports: [OrdersService]`, never the repository or entities.
- **Guards / Pipes / Interceptors:** feature-specific ones live in the feature folder (`orders/guards/`); cross-cutting ones (`JwtAuthGuard`, `TransformInterceptor`, global `ValidationPipe`) live in `shared/` and are registered in `main.ts` or `AppModule`.
- **DTOs vs Entities:** controllers only ever see DTOs; TypeORM entities never cross the controller boundary — map explicitly in the service (or a mapper class in `utils/`).
- **Config:** `@nestjs/config` with a typed `ConfigService`; one `<feature>.config.ts` per module registering its own namespace (`registerAs('chat', () => ({...}))`), no raw `process.env` reads outside `shared/config`.
- **Events:** `@nestjs/event-emitter`; event names are `<feature>.<past-tense-verb>` (`cart.checked_out`, `payment.captured`); payload is a typed class in `shared/events/`, not a bare object.
- **Async/queues:** long-running AI work (embeddings, recommendation batch) goes through `@nestjs/bull` queues in the owning feature — controllers must return immediately, never block on model inference.
