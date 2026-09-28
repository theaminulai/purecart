# PureCart — Agent Instructions

PureCart is a WooCommerce plugin providing digital product delivery: file downloads, license keys, SaaS provisioning, plugin auto-updates, and subscription lifecycle management. Three custom WC product types: `purecart_plugin`, `purecart_saas`, `purecart_bundle`.

**Requirements:** PHP 8.1+, WordPress 6.0+, WooCommerce 9.8+

---

## Commands

### PHP

```bash
composer install       # install dev dependencies (no production deps)
composer cs            # WPCS 3.3 — must pass before any PHP commit
composer cs-fix        # auto-fix violations
composer analyze       # PHPStan static analysis
composer lint          # phplint
composer format        # mago formatter
composer test          # PHPUnit + seed-data scripts (no unit tests written yet)
```

### JavaScript / TypeScript

```bash
npm install
npm run start          # watch mode (wp-scripts dev)
npm run build          # production build → build/
npm run lint:js        # ESLint
npm run lint:css       # Stylelint
npm run lint:fix       # auto-fix
npx tsc --noEmit       # type-check without emitting
npm run plugin-zip     # distributable ZIP
```

**Done — PHP:** `composer cs` with zero errors.  
**Done — src/:** `npx tsc --noEmit` + `npm run lint:js` + `npm run lint:css` + `npm run build` all pass.

---

## Key entry points

| File / path | Purpose |
|---|---|
| `purecart.php` | Plugin header, constants (`PURECART_*`), bootstrap |
| `includes/Plugin.php` | Singleton — wires all modules on `plugins_loaded` |
| `includes/Activator.php` | DB schema (`dbDelta`), Action Scheduler jobs, migrations |
| `includes/Admin/Admin.php` | 11 WP admin menu pages, React SPA enqueue |
| `includes/API/PureCartApi.php` | Abstract REST controller base — extend for new endpoints |
| `includes/Settings/OptionKeys.php` | All option key constants — check before adding any option |
| `includes/Store/` | DB layer — one class per custom table; base: `PureCartStore` |
| `src/app/main.tsx` | React SPA entry point |
| `src/DEVELOPMENT_GUIDELINES.md` | SPA engineering contract — **read before touching `src/`** |

---

## Non-lintable rules (critical — enforced by code review, not tools)

- **Action Scheduler only** — never raw `wp_cron`
- **Stream files through PHP** — never expose direct download URLs
- **WooCommerce HPOS** — `wc_get_order()` only; never query `wp_posts` for orders
- **No production Composer deps** — the plugin ships without a vendor bundle
- **`@wordpress/route` is explicitly rejected** — use `react-router-dom` (see §10 of `src/DEVELOPMENT_GUIDELINES.md` for why)
- **Module boundaries** — only import from `modules/X/index.ts`; never import from internal paths like `modules/X/components/Foo`
- **Stub modules** (`licenses`, `downloads`, `saas-accounts`, `security`, `affiliates`, `abandoned-cart`, `overview`) have page components only — add Redux state or API calls only when a matching PHP REST controller exists

---

## Commit format

[Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): short summary in present tense
```

Types: `feat` `fix` `refactor` `docs` `chore` `test` `style`  
Scopes: `licensing` `downloads` `saas` `api` `admin` `commerce` `dashboard` `build` `subscriptions` `updates`

---

## Branch naming

`fix/<desc>` | `feature/<desc>` | `refactor/<desc>` | `docs/<desc>` | `chore/<desc>`

---

## Pull requests

Description headers: **What / Why / How / Testing** — one logical change per PR.
