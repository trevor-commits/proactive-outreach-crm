# Deployment Fix Implementation Steps

Use these steps to validate the iPhone import path now that it relies on `sql.js` (no native bindings) and the main database is MySQL via `DATABASE_URL`.

## Step-by-Step Instructions
1. Ensure `DATABASE_URL` points to a reachable MySQL instance.
2. Install dependencies: `pnpm install`.
3. Run tests: `pnpm test`.
4. Start the dev server: `pnpm dev`.
5. Upload a test iPhone backup (sms.db and CallHistory.storedata) and confirm the import succeeds.

## PR Text Template

### Summary
- Use `sql.js` for reading uploaded iPhone SQLite backups in-memory.
- Keep the primary app database on MySQL via `drizzle-orm/mysql2`.

### Root Cause
- Native `better-sqlite3` bindings were unavailable in the runtime environment, causing upload failures.

### Fix
- Removed `better-sqlite3` usage and dependency.
- Ensured iPhone parsing runs on `sql.js` without native bindings.
- Confirmed MySQL connectivity via `DATABASE_URL`.

### Verification
- `pnpm install`
- `pnpm test`
- `pnpm dev`
- Upload iPhone backup and confirm success
