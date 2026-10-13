# PureCart vs Easy Digital Downloads — Gap Analysis & Implementation Plan

**Audit basis:** `wp-content/plugins/easy-digital-downloads` (EDD 3.6.x, `src/` + `includes/`) compared against `woo-digital-downloads/includes/` (October 2026)
**Branch convention:** one branch per feature, cut from `development`
**Done criteria (PHP):** `composer cs` zero errors
**Done criteria (src/):** `npx tsc --noEmit` + `npm run lint:js` + `npm run lint:css` + `npm run build`

---

## 0. Scope: what to compare and what to skip

EDD is a full commerce platform. PureCart is a WooCommerce extension. Anything WooCommerce already handles is **out of scope**. PureCart should integrate with it, not rebuild it.

| EDD area | Owner in a WooCommerce store | Action |
|---|---|---|
| Cart, checkout, checkout blocks, cart preview, sessions | WooCommerce | Skip |
| Gateways (Stripe, PayPal, Square, Store Gateway) | WC Stripe / WC PayPal Payments | Skip, but **react to their dispute/refund events** (see G6) |
| Orders, refunds, order numbers, taxes, discounts | WooCommerce | Skip |
| Customers, addresses, multiple customer emails | WooCommerce | Skip |
| Sales/earnings/gateway/tax reports | WooCommerce Analytics | Skip, except **digital-specific** reports (G12) |
| Order receipt / new-user / refund emails | WooCommerce emails | Skip, but **add PureCart download links to WC emails** (G4) |
| Structured data, product variations, product reviews | WooCommerce | Skip |
| Telemetry, promos, extension store, Pass manager | EDD business model | Skip |

**What's left is EDD's real value for PureCart:** file delivery, download access control, download logging and retention, customer access UX, and store operations tooling.

---

## 1. Key finding: the Downloads module can't deliver files yet

The Licensing, Updates, Subscriptions, and SaaS modules are mature. **The Secure Downloads module is not production-ready.** Code inspection shows:

| # | Finding | Evidence |
|---|---|---|
| F1 | **Merchants can't attach a file to a product.** Nothing in `includes/` or `src/` writes `_purecart_primary_file_id` or `_purecart_file_path`. Those keys are only read. | `TokenManager::create_token()` line 35, `DownloadDispatcher::handle_download()` line 128 |
| F2 | **Only one file per product.** No multiple files, no per-variation files, and bundles don't deliver their child products' files. | `_purecart_primary_file_id` (single int) |
| F3 | **Refunds and cancellations don't revoke download tokens.** `suspend_by_order()` suspends licenses and SaaS accounts but never touches `purecart_downloads`. Nothing listens to `purecart_order_suspended`. | `OrderHandler.php` lines 269–297 |
| F4 | **No re-check at download time.** `validate_token()` checks only status, expiry, and count. It doesn't check order status, license status, or ownership. EDD re-checks with `edd_order_grants_access_to_download_files()`. | `TokenManager.php` lines 87–131 |
| F5 | **Tokens are issued twice** when delivery status is `both` (processing → completed). There's no idempotency guard like the one on licenses. | `OrderHandler.php` line 102 |
| F6 | **Guest buyers can't get their files.** Tokens are only shown in My Account (via `AccountDownloadsMerger`) and the email templates never include the link. Guests (`user_id = 0`) get nothing. | `AccountDownloadsMerger::merge()` returns early when `$customer_id <= 0`. No template references `purecart/{token}`. |
| F7 | **The protected folder isn't hardened.** `purecart-protected/` is created without `.htaccess`, `index.php`, or a random filename prefix. The Updates module already does all of this in `UpdatePackageManager`. | `API/Downloads.php` line 273 vs `UpdatePackageManager.php` lines 97–130 |
| F8 | **Unlimited downloads show as "0 remaining".** When `max_downloads = 0`, `downloads_remaining` evaluates to `0`, so WooCommerce's Downloads table shows 0. | `AccountDownloadsMerger.php` line 93 |
| F9 | **Only one delivery method, and it's fragile.** Plain `readfile()`, no `X-Sendfile`/`X-Accel-Redirect`, no HTTP Range (no resumable downloads), and the filename isn't RFC 5987-encoded. The count is incremented before streaming, so a failed transfer still uses up an attempt. | `DownloadDispatcher::stream_file()` |
| F10 | **No retention or GDPR handling for download logs.** IPs and user agents are stored forever, and there's no privacy exporter or eraser. | No `wp_privacy_personal_data_*` hooks found |
| F11 | **No `wc_get_logger()` calls anywhere in `includes/`**, despite `plugin-guideline.md` §19.3 requiring them. | grep result |

