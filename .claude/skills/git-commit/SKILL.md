---
name: git-commit
description: "Stage and commit pending changes to git using SmartMart's Conventional Commits convention (type(scope): description, one feature/module per commit) per both apps' PROJECT-RULES.md §Git Workflow. Use when the user asks to commit, \"commit this\", \"tạo commit\", \"git commit\", or \"lưu thay đổi vào git\"."
---

# Git Commit — SmartMart convention

Only run when the user explicitly asks for a commit. Never commit proactively.

## 1. Gather context (run in parallel)

- `git status` — see all changed/untracked files (never `-uall`)
- `git diff` — unstaged changes; `git diff --staged` if anything is already staged
- `git log --oneline -10` — recent message style to match

## 2. Determine scope

SmartMart commits are scoped to one feature/module, matching the folder the change lives in:

- Frontend (`02-frontend-nextjs`): `src/features/<name>/...` → scope `<name>` (kebab-case, e.g. `chat`, `catalog`, `cart`)
- Backend (`03-backend-nestjs`): `src/modules/<name>/...` → scope `<name>` (e.g. `orders`, `inventory`, `payments`)
- Shared docs (`01-share-docs`) or cross-cutting infra (`shared/`, root config) → scope names the area, e.g. `docs`, `shared`, `deps`

If the diff spans two or more unrelated features/modules, **stop and ask** whether to split into separate commits instead of bundling — don't silently combine them into one.

## 3. Draft the message

Format: `<type>(<scope>): <description>` — [Conventional Commits](https://www.conventionalcommits.org/).

- **type:** `feat` | `fix` | `refactor` | `chore` | `test` | `docs` | `perf`
- **description:** imperative mood, lowercase, no trailing period, states *why*/*what changed* concisely — not a diff summary

Examples from this repo's own convention:
- `feat(chat): stream assistant replies via SSE`
- `fix(cart): prevent negative reserved stock on concurrent checkout`
- `docs(frontend): point to ui-ux-pro-max design system`

## 4. Stage carefully

- Add specific files by name — never `git add -A` / `git add .`
- Before staging, scan for anything that looks like a secret (`.env`, `credentials.json`, API keys, tokens) even in innocuous-looking files; exclude and warn the user if found

## 5. Commit

Use a heredoc so multi-line messages format correctly, and always end with the Co-Authored-By trailer:

```bash
git commit -m "$(cat <<'EOF'
<type>(<scope>): <description>

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

- Always create a **new** commit — never `--amend` unless the user explicitly asks
- Never `--no-verify`, `--no-gpg-sign`, or force-push
- If a pre-commit hook fails, fix the underlying issue, re-stage, and commit again (a new commit, not amend)

## 6. Confirm

Run `git status` after committing to verify a clean result, then report the commit hash and message back to the user.