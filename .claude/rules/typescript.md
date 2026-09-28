---
paths:
  - "src/**/*.ts"
  - "src/**/*.tsx"
---

# TypeScript / React Conventions

Read `src/DEVELOPMENT_GUIDELINES.md` before editing anything here. These are the rules most likely to cause hard-to-debug issues when violated:

## Architecture

- **Dependency direction:** `main → modules → shared → theme` — never reverse it
- **Cross-module imports:** only from `modules/X/index.ts` — never `modules/X/components/Foo` directly
- **`shared/`:** only code that works if every module were deleted — no domain knowledge here

## Required libraries

- **REST:** `@wordpress/api-fetch` only — not raw `fetch`
- **Strings:** `@wordpress/i18n` with domain `purecart` — hardcoded English is a production bug
- **Routing:** `react-router-dom` — `@wordpress/route` is **rejected** (§10 of DEVELOPMENT_GUIDELINES.md explains why at length)

## TypeScript

- `strict: true` enforced; `any` is banned — use `unknown` + narrowing
- One React component per file; max 500 lines (justify exceptions with a comment)

## New modules

- Reference `src/app/modules/subscriptions/` for folder structure
- Only create subfolders (`api/`, `store/`, `hooks/`) when code that uses them lands
- Stub module = one page component + `index.ts` — nothing else until the PHP backend exists

## Done

`npx tsc --noEmit` + `npm run lint:js` + `npm run lint:css` + `npm run build` all pass.