F1–F7 should be fixed before any new EDD-parity features are added.

---

## 2. Gap summary vs EDD

| # | Gap | EDD reference | Priority |
|---|---|---|---|
| G1 | File management: multiple files per product, per-variation files, bundle delivery, admin UI | `src/Admin/Downloads/Editor/Files.php`, `VariablePrices.php` | **P0** |
| G2 | Revoke on refund/cancel and re-check access at download time | `edd_order_grants_access_to_download_files()` in `includes/process-download.php` | **P0 (security)** |
| G3 | Protected storage hardening and a path allow-list | `edd_local_file_location_is_allowed()`, `edd_is_local_file()` | **P0 (security)** |
| G4 | Download links in WooCommerce emails and on the thank-you page, plus guest access | EDD receipt + `[edd_receipt]` | **P0** |
| G5 | Delivery engine: direct/redirect methods, X-Sendfile/X-Accel/X-LiteSpeed, symlink, chunked + Range, remote/cloud URLs | `edd_deliver_download()`, `edd_readfile_chunked()`, `edd_symlink_file_downloads()`, `edd_check_file_url_head()` | P1 |
| G6 | Disputes/chargebacks/early-fraud warnings: auto-revoke | `Gateways/Stripe/Webhooks/Events/ChargeDisputeCreated.php`, `RadarEarlyFraudWarningCreated.php` | P1 |
| G7 | Access settings: require login to download, per-product limit/expiry overrides, "disable re-download", login redirect | Settings `require_login_to_download`, `file_download_limit`, `download_link_expiration`, `disable_redownload`; `edd_redirect_file_download_after_login()` | P1 |
| G8 | Passwordless login link for customers | `src/Users/LoginLink/*`, `Emails/Types/LoginLink.php` | P2 |
| G9 | Log pruning, retention settings, GDPR exporter/eraser | `src/Cron/Components/LogPruning.php`, `REST/Routes/LogPruning.php`, `includes/privacy-functions.php` | P1 |
| G10 | Rate limiting and CAPTCHA (Turnstile / reCAPTCHA) on public endpoints | `src/Utils/Validators/RateLimiter.php`, `src/Captcha/Providers/*` | P2 |
| G11 | Site Health tests | `src/Admin/SiteHealth/*` (14 classes) | P1 |
| G12 | Digital-specific reports: downloads by product/customer/order, top 5 most downloaded, per-product stats metabox | `Reports/Endpoints/Tiles/FileDownloads*.php`, `Tables/TopFiveMostDownloaded.php`, `Admin/Downloads/Metaboxes/Stats.php` | P2 |
| G13 | Admin weekly/monthly email summary | `src/Cron/Components/EmailSummaries.php`, `Admin/Settings/Tabs/Emails.php` (`email_summary_*`) | P2 |
| G14 | Tools: debug-log viewer, scheduled actions view, log storage calculator, "Labs" toggles | `src/Admin/Tools/*` | P2 |
| G15 | Onboarding wizard | `src/Admin/Onboarding/*` (11 classes) | P3 |
| G16 | Shortcodes and blocks for non-My-Account pages: download history, purchase history, login | `includes/shortcodes.php` (`download_history`, `purchase_history`, `edd_login`, `edd_receipt`) | P3 |
| G17 | Downloads WP-CLI commands | `includes/class-edd-cli.php` | P3 |
| G18 | "Service" products (no file, no "no files found" message) | `src/Downloads/Services.php` | P3 |

---

## Phase 0 — Make the Downloads module work (P0)

### G1 — File management (multiple files, variations, bundles)

**Design decision: build on WooCommerce's native downloadable files.** Don't keep a parallel meta store.

