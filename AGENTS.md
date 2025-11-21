# AGENTS.md

## Setup commands
- Install deps: `pnpm install`
- Start dev server: `pnpm dev`

## Code style
- Use `pnpm` for all scripts and dependency changes.
- Keep changes small and focused on the specific issue or file.
- Avoid adding new dependencies unless absolutely necessary.
- Do not add or modify code comments unless explicitly requested.

## Review guidelines
- Don't log PII or secrets (names, phone numbers, email addresses, tokens, credentials).
- Verify that authentication middleware wraps every route that handles protected or user-specific data.
- Check that new endpoints validate input and handle errors safely (no raw error objects or stack traces sent to clients).
- Confirm that database access uses the existing Drizzle helpers and connection (`getDb`), not new drivers or raw connections.
- Prefer improving clarity, safety, and predictability over aggressive refactors.

## Agent boundaries
- Do not change the project structure, build tools, or database technology.
- Do not modify CI/CD workflows or repository settings.
- Do not enable logging of request bodies or headers that could include PII.
