# PureCart test data (DB seed fixtures)

Sample rows for the 5 completed backend modules — Licensing, Secure
Downloads, Plugin Updates, Subscriptions, SaaS Provisioning — so each can be
exercised manually in the admin SPA / REST API / My Account without placing
real WooCommerce orders first.

This is fixture *data*, not a PHPUnit suite: there's no `phpunit.xml` or WP
test bootstrap in this repo yet, so these are plain scripts that insert rows
via `$wpdb` when run inside a real WordPress request (WP-CLI's `eval-file`).

## Run it

```bash
wp eval-file wp-content/plugins/woo-digital-downloads/tests/seed-data/seed.php
```

Run from the WordPress root, against the site you're testing on.

## Before you run it

Open `seed.php` and point the `PURECART_SEED_PRODUCT_*` / `PURECART_SEED_USER_*`
constants at WooCommerce products and WP users that **already exist** on your
test site — this script only writes PureCart's own rows, it never creates
products, users, or orders. `order_id` values are fake numbers (900xx/910xx/
920xx ranges) purely to fill NOT NULL columns; there's no real WooCommerce
order behind them, so anything that joins out to `wp_posts` for order data
(rather than just storing the ID) won't find a matching order.

## What gets seeded

| Module | File | Tables | Scenarios |
|---|---|---|---|
| Licensing | `licensing-seed.php` | `purecart_licenses`, `_license_activations`, `_license_tokens` | healthy single-site, multi-site at its activation limit, expired-but-active, revoked, unlimited/lifetime |
| Secure Downloads | `downloads-seed.php` | `purecart_downloads`, `_download_logs` | unused token, exhausted (hit `max_downloads`), expired-unused, partially-used with access logs |
| Plugin Updates | `updates-seed.php` | `purecart_product_versions` | stable history, a withdrawn (bad) release, a rollback-reactivated version (`is_rollback=1`), the `1.9.0` vs `1.10.0` string-sort trap, a beta-channel release |
| Subscriptions | `subscriptions-seed.php` | `purecart_subscriptions`, `_items`, `_linked_entities`, `_logs`, `_payments`, `_revenue`, `purecart_revenue_goals` | trialing, active (2 renewals), past_due (mid-dunning), customer-paused, cancelled — plus one revenue goal |
| SaaS Provisioning | `saas-seed.php` | `purecart_saas_accounts`, `_saas_tokens` | active with live JWT tokens, suspended (non-payment), cancelled |

`seed.php` calls `PureCart\Activator::maybe_upgrade()` before inserting
anything, so a freshly-added column (e.g. `product_versions.is_rollback`)
exists even if you haven't reactivated the plugin since it landed.

## Re-running

Safe to run as many times as you like. Every insert is preceded by a delete
keyed on the same marker (license key, download token, gateway subscription
ID, SaaS API key, or product+version) — a second run replaces the same rows
rather than duplicating them.

## Cleaning up

There's no automatic teardown. Every value this script writes is
recognizable (`TEST1-...` license keys, `TEST2DL-...` download tokens,
`sub_test_...` gateway IDs, `test_sk_...` API keys, `TEST-PLACEHOLDER-...`
file paths, `90xxx`/`91xxx`/`92xxx` order IDs) — filter on those prefixes if
you need to remove them later.

## What this does *not* cover

- Real file downloads for the Updates module — `updates-seed.php` writes
  `file_path` pointing at a placeholder that doesn't exist on disk. For an
  actual signed-URL download test, follow `docs/UPDATES-QA-BN.md`, which
  ships real sample ZIPs.
- WooCommerce orders, products, or users — create those first (or point the
  constants at ones you already have).
- Action Scheduler jobs (renewal, dunning, notification batches) — those
  fire off real events/hooks, not just rows, so they're out of scope for
  static fixture data.
