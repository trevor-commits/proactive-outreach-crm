# Deployment Fix Implementation Steps

Follow these steps to apply and verify the fix for environments running Node 22 where native bindings are not prebuilt.

## Step-by-Step Instructions
1. Run `pnpm approve-builds` to allow native compilation for dependencies.
2. Rebuild `better-sqlite3` so the native binding is compiled for Node 22: `pnpm rebuild better-sqlite3`.
3. Start the dev server to confirm the application boots: `pnpm dev`.
4. Upload a test iPhone backup to ensure the upload flow still works end-to-end.

## PR Text Template
Paste this into the PR body after completing the checks:

### Summary
- Rebuild native dependencies for Node 22 compatibility.
- Confirm iPhone backup upload still works end-to-end.

### Root Cause
- `better-sqlite3` native binding was not built for Node 22, causing runtime failures.

### Fix
- Approved native builds and rebuilt `better-sqlite3` for Node 22.
- Verified the application by running the dev server and performing the iPhone upload test.

### Verification
- `pnpm approve-builds`
- `pnpm rebuild better-sqlite3`
- `pnpm dev`
- Confirm iPhone backup upload succeeds
