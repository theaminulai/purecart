---
name: new-module
description: Step-by-step guide for adding a new feature module to PureCart. Covers both the PHP backend (Module.php, Store, REST API) and the React/TypeScript SPA frontend (folder structure, stub or full implementation).
argument-hint: <module-name>
---

# New PureCart Module: $ARGUMENTS

Follow these steps in order. Do not create empty folders — only add what the current step requires.

---

## Step 1 — Understand the scope

Before writing any code, answer:
1. What is this module's single responsibility?
2. Does it need its own DB table(s)?
3. Does it need its own REST endpoint(s)?
4. Is there an existing module in `includes/` it needs to hook into (e.g. `Commerce/OrderHandler.php` for post-purchase delivery)?
5. Does the React SPA need a new page, or does it enrich an existing one?
6. Is this a stub (page placeholder only) or a full implementation?

---

## Step 2 — PHP: Module bootstrap

Create `includes/$ARGUMENTS/Module.php`:

```php
<?php
declare( strict_types=1 );

namespace PureCart\$ARGUMENTS;

class Module {
    public function init(): void {
        // instantiate and wire classes here
    }
}
```

Register it in `includes/Plugin.php` — find where other modules call `->init()` and follow the same pattern.

---

## Step 3 — PHP: DB table (only if needed)

Create `includes/Store/$ARGUMENTS.php` extending `PureCartStore`. Implement `schema()` for `dbDelta()`.

Add the `create()` call to `includes/Activator.php` — find where other store tables are created.

Check `includes/Settings/OptionKeys.php` before adding any option key; add new keys there as constants.

---

## Step 4 — PHP: REST controller (only if needed)

Create `includes/API/$ARGUMENTS.php` extending `PureCartApi`. Implement `register_routes()`.

Every route must:
- Use `PURECART_API_NAMESPACE` as the namespace prefix
- Include a `permission_callback` with `current_user_can()`
- Validate and sanitize all input before use
- Use `$wpdb->prepare()` for any raw queries

Register it in `includes/$ARGUMENTS/Module.php` via `new \PureCart\API\$ARGUMENTS()`.

---

## Step 5 — React: Folder structure

For a **stub** (no backend yet):
```
src/app/modules/<module-name>/
├── components/<ModuleName>Page.tsx
└── index.ts
```

For a **full implementation**, add only what you actually need now:
```
src/app/modules/<module-name>/
├── api/           REST calls for this module
├── components/    UI — one component per file, max 500 lines
├── hooks/         module-specific React hooks
├── store/         Redux slice + selectors (only if module-level state is needed)
├── types/         domain types
└── index.ts       public API — export only what other modules/app may use
```

Reference `src/app/modules/subscriptions/` as a complete example.

---

## Step 6 — React: Wire into the SPA

1. Add a route in `src/app/router/AppRoutes.tsx` — match the pattern of existing routes.
2. Export the page component from the module's `index.ts`.
3. If the module needs global state, add its reducer to `src/app/store/store.ts`.
4. The Admin page is already registered in `includes/Admin/Admin.php` — add the new page ID there if a new menu entry is needed.

---

## Step 7 — Checklist before marking done

- [ ] `declare(strict_types=1)` in every new PHP file
- [ ] All user-facing strings use `__( 'text', 'purecart' )`
- [ ] REST routes have `permission_callback` and input sanitization
- [ ] DB queries use `$wpdb->prepare()`
- [ ] `npx tsc --noEmit` passes
- [ ] `npm run lint:js` and `npm run lint:css` pass
- [ ] `npm run build` succeeds
- [ ] `composer cs` passes with zero errors
- [ ] No cross-module imports bypass `index.ts`
- [ ] No empty placeholder folders committed