WooCommerce already stores files per product and per variation in `_downloadable_files` (`WC_Product_Download` objects with `id`, `name`, `file`). It also has an approved-directories allow-list (WC 6.4+), a file picker UI, and per-variation inheritance. EDD's `Files.php` editor is the same concept. In a WooCommerce store, the native one is what merchants already know.

PureCart's job is to **wrap delivery** of those files with signed, revocable, logged tokens.

**New table column** (`Activator.php`, migrate via `dbDelta`):
```sql
ALTER TABLE {prefix}purecart_downloads
  MODIFY file_id   VARCHAR(64) NOT NULL,      -- WC download id (md5 key), was BIGINT
  ADD    order_item_id BIGINT UNSIGNED NOT NULL DEFAULT 0 AFTER order_id,
  ADD    variation_id  BIGINT UNSIGNED NOT NULL DEFAULT 0 AFTER product_id,
  ADD    file_name     VARCHAR(255) NOT NULL DEFAULT '' AFTER file_id,
  ADD    UNIQUE KEY uniq_item_file (order_item_id, file_id);
```
The unique key is also the idempotency guard for F5.

**New class `includes/Downloads/EntitlementBuilder.php`**
```php
/**
 * Resolves which files an order item grants, then creates one token per file.
 * Idempotent: INSERT IGNORE on (order_item_id, file_id).
 */
public function grant_for_item( \WC_Order_Item_Product $item, int $order_id ): int;   // returns tokens created
private function files_for_item( \WC_Order_Item_Product $item ): array;                // WC_Product_Download[]
private function bundle_child_files( \WC_Product $bundle ): array;                     // purecart_bundle → children's files
```
- Variation purchase → `$variation->get_downloads()`. WooCommerce already falls back to the parent.
- `purecart_bundle` → union of each child product's files. Child IDs come from the bundle's existing meta (see `BundleProductType.php`).
- Fires `purecart_download_entitlement_granted( $token_id, $order_id, $file_id )`.

**`OrderHandler::on_order_complete()`.** Replace the `create_token()` call (line 103) with `EntitlementBuilder::grant_for_item()`. Apply it to **every product where `$product->is_downloadable()`**, not just `purecart_plugin`/`purecart_bundle`. This puts standard WooCommerce downloadable products under PureCart protection too (an EDD-equivalent default).

**Take over WooCommerce's own delivery:**
- Filter `woocommerce_customer_available_downloads` (already hooked). **Replace** native rows for products PureCart protects instead of appending duplicates. Match on `product_id` + `download_id`.
- Filter `woocommerce_get_item_downloads` (used by WC order emails and the order-details table) so the native `?download_file=` URLs become `purecart/{token}`.
- Setting `purecart_downloads_takeover` (default `true`). Turning it off restores native WooCommerce delivery and PureCart only logs.

**Admin.** No new React editor is needed for files; WooCommerce's product UI handles them. Add a small **"PureCart Protection" panel** in the existing product data tab (`ProductLicenseTab.php` pattern) with the per-product overrides from G7.

**Migration.** For products that already have `_purecart_primary_file_id`, convert that attachment into a `WC_Product_Download` entry once, using an Action Scheduler batch (`purecart_migrate_primary_files`, group `purecart`).

**Remove:** `_purecart_primary_file_id`, `_purecart_file_path` reads in `TokenManager` and `DownloadDispatcher`.

---

### G2 — Revoke on refund/cancel + re-check at download time

**1. Revoke on order state change.** New `includes/Downloads/EntitlementLifecycle.php`:
```php
add_action( 'purecart_order_suspended', [ $this, 'revoke_for_order' ], 10, 2 );   // refunded / cancelled
add_action( 'woocommerce_order_partially_refunded', [ $this, 'revoke_refunded_items' ], 10, 2 );
add_action( 'woocommerce_order_status_completed', [ $this, 'restore_for_order' ] ); // refund reversed
```
- Full refund or cancel: `UPDATE purecart_downloads SET status='revoked' WHERE order_id=%d`.
- Partial refund: revoke only order items whose refunded quantity equals their purchased quantity. Read this from `$order->get_qty_refunded_for_item()`.
- Restore only rows revoked by this lifecycle (`revoke_reason='order_state'`), never rows an admin revoked. **Add a `revoke_reason VARCHAR(32)` column.**

