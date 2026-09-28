# CLAUDE.md — PureCart

@AGENTS.md

<!-- AGENTS.md imported above: commands, key entry points, non-lintable rules, commit/branch/PR format. Sections below are Claude Code-specific. -->

---

## Compact Instructions

When compacting, preserve these — they cause the most bugs when forgotten mid-session:

- **Done criteria — PHP:** `composer cs` zero errors before committing
- **Done criteria — src/:** `npx tsc --noEmit` + `npm run lint:js` + `npm run lint:css` + `npm run build`
- **`@wordpress/route` is rejected** — always use `react-router-dom`
- **Module boundaries** — only import from `modules/X/index.ts`, never internal paths
- **Action Scheduler only** — no `wp_cron`
- **HPOS** — `wc_get_order()` only, no `wp_posts` queries for orders
- **Stub modules** — no Redux/API without a matching PHP controller

---

## Where to look first

| Task | Start here |
|---|---|
| Any `src/` work | `src/DEVELOPMENT_GUIDELINES.md` — read before writing code |
| New React module | `src/app/modules/subscriptions/` — most complete reference |
| PHP module wiring | An existing `includes/<Module>/Module.php` for patterns |
| DB schema / tables | `includes/Activator.php` + `includes/Store/` |
| New REST endpoint | `includes/API/PureCartApi.php` (base) + existing controller |
| Settings / flags | `includes/Settings/OptionKeys.php` |
| Subscription / SaaS context | `docs/` R&D briefs before implementing |

---

## Agentic workflow rules

1. **Read before writing.** `src/`: read `DEVELOPMENT_GUIDELINES.md` first. PHP: read the module's `Module.php`.
2. **Match existing patterns** — inspect a neighbor module before inventing a structure.
3. **Stub modules are stubs** — no Redux state or API calls without a matching PHP controller.
4. **Don't bundle unrelated changes** — note other problems; fix only what was asked.
5. **Don't pre-create empty folders** — add module subfolders when the code lands.
6. **Verify done means done** — run the done-criteria commands before reporting complete.
7. **One logical change per PR** — large features need an issue discussion before opening against `main`.

---

## Instruction priority

```
User's explicit task instructions
        ↓
src/DEVELOPMENT_GUIDELINES.md  (for src/ work)
        ↓
.claude/rules/ path-scoped rules  (active when working in matching files)
        ↓
AGENTS.md / CLAUDE.md conventions
        ↓
Conventions in nearby code
        ↓
General best-practice default
```
