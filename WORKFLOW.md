# WORKFLOW.md — Quy trình vibecode SmartMart

Tài liệu này mô tả **vòng lặp phát triển một feature** trong SmartMart — từ lúc chọn feature đến lúc commit — theo đúng quy ước đã có ở `CLAUDE.md`, `01-share-docs/`, và `docs/PROJECT-RULES.md`/`docs/ARCHITECTURE*.md` của từng app. Không lặp lại nội dung các file đó, chỉ trỏ tới đúng mục cần đọc ở từng bước.

Giả định: môi trường dev cơ bản (Node, Postgres, `npm install` ở mỗi app) đã chạy được. Tài liệu này không phải hướng dẫn setup hạ tầng.

## 0. Nguyên tắc chung

- **Docs-first**: không viết code trước khi đọc tài liệu liên quan đến phần đó (root `CLAUDE.md` §Important).
- **Không sáng tạo convention mới** khi đã có pattern trong `PROJECT-RULES.md`/`ARCHITECTURE.md` — theo đúng cấu trúc đã định nghĩa.
- **Một feature = một vertical slice ở cả 2 phía**, cùng tên thư mục:
  `03-backend-nestjs/src/modules/<name>/` ↔ `02-frontend-nextjs/src/features/<name>/`

## 1. Thứ tự triển khai feature

Dựa trên quan hệ phụ thuộc giữa các bảng/service (`01-share-docs/DATABASE.md` §3): 3 feature AI (`recommendations`, `chat`, `visual-search`) phụ thuộc `catalog`+`tracking`, không có chiều ngược lại — nên luôn làm sau cùng.

| # | Feature | Vì sao ở vị trí này |
|---|---|---|
| 1 | `identity` | Nền tảng auth — mọi feature khác cần user/guest identity |
| 2 | `catalog` | Brands/categories/products/variants/images — trung tâm dữ liệu |
| 3 | `inventory` | Phụ thuộc `product_variants` |
| 4 | `cart` | Phụ thuộc `catalog` + `inventory` |
| 5 | `orders` | Phụ thuộc `cart` + `inventory` |
| 6 | `payments` | Phụ thuộc `orders` |
| 7 | `reviews` | Phụ thuộc `catalog` + `orders` (verified review qua `order_item_id`) |
| 8 | `tracking` | Độc lập, nhưng cần có trước để nuôi dữ liệu cho AI features |
| 9 | `recommendations` / `chat` / `visual-search` | Phụ thuộc `catalog` + `tracking`; có thể tắt riêng lẻ mà không vỡ checkout |

Đây là thứ tự **khuyến nghị** để tránh phải mock service của feature chưa tồn tại — không phải luật cứng. Nếu cần demo gấp một feature cụ thể, có thể nhảy cóc và mock tạm phần phụ thuộc.

## 2. Vòng lặp phát triển 1 feature

### Bước 0 — Chọn & khoanh phạm vi
- Xác định feature cần làm (vd: `cart`).
- Đọc bảng feature đó sở hữu trong `01-share-docs/DATABASE.md` §2.
- Đọc endpoint liên quan trong `01-share-docs/API_SPEC.md` §6 (và §7 nếu có chi tiết đặc biệt như SSE/upload).

### Bước 1 — Backend slice
Đọc trước: `03-backend-nestjs/CLAUDE.md` → `docs/PROJECT-RULES.md` §1–2 (cấu trúc, naming) → `docs/ARCHITECTURE.md` §3–4 (feature anatomy, request flow).

1. Tạo `src/modules/<feature>/` đúng cấu trúc `ARCHITECTURE.md` §3: `controller / module / <feature>.config.ts / services / repositories / dto / entities / types / utils / tests / context.md`.
2. Viết `context.md` **trước** — mục đích feature, bảng sở hữu, public API, invariant. File này là "spec" dẫn đường cho phần code còn lại.
3. Code theo thứ tự layer: Entity → Repository (mọi SQL/QueryBuilder chỉ ở đây) → Service (business logic, transaction) → DTO (`class-validator`) → Controller (chỉ routing + delegate).
4. Cross-feature access **chỉ** qua service export hoặc `EventEmitter2` — không bao giờ import entity/repository của module khác (`PROJECT-RULES.md` §3, §5).
5. Module `exports` chỉ service, không export repository/entity (`ARCHITECTURE.md` §8).

