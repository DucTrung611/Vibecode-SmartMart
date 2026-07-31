# Project: SmartMart

## Overview
An e-commerce platform. Covers product catalog (brands, categories, variants), cart, orders, payments, reviews, behavior tracking, AI-driven recommendations, chat, and visual search (image-based product search).

## Tech Stack
  - Frontend: Next.js (App Router), TypeScript
  - Backend: NestJS v11, TypeScript
  - Database: PostgreSQL 16+ (extensions `pgcrypto`, `citext`, `pg_trgm`, `ltree`, `vector`/pgvector ≥ 0.7)
  - ORM: TypeORM 0.3.x + `@nestjs/typeorm` (not yet installed; repo is still the bare `nest new` starter — see `01-share-docs/DATABASE.md`) — ⚠️ *confirm; Prisma is the alternative*
  - Cache/ephemeral layer: Redis

## Structure
```
├── 03-backend-nestjs/  → @03-backend-nestjs/CLAUDE.md
├── 02-frontend-nextjs/ → @02-frontend-nextjs/CLAUDE.md
└── 01-share-docs/      → Shared documentation
```

## Shared Docs
- @01-share-docs/API_SPEC.md
- @01-share-docs/DATABASE.md
- @WORKFLOW.md — vibecode workflow: feature dev loop, implementation order, DoD checklist

## Important
- Follow @WORKFLOW.md when implementing a feature — it defines the dev loop and reading order
- Always read the shared docs above BEFORE generating code
- Each app also has its own ARCHITECTURE.md and PROJECT-RULES.md under `<app>/docs/` (see each app's CLAUDE.md) — read those before writing feature code in that app
- Follow existing patterns in the codebase once feature code exists; don't invent conventions ahead of it