**2. Re-check at download time.** New `includes/Downloads/AccessPolicy.php`, called from `DownloadDispatcher` after `validate_token()`:
```php
/** @return true|\WP_Error  reason codes: order_status, license_inactive, not_owner, login_required */
public function can_download( object $row ): true|\WP_Error {
    $order = wc_get_order( (int) $row->order_id );                         // HPOS-safe
    if ( ! $order || ! in_array( $order->get_status(), $this->allowed_statuses(), true ) ) { ... 'order_status' }
    if ( $this->license_gate_enabled( $row->product_id ) && ! $this->license_active( $row ) ) { ... 'license_inactive' }
    if ( $this->require_login() ) { ownership check → 'login_required' / 'not_owner' }
    return apply_filters( 'purecart_download_has_access', true, $row, $order );
}
```
- `allowed_statuses()`: `completed`, `processing` when delivery status is `processing`/`both`. Filter: `purecart_download_allowed_order_statuses`.
- Every rejection goes through `log_rejected()` with the new reason codes. Extend the `status` ENUM in `purecart_download_logs`: `rejected_order`, `rejected_license`, `rejected_owner`.

**Test.** Buy → download OK → refund in WooCommerce → same link returns 403 and the log shows `rejected_revoked`. Reverse the refund → link works again.

---

### G3 — Protected storage hardening + path allow-list

Extract the hardening already in `UpdatePackageManager` (`.htaccess` deny, `index.php`, 16-char random filename prefix, canonical-path containment check) into a shared helper:

**New `includes/Support/ProtectedStorage.php`**
```php
public static function ensure( string $subdir ): string;           // creates dir + .htaccess + index.php + web.config
public static function is_inside( string $path, string $root ): bool; // realpath containment (moved from UpdatePackageManager::is_inside_storage)
public static function random_name( string $original ): string;
```
- `UpdatePackageManager` and `Downloads` both use it.
- **`DownloadDispatcher` allow-list.** A local path must resolve inside `wp_upload_dir()['basedir']`, a WooCommerce approved download directory (`wc_get_container()->get( Download_Directories::class )->is_valid_path()`), or a filterable list (`purecart_download_allowed_paths`). Otherwise refuse with 403 and log it. This mirrors `edd_local_file_location_is_allowed()`.
- Show the nginx `deny` snippet in Settings → Downloads and in Site Health (G11).

---

### G4 — Links in emails, thank-you page, guest access

- **WooCommerce emails.** The G1 `woocommerce_get_item_downloads` filter rewrites the native "Downloads" table in `customer_completed_order` / `customer_processing_order` automatically. No new email class is needed.
- **Thank-you page.** WooCommerce's `woocommerce_order_details_after_order_table` already renders downloads through the same filter, so guests get links there.
- **Guest token lifetime.** Email links are the only access path for guests, so use a separate setting `purecart_download_guest_expiry_seconds` (default 7 days).
- **"Resend download links" admin action.** Add a WooCommerce order action (`woocommerce_order_actions` → `purecart_resend_downloads`) that regenerates expired tokens for the order and re-sends `customer_completed_order`. Add an order note.
- **Order notes.** Write a WooCommerce order note on grant, revoke, and restore (EDD logs these on the order timeline).

---

### F8 / F9 quick fixes (same branch as G1)

- `AccountDownloadsMerger`: `downloads_remaining` should be `''` when `max_downloads === 0`. That's WooCommerce's convention for "unlimited".
- Filter out `revoked` rows and rows whose order fails `AccessPolicy` before merging.
- Use `file_name` (G1 column) for `download_name` instead of the product title.

---

## Phase 1 — Delivery quality & protection (P1)

### G5 — Delivery engine

New `includes/Downloads/Delivery/` (strategy pattern, one class per method):

