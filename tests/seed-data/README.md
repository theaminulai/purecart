# PureCart test data (DB seed fixtures)

Sample rows for the 5 completed backend modules — Licensing, Secure
Downloads, Plugin Updates, Subscriptions, SaaS Provisioning — so each can be
exercised manually in the admin SPA / REST API / My Account without placing
real WooCommerce orders first.

This is fixture *data*, not a PHPUnit suite: there's no `phpunit.xml` or WP
test bootstrap in this repo yet, so these are plain scripts that insert rows
via `$wpdb` when run inside a real WordPress request (WP-CLI's `eval-file`).

---

## Run it

**From the plugin root (no WP-CLI required):**

```bash
composer test:demo
```

**Or with WP-CLI from the WordPress root:**

```bash
wp eval-file wp-content/plugins/woo-digital-downloads/tests/seed-data/seed.php
```

---

## Clean up

```bash
composer test:remove
```

Removes every row this script created — identified by recognisable markers
(`TEST1-…` license keys, `TEST2DL-…` download tokens, `sub_test_…` /
`sub_demo_…` gateway IDs, `test_sk_…` API keys, `TEST-PLACEHOLDER-…` file
paths) — plus the five demo WP users and the demo WooCommerce product.
Never a blanket `TRUNCATE`; real data in these tables is left alone.

---

## Before you run it (technical seed only)

`seed.php` seeds the **technical module scenarios** using hardcoded constants
for user IDs and product IDs. Open `seed.php` and point
`PURECART_SEED_PRODUCT_*` / `PURECART_SEED_USER_*` at WooCommerce products
and WP users that **already exist** on your test site before running.

The **demo subscriptions** seed (`demo-subscriptions.php`) is the exception —
it creates its own WP users and WooCommerce product automatically, so no
manual setup is needed for the My Account tab test.

---

## What gets seeded

### Technical scenarios (require pre-existing users + products)

| Module | File | Tables | Scenarios |
|---|---|---|---|
| Licensing | `licensing-seed.php` | `purecart_licenses`, `_license_activations`, `_license_tokens` | healthy single-site, multi-site at activation limit, expired-but-active, revoked, unlimited/lifetime |
| Secure Downloads | `downloads-seed.php` | `purecart_downloads`, `_download_logs` | unused token, exhausted (`max_downloads`), expired-unused, partially-used with access logs |
| Plugin Updates | `updates-seed.php` | `purecart_product_versions` | stable history, withdrawn release, rollback-reactivated (`is_rollback=1`), the `1.9.0` vs `1.10.0` string-sort trap, beta-channel release |
| Subscriptions | `subscriptions-seed.php` | `purecart_subscriptions`, `_items`, `_linked_entities`, `_logs`, `_payments`, `_revenue`, `purecart_revenue_goals` | trialing, active (2 renewals), past_due (mid-dunning), customer-paused, cancelled + one revenue goal |
| SaaS Provisioning | `saas-seed.php` | `purecart_saas_accounts`, `_saas_tokens` | active with live JWT tokens, suspended (non-payment), cancelled |

### Demo subscriptions (self-contained — no pre-existing data needed)

| File | Creates | Tables / entities |
|---|---|---|
| `demo-subscriptions.php` | 5 WP users + 1 WooCommerce product + 5 subscriptions + 2 product versions + 1 WC order + 1 license + 1 SaaS account | subscriptions (7 tables), `purecart_product_versions`, `purecart_licenses`, `purecart_saas_accounts` |

The five demo users cover every subscription lifecycle status. `demo_alice`
also has a license, a SaaS API key, and a completed WC order, so all four My
Account tabs show real data when you log in as her:

| Login | Password | My Licenses | Software Updates | API Keys | My Subscriptions |
|---|---|---|---|---|---|
| `demo_alice` | `demo1234` | ✓ Active license | ✓ v1.0.0 + v1.1.0 | ✓ Pro API key | Active (Pause / Skip / Cancel) |
| `demo_bob` | `demo1234` | — | — | — | Past Due ("Update Payment") |
| `demo_carol` | `demo1234` | — | — | — | Paused (resumes in 20 days) |
| `demo_dave` | `demo1234` | — | — | — | Cancelled (Resubscribe) |
| `demo_erin` | `demo1234` | — | — | — | Trial (Cancel Trial) |

**Start here:** log in as `demo_alice` / `demo1234` to test all four tabs at once.

**My Account tab URLs:**
- My Licenses: `/my-account/purecart-licenses/`
- Software Updates: `/my-account/purecart-updates/`
- API Keys: `/my-account/purecart-api-keys/`
- My Subscriptions: `/my-account/purecart-subscriptions/`

> **First run only:** after seeding, go to **WP Admin → Settings → Permalinks
> → Save Changes** once to flush rewrite rules so the tab URL resolves.

---

## Re-running

Safe to run as many times as you like. Every insert is preceded by a delete
keyed on the same marker — a second run replaces the same rows rather than
duplicating them. Demo users and the demo product are also re-used if they
already exist.

---

## Teardown markers

| Marker | Covers |
|---|---|
| `TEST1-%` license keys | Licensing rows (technical) |
| `DEMO1-%` license keys | Licensing rows (demo — demo_alice) |
| `TEST2DL-%` download tokens | Secure Downloads rows |
| `sub_test_%` gateway IDs | Subscriptions (technical) rows |
| `rev_test_%` revenue transaction IDs | Subscription revenue (technical) rows |
| `sub_demo_%` gateway IDs | Subscriptions (demo) rows |
| `rev_demo_%` revenue transaction IDs | Subscription revenue (demo) rows |
| `test_sk_%` API keys | SaaS rows (technical) |
| `demo_sk_%` API keys | SaaS rows (demo — demo_alice) |
| `TEST-PLACEHOLDER-%` file paths | Plugin Updates rows (technical) |
| `DEMO-PLACEHOLDER-%` file paths | Plugin Updates rows (demo) |
| `_purecart_demo_order` order meta | Demo WC order for demo_alice |
| `_purecart_demo_sub_product` post meta | Demo WooCommerce product |
| `demo_%` user logins | Demo WP users |

---

## What this does *not* cover

- **Real file downloads** for the Updates module — `updates-seed.php` writes
  `file_path` pointing at a placeholder that does not exist on disk. For an
  actual signed-URL download test, follow `docs/UPDATES-QA-BN.md`, which
  ships real sample ZIPs.
- **WooCommerce orders, products, or users** for the *technical* scenarios —
  create those first or point the constants at ones you already have.
  (The demo subscriptions seed is the one exception and handles this itself.)
- **Action Scheduler jobs** (renewal, dunning, notification batches) — those
  fire real events and hooks, not just rows, so they are out of scope for
  static fixture data.
