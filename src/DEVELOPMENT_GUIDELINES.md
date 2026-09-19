# PureCart Admin SPA — Development Guidelines

This is the engineering contract for `src/` (the PureCart admin React app). It exists because the codebase was refactored from a type-first layout (`components/`, `api/`, `store/` at the top level) into a module-first one, and because that refactor also introduced WordPress-platform integration (`@wordpress/i18n`, `@wordpress/hooks`, `@wordpress/api-fetch`, `@wordpress/route`) that didn't exist before. Everything below reflects what was actually built, not an aspirational ideal — where an example is given, it names a real file in this repo.

All future development, refactoring, bug fixes, and AI-agent-generated code in `src/` must follow these rules. This file is the first thing to read before touching `src/`, and the first thing to update when an architectural convention changes.

---

## 1. Architecture

```
src/
├── main.tsx        entry point
├── app/            composition root — routing, store, providers, error boundary
├── modules/         one folder per business capability
├── shared/           cross-cutting infrastructure with no knowledge of any module
├── theme/             design tokens (Material 3)
└── styles/             plain CSS, no framework
```

Dependency direction is one-way:

```
main → app → modules → shared → theme
```

**Allowed:**
```
app       → modules
app       → shared
modules    → shared
modules    → theme
module/X's own components → module/X's own hooks/api/store/types
```

**Forbidden:**
```
shared → modules
shared → app
theme  → anything else in src/
modules/X → modules/Y's internals (only modules/Y's index.ts)
```

`app/` is composition only — it wires modules together (routing, the root Redux store, the ErrorBoundary/provider tree) and must not contain business logic itself. `shared/` is for code that would work identically if every module in `modules/` were deleted; if it needs to know what a "subscription" or a "license" is, it isn't shared code.

---

## 2. SOLID, applied pragmatically

- **Single Responsibility** — a file does one thing. A component renders; a hook manages state/side-effects; an `*.api.ts` file talks to the REST API; a `*.selectors.ts` file reads from the store.
- **Open/Closed** — extension happens through `@wordpress/hooks` filters/actions (§8) or through props, not by editing a module's internals from outside it.
- **Dependency Inversion** — modules depend on `shared/api`'s typed contracts, not on `fetch`/`apiFetch` directly scattered through components.
- Don't reach for an interface, a factory, or a generic abstraction to satisfy SOLID on paper. A 20-line function that does one obvious thing doesn't need a strategy pattern around it.

---

## 3. Component rules

1. One React component per file.
2. A component should normally stay well under 400 lines.
3. 400–500 lines is the outer boundary, not a target — treat it as a signal to look for extractable responsibility, not a hard stop to design around.
4. No component may exceed 500 lines without a comment at the top of the file explaining why (e.g. a large but genuinely single-purpose table with many column definitions).
5. Extract into: child components, hooks (`modules/<name>/hooks/`), utilities (`modules/<name>/utils/`), API modules, or selectors — whichever actually owns the responsibility being pulled out.
6. Don't split a component just to hit a line count if it has one real responsibility (e.g. `SubscriptionsTable.tsx` is long because it owns one table's column config, row rendering, and inline actions — legitimate single responsibility, not a god component).
7. Components render and compose UI. Business logic (billing math, churn scoring, dunning state transitions) belongs in `utils/` or the PHP backend that already owns it — not re-implemented in a component.
8. Avoid deeply nested JSX — extract a named sub-component instead of a fourth level of inline ternaries/maps.

Real example, `modules/subscriptions/components/`:
```
SubscriptionsPage.tsx
SubscriptionDetailPage.tsx
SubscriptionsTable.tsx
SubscriptionsFilterBar.tsx
SubscriptionsKpiStrip.tsx
SubscriptionsBulkBar.tsx
detail-tabs/OverviewTab.tsx
detail-tabs/RetentionTab.tsx
modals/CancellationFlowModal.tsx
shared/ChurnScoreBadge.tsx
```
Not one `Subscriptions.tsx` containing all of the above as nested function components — that's exactly the anti-pattern this rule exists to prevent.

---

## 4. Module rules

Each business capability lives under `src/modules/<module-name>/`. A module contains only the subfolders it actually needs:

```
modules/<name>/
├── api/            REST calls for this module only
├── components/      this module's UI
├── hooks/             module-specific React hooks
├── store/               Redux slice + selectors, if this module has global state
├── types/                 this module's domain types
├── utils/                   pure helper functions specific to this module's data
└── index.ts                  the module's public API
```

A stub module (no real functionality yet — `licenses`, `downloads`, `saas-accounts`, `security`, `affiliates`, `abandoned-cart`, `overview`) is just:
```
modules/licenses/
├── components/LicensesPage.tsx
└── index.ts
```
Don't create empty `api/`/`store/`/`hooks/` folders in anticipation of future work — add them when the work lands.

**Public API discipline.** `index.ts` exports exactly what other modules and `app/` are allowed to use. Nothing outside a module imports from a path like `modules/subscriptions/components/SubscriptionsTable` directly — it imports `SubscriptionsTable` (or whatever it needs) from `modules/subscriptions`. This was violated throughout the pre-refactor codebase (`modules/analytics` and `modules/settings` both reached into `modules/subscriptions`'s internals for types, shared components, and even called `useSubscriptionActions()` directly) — that's the exact failure mode this rule exists to prevent, and fixing it was part of the refactor itself, not a followup.

---

## 5. Shared-code rules

`shared/` is for code that is genuinely module-independent. Before adding something here, ask: **"Could this exist if every module were deleted?"** If the answer is no, it belongs inside the module that needs it, not here.

```
shared/
├── api/       client.ts (typed apiFetch wrapper — error normalization + response typing, nothing module-specific)
├── ui/          design-system primitives (Button, Card, Dialog, Toast, ComingSoon, ...)
├── layout/        Sidebar, TopBar — app chrome, not design-system atoms (see below)
└── types/           only genuinely cross-cutting types, e.g. the `Page` union used by routing
```

**Worked example of the test:** `Sidebar` and `TopBar` know about page navigation, the app's page list, and app-level layout — they don't work "if every module were deleted" in the same self-contained way `Button` or `Card` do. That's why they live in `shared/layout/`, separate from `shared/ui/`, rather than being lumped in with the design-system primitives. A shared UI component must never import a module's types or API — `shared/ui/SubscriptionCard.tsx` would be wrong; that component belongs at `modules/subscriptions/components/`.

---

## 6. WordPress platform packages

| Package | Installed version | Used for |
|---|---|---|
| `@wordpress/i18n` | 6.23.0 | All user-facing strings (§9) |
| `@wordpress/hooks` | 4.50.0 | Extension points only (§8) |
| `@wordpress/api-fetch` | 7.55.0, added in this refactor | REST communication (§7) |
| `@wordpress/route` | **evaluated, rejected — see §10** | not used |

Don't reimplement functionality these packages already provide — the pre-refactor codebase had hand-rolled `getApiBase()`/`getRestNonce()`/`apiFetch()` duplicating what `@wordpress/api-fetch` does; that's exactly what this rule prevents recurring.

---

## 7. REST API rules

Use `@wordpress/api-fetch` for all WordPress REST calls:

```ts
import apiFetch from '@wordpress/api-fetch';

export const getSubscriptions = async ( params?: SubscriptionQuery ): Promise< SubscriptionListResponse > =>
    apiFetch( { path: `/purecart/v1/subscriptions${ toQueryString( params ) }` } );
```

`shared/api/client.ts` provides application-wide concerns on top of `apiFetch` — error normalization into a single typed shape, and response typing helpers. It does **not** reimplement nonce handling, REST root URL resolution, or anything `apiFetch`'s own middleware already does, and it must never contain a module-specific endpoint. Feature endpoints belong in their module: `modules/subscriptions/api/`, `modules/updates/api/`, `modules/analytics/api/`.

Type every response. Don't use `any` to silence an API typing problem — see §13.

---

## 8. WordPress hooks rules

`@wordpress/hooks` is for genuine extension points — places where another module, a companion plugin, or a future Pro add-on plausibly needs to observe or alter behavior. It is not a replacement for props, component composition, Redux, or a normal function call.

**Namespace:** `purecart/dashboard/<hook-name>` (matches this plugin's actual identity — REST namespace `/wp-json/purecart/v1/`, PHP `PureCart\` namespace, `X-PureCart-Sig` webhook header. Do not use a different namespace.)

Use `applyFilters` for values that can be modified, `doAction` for events:

```ts
const actions = applyFilters(
	'purecart/dashboard/subscriptionActions',
	defaultActions,
	subscription
);
```
```ts
doAction( 'purecart/dashboard/subscriptionUpdated', subscription );
```

Every hook fired must document, at its call site, its name, its arguments, and (for a filter) what it returns. In addition, every hook name is listed once in `shared/hooks/extension-hooks.ts` as a single source of truth — don't scatter undocumented hook string literals through the codebase.

*(This section's worked examples get filled in with the actual hooks fired, once the extension points are implemented — see the refactor plan's Phase 10.)*

---

## 9. Internationalization rules

Every user-visible string uses `@wordpress/i18n`, with `purecart` as the one text domain (matches `Text Domain: purecart` in `purecart.php` and `readme.txt`):

```tsx
import { __ } from '@wordpress/i18n';

<Button>{ __( 'Save settings', 'purecart' ) }</Button>
```

Use `_x()` when the same English string needs different translations by context, `_n()` for plurals, `sprintf()` for interpolated strings. Never ship a hardcoded English string in JSX — `<Button>Save settings</Button>` is a bug, not a style preference, because it silently breaks every non-English install.

---

## 10. Routing rules

**`@wordpress/route` was evaluated and rejected — use `react-router-dom` for everything routing-related.** This is not a stopgap pending a future retry; it's a settled decision based on reading the package's actual compiled source, not just its README.

`@wordpress/route@0.21.0`'s public entry point (`node_modules/@wordpress/route/build-types/index.d.ts`) exports only `Link`, `notFound`, `redirect`, `useLinkProps`, `useNavigate`, `useParams`, `useSearch`, `useInvalidate` — all re-exported from `@tanstack/react-router`. Every primitive actually needed to *construct* a router — `createRouter`, `createRootRoute`, `createRoute`, `RouterProvider`, and even `Outlet` (needed just to render whichever route matched) — is locked inside `privateApis`, gated by `@wordpress/private-apis`'s consumer allowlist (see `node_modules/@wordpress/route/build/private-apis.cjs`). There is no supported way for a third-party plugin to stand up a working `@wordpress/route` router at all, not just a harder-than-expected boot step. And its public hooks aren't usable against a substitute router either: `useNavigate`/`useParams`/`useSearch` are TanStack Router hooks — they require a TanStack `RouterProvider` context, which cannot be constructed without the same locked primitives, so they can't be pointed at `react-router-dom`'s `HashRouter` as a fallback. The two routers' contexts are unrelated; "use the public hooks against a different provider" was never actually an option once you read past the README.

So: `app/router/AppRouter.tsx` uses `react-router-dom`'s `HashRouter` (unchanged from before this refactor — the app already had this right), and module code uses `react-router-dom`'s own `Link`/`useNavigate`/`useParams`, not `@wordpress/route`'s. `@wordpress/route` is not installed in this project. Keep route composition (path definitions, the route tree) under `app/router/`; module components consume routing, they don't define global routes.

**Do not use `@wordpress/private-apis` directly anywhere in this codebase** to try to make `@wordpress/route` (or any other private-API-gated package) work. If a package's functionality you need is behind `@wordpress/private-apis`, treat it the same way this section treats `@wordpress/route`: not usable here, full stop — bring it back to a human for a decision, don't work around the gate.

---

## 11. State management rules

`app/store/store.ts` is composition only — it imports each module's reducer and combines them:
```ts
import { subscriptionsReducer } from '@/modules/subscriptions';
import { updatesReducer } from '@/modules/updates';

export const store = configureStore( {
	reducer: { subscriptions: subscriptionsReducer, updates: updatesReducer },
} );
```

Module-specific state lives in that module's `store/<name>.slice.ts`. Not everything needs to be in Redux:

```
local UI state (is a modal open, which tab is active)  → component useState
module-wide state (the subscriptions list, filters)    → module's Redux slice
truly cross-module state                                → app/store composition
```

Read from the store through named selectors in `store/<name>.selectors.ts`, not inline `useAppSelector((s) => s.subscriptions.items.find(...))` lambdas repeated across components — write the selector once, name it for what it returns (`selectSubscriptionById`), and reuse it.

---

## 12. Hooks rules

React hooks are named `use*` and live either in `modules/<name>/hooks/` (module-specific) or `shared/hooks/` (only if genuinely reusable across modules — this folder starts empty and stays empty until a real cross-module need appears, not preemptively).

Don't confuse a React hook (`useSubscriptions()`) with a WordPress extension hook (`addFilter(...)`) — they solve unrelated problems and the word "hook" means something different in each context; be explicit about which one you mean in comments/docs.

A custom hook has one clear responsibility — but length alone doesn't mean it's missing one. `useSubscriptionActions` (`modules/subscriptions/hooks/`) was inspected as part of this refactor as a candidate to split by action group (lifecycle, retention, plan changes). It wasn't split, on inspection: nearly all of its ~700 lines are one function, `rowActions(row)`, and every branch in it shares the same closure — `dispatch`, `showToast`, `openDialog`, `closeDialog`, `updateRow`, and the modal-open setters. Splitting by action group would mean either threading all of that shared state through multiple hooks as parameters (more coupling, not less) or genuinely redesigning the state ownership — the redesign this refactor's phases were explicit about not doing along the way. The one piece that *was* cleanly separable on inspection — the `typeSpecific` switch building per-linked-entity-type actions (~110 lines, a pure function of `row` and the four callbacks, no direct `dispatch` calls) — was deliberately left in place too, because extracting just that piece would only cut the line count without reducing the real complexity (the 350-line `universal` block), at the cost of splitting one action menu's definition across two files a reader now has to cross-reference. Its actual single responsibility is "build and wire every mutation action for one subscription row" — genuinely one job, even at this length. This is the concrete worked example for the component-rule principle in §3: don't split code that has one real responsibility just to hit a line-count target.

If you're looking at this hook to decide whether to split it further: don't default to yes because of its length. Split it if you're adding a second, unrelated responsibility to it (e.g. it starts also owning list-level bulk-selection state) — not to make the number smaller.

---

## 13. TypeScript rules

`tsconfig.json` already has `strict: true`, `noUnusedLocals`, `noUnusedParameters` — don't weaken these. `any` is discouraged; prefer `unknown` and narrow it. Existing `any` usage in the codebase predates this refactor (19 instances found during the audit that produced this document) — that's pre-existing debt to clean up opportunistically when touching those files, not license to add more. Avoid `value as Something` casts where a real type guard or validation is possible. Give exported/public functions explicit return types where it makes the API clearer at the call site.

---

## 14. Naming rules

```
Component:    SubscriptionsTable.tsx
Page:         SubscriptionsPage.tsx
Hook:         useSubscriptionActions.tsx
API module:   subscriptions.api.ts
Redux slice:  subscriptions.slice.ts
Selectors:    subscriptions.selectors.ts
Types:        subscription.types.ts  (or types.ts inside a module — either is fine, be consistent within a module)
Utilities:    subscription-mappers.ts, subscription-metrics.ts
```

Avoid vague names — `helper.ts`, `misc.ts`, `stuff.ts`, `manager.ts`, `utils2.ts` — unless the file has one clearly defined, nameable responsibility that just happens to be small.

---

## 15. Import rules

Use the configured path aliases rather than deep relative chains:
```ts
import { SubscriptionsPage } from '@/modules/subscriptions';
import { Button } from '@/shared/ui';
```
not
```ts
import { SubscriptionsPage } from '../../../../modules/subscriptions';
```

Prevent circular imports — if `modules/A` and `modules/B` need each other's types, that's a sign shared logic belongs in `shared/` or one genuinely depends on the other (and the dependency direction in §1 should reflect that, not a cycle). Be careful with barrel (`index.ts`) files specifically — a barrel that re-exports something which, transitively, imports back from the barrel is a circular dependency hiding behind a convenience export. Don't add a barrel export if it would create one.

---

## 16. UI rules

Design-system primitives live in `shared/ui/`, one folder per primitive, and must not know about any module's domain, API, or Redux state (§5). Design tokens (the Material 3 `M3` object) live in `theme/tokens.ts` — reference `M3.primary` etc. from there, don't hardcode a hex value or duplicate the token object inline in a component.

---

## 17. Error handling rules

Errors are not silently swallowed. `shared/api/client.ts` normalizes REST errors into one typed shape so components aren't each writing their own incompatible `catch` parsing. The root `app/ErrorBoundary.tsx` catches render-time errors that escape everything else — keep it in place; don't remove or bypass it. Where a module needs its own loading/empty/error UI, use (or add, if missing) a shared `shared/ui/` primitive for it rather than writing bespoke markup per page.

---

## 18. Code-quality rules

Do not:
- duplicate business logic across modules
- build god components, god hooks, or god services
- write giant multi-purpose utility files
- call the API directly from inside a presentational component instead of through a module's `api/`
- add global (Redux) state for something that's actually local UI state
- add an abstraction (interface, factory, generic wrapper) with no second use case
- leave dead code or unused imports — an actual bug found in this codebase during the audit: `modules/subscriptions/components/SubscriptionAnalyticsPage.tsx` was a 142-line dead duplicate of the real, wired `modules/analytics/components/SubscriptionAnalyticsPage.tsx`, never imported by anything. It was deleted as part of this refactor; don't reintroduce copies like it.
- leave `console.log()` debugging statements in committed code
- bypass a TypeScript or lint error to unblock a commit instead of fixing it
- use a private/unstable WordPress API when a supported public one exists — the one documented, deliberate exception is §10, and it's documented precisely so it doesn't set a precedent for casual private-API use elsewhere

---

## 19. Documentation rules

Use JSDoc where it adds information a reader wouldn't already have from the code — a non-obvious constraint, why a workaround exists, what an extension hook's contract is. Don't write a comment that just restates the function name in English:
```ts
// Get subscriptions
getSubscriptions();          // ← don't do this, adds nothing
```
A comment earns its place by explaining *why*, not *what*.

---

## 20. New-module / new-feature checklist

Before building something new under `modules/`, answer:

1. What is this module's responsibility?
2. Does it need its own API calls?
3. Does it need module-level (Redux) state, or can it stay local component state?
4. What components does it actually need?
5. What logic belongs in a hook vs. inline in a component?
6. What types does it need, and do any already exist elsewhere that should be reused?
7. Does anything here need a `purecart/dashboard/...` extension hook?
8. Are all user-facing strings wrapped in `__()`?
9. Is there anything here that's genuinely reusable across modules (→ `shared/`) versus specific to this one?
10. What's the minimal folder set this module actually needs right now — not what it might need eventually?

Only create the subfolders the answers actually require.

---

## 21. Definition of done

A change to `src/` isn't done until:

- `npx tsc --noEmit` passes.
- `npm run lint:js` and `npm run lint:css` pass.
- `npm run build` succeeds.
- No broken imports, no new circular dependency.
- No component over 500 lines without a documented reason.
- One component per file is maintained.
- New/changed user-facing strings use `@wordpress/i18n`.
- New REST calls go through `@wordpress/api-fetch` / `shared/api/client.ts`, not a new hand-rolled fetch wrapper.
- Module boundaries are respected — nothing outside a module reaches past its `index.ts`.
- No duplicated logic was introduced where reuse was possible.
- Loading/error states are handled for anything that fetches data.
- Existing behavior wasn't unintentionally changed.

*(There is no automated test suite for this app yet — "relevant tests pass" applies only if tests exist for the code you touched. If you're the one adding the first test runner, update this section.)*

---

## AI Coding Agent Rules

Before generating or modifying code under `src/`, an AI agent must:

1. Read this file.
2. Inspect the relevant module and its neighbors before writing anything.
3. Follow the conventions already established here and in nearby code.
4. Prefer an existing pattern over inventing a new one that solves the same problem differently.
5. Preserve module boundaries (§4, §15).
6. Preserve existing behavior unless the task explicitly asks for a behavior change.
7. Avoid unrelated refactors bundled into an unrelated task — fix the thing that was asked for; note other problems found rather than silently also fixing them, unless asked to.
8. Never bypass a TypeScript, lint, or build failure to mark a task "done."
9. Update this file when an architectural convention actually changes — don't let it drift out of sync with the code.

**Priority when instructions conflict:**
```
Explicit task instructions from the user
        ↓
DEVELOPMENT_GUIDELINES.md (this file)
        ↓
Existing conventions in nearby code
        ↓
General best-practice default
```

After a significant architectural change, check whether this file needs updating as part of that same change — not as a followup.