| Class | Method | Notes |
|---|---|---|
| `StreamDelivery` | PHP stream (default) | 1 MB chunked `fread` loop (port of `edd_readfile_chunked`), **HTTP Range / 206** for resumable downloads, RFC 5987 `filename*=UTF-8''…`, `set_time_limit(0)`, `ignore_user_abort(true)` |
| `XSendfileDelivery` | Apache `X-Sendfile`, LiteSpeed `X-LiteSpeed-Location` | Detect `mod_xsendfile` / LiteSpeed server and show availability in settings |
| `XAccelDelivery` | nginx `X-Accel-Redirect` | Needs an `internal` location; show the config snippet |
| `SymlinkDelivery` | EDD's symlink trick | Temporary symlink in a random dir, cleaned up by AS job `purecart_cleanup_download_symlinks` |
| `RedirectDelivery` | 302 to the remote URL | For remote `file` URLs (S3 public, Dropbox, CDN). Only allowed when the host is on the allow-list (G3) |

- `DeliveryResolver::for( object $row ): DeliveryInterface`. Global setting `purecart_download_method` plus per-product override `_purecart_download_method`. WooCommerce has a matching `woocommerce_file_download_method` option, so default to that value for consistency.
- **Count on success, not on request.** Increment after headers are sent. For Range requests, count only the request that starts at byte 0.
- Fires `purecart_file_downloaded( $token_id, $ip, $method )` after delivery. This exists in the RND docs but isn't fired today.
- Cloud presigned URLs (S3/R2) stay in the RND Phase 2 backlog (`RND-secure-downloads.md`), behind the same interface.

### G6 — Disputes, chargebacks, fraud warnings

EDD revokes access on `charge.dispute.created` and emails the admin on Radar early-fraud warnings. In WooCommerce, the gateways do the webhook work and set order state, so PureCart only reacts:

- `woocommerce_order_status_on-hold` **when** `$order->get_meta( '_stripe_status_before_hold' )` is set (WC Stripe dispute flow), or a filterable detector `purecart_order_is_disputed`. When matched: revoke tokens (`revoke_reason='dispute'`), suspend licenses, and suspend SaaS accounts through the existing `suspend_by_order()`.
- WC Stripe fires `wc_gateway_stripe_process_webhook_payment_error` and adds a "dispute" order note. Hook `woocommerce_order_note_added` as a fallback and match the note type.
- Setting `purecart_revoke_on_dispute` (default `true`). Admin gets a WooCommerce admin note plus an email.
- When the dispute is won (order back to `completed`), G2 `restore_for_order` re-enables access.

### G7 — Access settings & per-product overrides

**Settings → Downloads** (React `settings` module plus `OptionKeys`):

| OptionKeys constant | Default | EDD equivalent |
|---|---|---|
| `DOWNLOAD_REQUIRE_LOGIN` | `false` | `require_login_to_download` |
| `DOWNLOAD_METHOD` | `woocommerce_file_download_method` value | `download_method` |
| `DOWNLOAD_DISABLE_REDOWNLOAD` | `false` | `disable_redownload` (hide links in My Account after first use) |
| `DOWNLOAD_GUEST_EXPIRY_SECONDS` | `604800` | `download_link_expiration` |
| `DOWNLOAD_LOG_RETENTION_DAYS` | `365` | log pruning (G9) |
| `DOWNLOAD_TAKEOVER` | `true` | — (G1) |

**Per-product overrides** in the "PureCart Protection" panel: `_purecart_download_limit`, `_purecart_download_expiry_days`, `_purecart_download_method`, `_purecart_download_license_gate`. `EntitlementBuilder` reads product meta first, then global settings. WooCommerce's own `_download_limit` / `_download_expiry` are used as the fallback before the global setting, so existing WooCommerce product settings keep working.

**Login redirect.** When `REQUIRE_LOGIN` is on and the visitor is logged out, redirect to `wc_get_page_permalink('myaccount')` with `?purecart_redirect={token-url}`, then send them back after login (port of `edd_redirect_file_download_after_login`). Never put the token itself in a cookie.

### G9 — Log retention & GDPR