### Bước 2 — Frontend slice
Đọc trước: `02-frontend-nextjs/CLAUDE.md` (+ `AGENTS.md` nếu đụng API Next.js mới) → `docs/PROJECT-RULES.md` §1–6 → `docs/ARCHITECTURE-FRONTEND.md` §3, §7–8.

1. Tạo `src/features/<feature>/` **cùng tên** module backend: `components / hooks / services / stores / types / utils / index.ts / context.md`.
2. Code theo thứ tự: Service (`services/<feature>.service.ts`, gọi qua `shared/lib/api-client.ts`) → Hook (bọc TanStack Query) → Component → route file mỏng trong `app/` (chỉ import từ `features/*/index.ts`, không chứa business logic).
3. Chỉ `index.ts` được import từ ngoài feature (`PROJECT-RULES.md` §3).
4. Server Component mặc định; `'use client'` chỉ ở leaf cần interactivity.
5. Nếu cần UI mới/màu sắc: dùng skill `ui-ux-pro-max`, và ưu tiên đọc `design-system/smartmart/MASTER.md` nếu đã tồn tại thay vì tự bịa palette.

### Bước 3 — Nối 2 phía
- Đối chiếu response envelope thực tế (`{success, data, meta}` / `{success:false, error:{code,message,details}}`) và error code (`<FEATURE>_<DESCRIPTOR>`) đúng `API_SPEC.md` §4–5.
- Test thủ công 1 luồng chính: gọi qua UI, kiểm tra network tab / response khớp `API_SPEC.md`.

### Bước 4 — Test
- Backend: `*.service.spec.ts` (unit), `*.repository.spec.ts`, `*.e2e-spec.ts` — coverage ≥80% trên `services/` + `repositories/` (`PROJECT-RULES.md` §7 backend).
- Frontend: test `hooks/` + `services/` (mock API, error-path), component qua React Testing Library (hành vi, không phải implementation) — coverage ≥80% trên `hooks/`+`services/` (`PROJECT-RULES.md` §8 frontend).

### Bước 5 — Commit
Dùng skill `git-commit` (đã cấu hình ở `.claude/skills/git-commit/`):
- Conventional Commits scoped theo feature: `feat(cart): add item to cart`.
- Mỗi commit ứng với 1 feature/module — không `git add -A`, không gộp nhiều feature không liên quan.
- Branch: `type/feature-scope-desc` (vd: `feat/cart-add-item`, `fix/orders-refund-amount`).

### Bước 6 — Definition of Done
- [ ] Lint pass (cả 2 app nếu đụng cả 2)
- [ ] Typecheck pass
- [ ] Test pass, coverage đạt ngưỡng ở Bước 4
- [ ] `context.md` của feature đã cập nhật
- [ ] Response envelope & error code khớp `API_SPEC.md`
- [ ] Không có import chéo internals giữa các feature (`PROJECT-RULES.md` §3/§5 mỗi app)

## 3. Tra nhanh — đang làm gì thì đọc gì

| Đang làm | Đọc trước |
|---|---|
| Backend service/business logic | `03-backend-nestjs/docs/PROJECT-RULES.md` §3–4, §8 |
| Backend module mới / cấu trúc thư mục | `03-backend-nestjs/docs/ARCHITECTURE.md` §2–3 |
| Frontend component/hook mới | `02-frontend-nextjs/docs/PROJECT-RULES.md` §4–6 |
| Frontend routing/data flow | `02-frontend-nextjs/docs/ARCHITECTURE-FRONTEND.md` §4–8 |
| Migration / thay đổi schema | `01-share-docs/DATABASE.md` §5–6 |
| Endpoint mới / thay đổi contract | `01-share-docs/API_SPEC.md` §3–5 |
| Auth / token flow | `01-share-docs/API_SPEC.md` §2 |

## 4. Ghi chú môi trường hiện tại

Tính đến thời điểm viết file này: backend mới chỉ là `nest new` starter trần (chưa cài TypeORM, chưa có `core/database/`, chưa có module nào ngoài `app.*`); frontend là Next.js mặc định (chưa có `features/` nào). Vì vậy khi làm feature đầu tiên (`identity`), Bước 1 sẽ cần tự thêm phần hạ tầng tối thiểu (`core/database/database.module.ts` với `TypeOrmModule.forRootAsync`, `shared/guards/JwtAuthGuard`, v.v.) như một phần của việc code feature đó — không phải một giai đoạn setup tách riêng.
