## Quick Orientation for AI Coding Agents

This file contains the minimum, high-value details to get productive in this repository.

- **Big picture:** A single-repo full‑stack app. Frontend is a Vite + React SPA in `client/`. Backend is an Express server with tRPC procedures in `server/` and server entry in `server/_core/index.ts`. Database schema and migrations live in `drizzle/` and Drizzle ORM is used throughout.

- **How to run locally (common tasks):**
  - Install: `pnpm install`
  - Dev (runs server in watch mode + Vite): `pnpm dev` (uses `tsx watch server/_core/index.ts`)
  - Build: `pnpm build` (runs `vite build` then `esbuild` to bundle server into `dist`)
  - Start (production): `pnpm start` (runs `node dist/index.js`)
  - DB push/migrations: `pnpm db:push` (drizzle-kit generate + migrate)

- **Key integration points & files** (inspect these first):
  - `server/_core/index.ts` — server bootstrap, Vite dev integration, body parser limits (50mb) used for uploads.
  - `server/routers.ts` — central tRPC router; primary procedures are `customers`, `interactions`, `services`, `outreach`, `recommendations`, `google`, `dataSources`.
  - `server/iphone-router.ts` and `server/iphone-extractor.ts` — iPhone backup upload + parsing.
  - `server/google-router.ts` and `server/google-integration.ts` — Google OAuth / Gmail / Calendar sync.
  - `server/db.ts` — DB helper functions used by tRPC handlers (normalization helpers live here).
  - `drizzle/schema.ts` — canonical database schema; useful for finding table/column names and indexes.
  - `client/src/main.tsx` — trpc client setup (notice `httpBatchLink` -> `/api/trpc` + `credentials: 'include'`).
  - `client/src/App.tsx` + `client/src/pages/*` — routing and UI entry points (wouter is used for routing).

- **API / RPC conventions to follow**
  - tRPC procedures use `publicProcedure` / `protectedProcedure` helpers (see `server/routers.ts`). When adding new procedures mirror input validation with `zod` and call `server/db.ts` helpers for normalization.
  - Do not return raw tokens to the frontend: `google.getCredentials` intentionally returns only `connected` and `expiresAt`.

- **Backend build details to preserve**
  - Development entry uses `tsx watch server/_core/index.ts` (not `ts-node`), so prefer small edits to server entry when debugging.
  - Production builds run `vite build` then `esbuild` to bundle the server with `--platform=node --format=esm` into `dist`.

- **Common pitfalls / repository-specific notes**
  - Large file uploads: body parser limit is set to `50mb` in `server/_core/index.ts`; uploads may fail if larger.
  - Phone/email normalization occurs in `server/db.ts` — when matching interactions to customers, call those helpers instead of reimplementing logic.
  - Frontend error handling redirects to login when `UNAUTHED_ERR_MSG` is returned (see `client/src/main.tsx`). Keep that exact string if adding auth-related errors.
  - `wouter` is patched (see `patches/wouter@3.7.1.patch`) — beware applying automatic dependency upgrades without checking patched behavior.

- **Environment variables used by the app**
  - `DATABASE_URL`, `JWT_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `PORT`, `VITE_APP_ID`, `OAUTH_SERVER_URL`.
  - Google OAuth flow is wired in `server/oauth` and `server/google-router.ts` — tokens are stored in `googleCredentials` table (see `drizzle/schema.ts`).

- **Where to look for examples**
  - tRPC endpoint patterns: `server/routers.ts` (customers create/update with normalization examples).
  - Recommendation scoring and filtering: `server/routers.ts` → `recommendations.get` (shows cooldown logic and scoring heuristics).
  - Database table shapes and indexes: `drizzle/schema.ts` (services, interactions, outreachLogs).

- **If you need to change behavior**
  - Modifying API surface: update `server/routers.ts` + corresponding client usage in `client/src/lib/trpc.ts` or pages under `client/src/pages`.
  - Adding DB columns: update `drizzle/schema.ts` and run `pnpm db:push`.

If any of the above is unclear or you want specific examples (e.g., adding a new tRPC procedure, or changing upload limits), tell me which part to expand and I will update this file accordingly.