- AS recurring job `purecart_prune_download_logs` (daily, group `purecart`). Delete `purecart_download_logs` rows older than `DOWNLOAD_LOG_RETENTION_DAYS`, in batches of 1,000 to avoid long locks.
- Also prune `purecart_downloads` rows that are expired or revoked and older than the retention window.
- **Privacy exporter** (`wp_privacy_personal_data_exporters`): download history by email (product, file, date, IP).
- **Privacy eraser** (`wp_privacy_personal_data_erasers`): anonymise IP and user agent in logs (`'0.0.0.0'`, `''`) and keep counts for reporting. Also covers license activation IPs (`purecart_license_activations.ip_address`).
- Setting "Anonymise IPs after N days" (`DOWNLOAD_IP_ANONYMISE_DAYS`, default 30). EDD doesn't have this, but it's cheap and helps with GDPR.

### G11 — Site Health

New `includes/Admin/SiteHealth.php` hooking `site_status_tests` and `debug_information`:

| Test | Fails when |
|---|---|
| Protected folder not web-accessible | HTTP GET to a probe file in `purecart-protected/` returns 200 (async test) |
| Package folder not web-accessible | Same for `purecart-packages/` |
| Rewrite rules present | `purecart/(token)` and `purecart-update/` rules missing → offer "flush" |
| Action Scheduler healthy | Past-due `purecart` group actions > 50 or failed > 0 in 24 h |
| Custom tables present | Any `purecart_*` table missing or `purecart_db_version` behind |
| JWT / update secrets set | Empty secret options |
| Delivery method available | Selected X-Sendfile/X-Accel/symlink isn't supported on this server |

`debug_information` adds a "PureCart" section (versions, enabled modules, delivery method, table row counts) for support tickets.

### F11 — Logging

- New `includes/Support/Logger.php` (thin wrapper around `wc_get_logger()`, source `purecart`, levels gated by `purecart_debug` option).
- Log: token rejection reasons (debug), delivery failures (error), revoke/restore batches (info), webhook failures in SaaS/Subscriptions (error).
- No logging of tokens, license keys, or API keys (mask all but the last 4 characters).

---

## Phase 2 — Customer UX & operations (P2)

### G8 — Passwordless login link

Port of EDD `Users/LoginLink`. This is valuable for digital stores where customers forget passwords right when they need a re-download.

- `includes/CustomerDashboard/LoginLink/` → `TokenStore` (hashed token in user meta, 15-minute TTL, single use), `Sender` (form handler, rate-limited per email/IP), `Verifier` (`init` handler, `wp_set_auth_cookie()`, redirect to My Account → Downloads).
- `LoginLinkEmail extends \WC_Email` + `templates/emails/login-link.php` + plain version.
- "Email me a login link" button on the WooCommerce login form (`woocommerce_login_form_end`).
- Always respond "If an account exists, we sent a link" (no account enumeration).
- Setting `ACCOUNT_LOGIN_LINK_ENABLED` (default `false`).

### G10 — Rate limiting & CAPTCHA

- Shared `includes/Support/RateLimiter.php` (transient-based; the Security RND already specifies the shape). Apply it to: `purecart/{token}` (per IP), `/license/activate`, `/license/token/refresh` (already limited — migrate to the shared class), login-link send, and SaaS `/saas/token`.
- Optional CAPTCHA provider interface (`Turnstile`, `reCAPTCHA v3`), used on login-link send and the My Account license activation form. Settings: provider, site key, secret key. Off by default.

### G12 — Digital-specific reporting

WooCommerce Analytics covers revenue. PureCart adds what it can't see. New `includes/API/Reports/DownloadReports.php`:

| Endpoint | Data |
|---|---|
| `GET /purecart/v1/reports/downloads/summary?from&to` | total downloads, unique customers, rejection count by reason, avg downloads per order |
| `GET /purecart/v1/reports/downloads/top-files` | top 5/10 files by successful downloads |
| `GET /purecart/v1/reports/downloads/by-product/{id}` | daily series for a product |
| `GET /purecart/v1/reports/downloads/by-customer/{user_id}` | customer download history (admin) |

- **Admin SPA.** Add a "Downloads" tab to the existing `src/app/modules/analytics/` (KPI strip + `AreaChart` + top-files table). Only wire it once these endpoints exist (stub-module rule).
- **Product edit screen.** "PureCart stats" metabox (`add_meta_boxes`, side): units sold (from WooCommerce), downloads, active licenses, update adoption. Port of EDD `Metaboxes/Stats.php`.
- **Customer profile.** On `edit-user` / WooCommerce customer screen, show the download count plus a link to the filtered log.

