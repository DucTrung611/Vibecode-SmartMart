# Backend: SmartMart (03-backend-nestjs)

## Tech Stack
- Language: TypeScript
- Framework: NestJS v11
- ORM: TypeORM 0.3.x + `@nestjs/typeorm` (not yet installed; repo is still the bare `nest new` starter — see DATABASE.md) — ⚠️ *confirm; Prisma is the alternative*
- Database: PostgreSQL 16+ (extensions `pgcrypto`, `citext`, `pg_trgm`, `ltree`, `vector`/pgvector ≥ 0.7)
- Cache/ephemeral layer: Redis, via `core/cache.module.ts` (not a persistence layer)

## Documentation

### Must Read
- @docs/PROJECT-RULES.md - Conventions, patterns, MUST/MUST NOT
- @docs/ARCHITECTURE.md - Folder structure, layers, feature anatomy

### Reference
- @../01-share-docs/API_SPEC.md - API contract
- @../01-share-docs/DATABASE.md - Schema

## Quick Reference

### Feature Location
`src/features/[name]/` - not yet scaffolded; repo is still the bare `nest new` starter (`src/app.*` only)

### Feature Boundary
A feature's service must never import another feature's internals directly — cross-feature access only via the target feature's exported service or domain events (PROJECT-RULES.md §3, ARCHITECTURE.md §5)

### Error Code Format
`<FEATURE>_<DESCRIPTOR>`, `UPPER_SNAKE_CASE` - e.g. `CATALOG_PRODUCT_NOT_FOUND`, `CART_ITEM_OUT_OF_STOCK` (API_SPEC.md §5)