### G13 — Admin email summary

- `AdminSummaryEmail extends \WC_Email` (admin-facing, disabled by default).
- AS recurring `purecart_send_admin_summary` (weekly Monday 08:00 site time, or monthly).
- Contents: new licenses, activations, downloads, rejected downloads, new and churned subscriptions, MRR delta, update adoption of the latest release, failed AS actions.
- Settings: frequency, recipients (admin email / custom list). Mirrors EDD `email_summary_frequency` / `email_summary_recipient`.

### G14 — Tools screen

React `settings` module, new "Tools" tab (backend: `includes/API/Tools.php`):
- **Logs:** list WooCommerce log files with `source=purecart` (read via `WC_Log_Handler_File` / the WC 8.6+ log API), view, download, delete.
- **Scheduled actions:** link to `admin.php?page=wc-status&tab=action-scheduler&s=purecart` with counts of pending/failed actions.
- **Storage:** table row counts and sizes (`information_schema.TABLES`) for each `purecart_*` table, plus a "Prune now" button (runs G9 immediately).
- **Maintenance:** flush rewrite rules, regenerate the update/JWT secret (with a confirm dialog), re-run the primary-file migration.

---

## Phase 3 — Nice to have (P3)

| Gap | Plan |
|---|---|
| **G15 Onboarding wizard** | React route `#/onboarding` shown once after activation: choose modules → download protection defaults → licensing defaults → create first product (deep link to WC "Add product" with the PureCart type preselected) → done. Store `purecart_onboarding_completed`. |
| **G16 Shortcodes / blocks** | `[purecart_downloads]`, `[purecart_licenses]`, `[purecart_login_link]` reusing the My Account templates. Blocks under `src/blocks/` with server-side render. Only if merchants need these outside My Account. |
| **G17 WP-CLI** | `wp purecart downloads list|revoke|restore|regenerate|prune` in `includes/CLI/DownloadCommands.php` (pattern: `LicenseCommands.php`). |
| **G18 Service products** | WooCommerce virtual non-downloadable products already behave like this. Only action: hide the PureCart "no files" notice for `virtual && !downloadable`. |

---

## 3. Implementation order

| Step | Branch | Covers | Effort |
|---|---|---|---|
| 1 | `fix/downloads-revoke-on-refund` | G2 (lifecycle + AccessPolicy), F5 idempotency | 1.5 d |
| 2 | `fix/downloads-protected-storage` | G3 (`ProtectedStorage`, allow-list) | 1 d |
| 3 | `feature/downloads-wc-native-files` | G1 (EntitlementBuilder, WC takeover, migration), F8 | 3 d |
| 4 | `feature/downloads-email-guest-access` | G4 (email/thank-you links, resend action, order notes) | 1 d |
| 5 | `feature/downloads-delivery-engine` | G5, F9 | 3 d |
| 6 | `feature/downloads-access-settings` | G7 (settings + per-product overrides + login redirect) | 1.5 d |
| 7 | `feature/downloads-dispute-revoke` | G6 | 1 d |
| 8 | `feature/downloads-log-retention-gdpr` | G9 | 1 d |
| 9 | `feature/site-health` | G11 | 1 d |
| 10 | `chore/wc-logger` | F11 | 0.5 d |
| 11 | `feature/login-link` | G8 | 1.5 d |
| 12 | `feature/shared-rate-limiter-captcha` | G10 | 1.5 d |
| 13 | `feature/download-reports` | G12 (API + analytics tab + product metabox) | 2.5 d |
| 14 | `feature/admin-summary-email` | G13 | 1 d |
| 15 | `feature/tools-screen` | G14 | 2 d |
| 16 | P3 items | G15–G18 | as needed |

Steps 1–4 are **release blockers** for advertising Secure Downloads as a working module.

---

## 4. Files touched

### New PHP
```
includes/Downloads/EntitlementBuilder.php
includes/Downloads/EntitlementLifecycle.php
includes/Downloads/AccessPolicy.php
includes/Downloads/Delivery/DeliveryInterface.php
includes/Downloads/Delivery/DeliveryResolver.php
includes/Downloads/Delivery/{Stream,XSendfile,XAccel,Symlink,Redirect}Delivery.php
includes/Downloads/LogPruner.php
includes/Downloads/Privacy.php
includes/Support/ProtectedStorage.php
includes/Support/RateLimiter.php
includes/Support/Logger.php
includes/Admin/SiteHealth.php
includes/CustomerDashboard/LoginLink/{TokenStore,Sender,Verifier}.php
includes/CustomerDashboard/Emails/LoginLinkEmail.php
includes/Admin/Emails/AdminSummaryEmail.php
includes/API/Reports/DownloadReports.php
includes/API/Tools.php
includes/CLI/DownloadCommands.php
```

### Modified PHP
```
includes/Activator.php                    (purecart_downloads columns + unique key, log status ENUM, revoke_reason)
includes/Commerce/OrderHandler.php        (EntitlementBuilder for all downloadable products; dispute hook)
includes/Commerce/ProductLicenseTab.php   (PureCart Protection panel: per-product overrides)
includes/Downloads/Module.php             (register new classes)
includes/Downloads/TokenManager.php       (drop primary-file logic; count-on-success API)
includes/Downloads/DownloadDispatcher.php (AccessPolicy + DeliveryResolver + allow-list)
includes/Downloads/AccountDownloadsMerger.php (replace-not-append, unlimited = '', filter revoked)
includes/Updates/UpdatePackageManager.php (use ProtectedStorage)
includes/Settings/OptionKeys.php          (DOWNLOAD_* and ACCOUNT_LOGIN_LINK_* constants)
includes/API/Downloads.php                (settings fields, prune-now, resend)
```

### Templates
```
templates/emails/login-link.php
templates/emails/plain/login-link.php
templates/emails/admin-summary.php
templates/emails/plain/admin-summary.php
```

### Admin SPA (only once the matching PHP controller exists)
```
src/app/modules/settings/   → Downloads tab fields (G7), Tools tab (G14)
src/app/modules/analytics/  → Downloads reports tab (G12)
src/app/modules/downloads/  → revoke_reason column + new rejection reasons in DownloadStatusBadge
```

---

## 5. Smoke tests

1. **Refund revokes:** buy → download → full refund → link 403, log `rejected_revoked` → reverse refund → link works.
2. **Partial refund:** 2-item order, refund item A → A's links 403, B's still work.
3. **Idempotency:** delivery status `both` → order goes processing → completed → exactly one token per file.
4. **Multi-file + variation:** variable product, variation 1 has 2 files, variation 2 has 1 → each purchase gets only its own files.
5. **Bundle:** bundle of 3 products → tokens for every child file.
6. **Guest:** guest checkout → completed-order email contains `purecart/{token}` links → download works logged out.
7. **Path allow-list:** set a file URL to `../../wp-config.php` → 403 and an error log line.
8. **Protected folder:** direct GET of a file in `purecart-protected/` → 403 (Apache). Site Health shows "should be improved" on nginx without a deny rule.
9. **Range:** `curl -r 0-1023` → `206 Partial Content`, count not incremented. Full GET → count +1.
10. **Dispute:** WC Stripe test dispute → order on-hold → links 403, license suspended.
11. **Retention:** set retention to 1 day, backdate logs → run `purecart_prune_download_logs` → old rows gone.
12. **GDPR:** Tools → Erase Personal Data for the customer email → IPs anonymised, counts kept.
13. **Login link:** request link → email arrives → click → logged in, landed on My Account → Downloads → reused link rejected.

---

## 6. What PureCart already beats EDD on

This is context for positioning, not work:

- **Licensing:** staging/localhost exemption, JWT offline validation with revocation, environment-tagged activations. EDD core has none of these; Software Licensing is a separate paid add-on.
- **Updates:** channels (stable/beta/nightly), per-platform packages, single-use signed package URLs, SHA-256 verification in the client updater, adoption tracking.
- **Subscriptions:** retention flow, churn scoring, skip/pause, renewal sync, split payments, role mapping. EDD Recurring is a paid add-on with fewer of these.
- **SaaS provisioning:** signed webhooks, API keys, JWT. EDD has no equivalent.
