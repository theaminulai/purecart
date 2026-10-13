# PureCart vs the `wp-content/plugins` Folder — Gap Analysis & Implementation Plan

**Audit basis:** every plugin installed in `wp-content/plugins` (28 plugins) compared against `woo-digital-downloads/includes/` (October 2026)
**Companion plans (already written — not repeated here):**

| Plan | Covers |
|---|---|
| `docs/subscription-module/SUBSCRIPTION-GAPS-PLAN.md` | YITH WooCommerce Subscription, Subscriptions for WooCommerce (WP Swings) |
| `docs/subscription-module/ARRAYSUBS-GAPS-PLAN.md` | ArraySubs (also covers most of Paid Member Subscriptions' content-restriction features) |
| `docs/subscription-module/LICENSING-JWT-GAPS-PLAN.md` | Software License Manager, License Manager for WooCommerce, Digital License Manager, JWT Auth ×3, CoCart JWT |
| `docs/downloads-module/EDD-GAPS-PLAN.md` | Easy Digital Downloads |

**Done criteria (PHP):** `composer cs` zero errors
**Done criteria (src/):** `npx tsc --noEmit` + `npm run lint:js` + `npm run lint:css` + `npm run build`

---

## 1. Plugin coverage map

| Plugin | Category | Where it's handled |
|---|---|---|
| WooCommerce | Platform | PureCart's base |
| Easy Digital Downloads | Digital commerce | `EDD-GAPS-PLAN.md` |
| YITH WooCommerce Subscription, Subscriptions for WooCommerce | Subscriptions | `SUBSCRIPTION-GAPS-PLAN.md` |
| ArraySubs | Subscriptions + membership | `ARRAYSUBS-GAPS-PLAN.md` |
| SLM, LMFWC, DLM, JWT Auth (3 plugins), CoCart JWT | Licensing / JWT | `LICENSING-JWT-GAPS-PLAN.md` |
| **Milo Subscriptions** | Subscriptions | **This plan** |
| **Recurio** | Subscriptions | **This plan** |
| **Sublium Subscriptions** | Subscriptions | **This plan** |
| **Paid Member Subscriptions** | Membership | **This plan** (remaining items) |
| **Key Manager (wc-key-manager)** | Licensing | **This plan** |
| **Lemon Squeezy** | Merchant-of-record platform | **This plan** (buy-anywhere UX only) |
| **Invizo Cart** | Standalone digital store | **This plan** (little left; mostly WooCommerce territory) |
| **CoCart (cart-rest-api-for-woocommerce)** | Headless API | **This plan** |
| **WP OAuth Server**, **miniOrange REST API Auth** | API auth / SSO | **This plan** |
| **WRC Pricing Tables** | Pricing display | **This plan** |
| **Plugin Check (PCP)** | Developer tool | **This plan** (WP.org readiness) |
| WooCommerce Stripe Gateway | Gateway | **This plan** — PureCart's subscription renewals depend on it |
| Payoneer Checkout, Visa Acceptance Solutions, Better Payment | Gateways / payment forms | Out of scope. WooCommerce owns gateways; renewal support is handled by the adapter layer in A2 |
| Soldx for WooCommerce | ERP product sync | Out of scope (unrelated to digital goods) |

---

## 2. Key finding: subscription payments aren't connected to a gateway

All the subscription plugins in the folder (Milo, Recurio, Sublium, YITH, WP Swings, ArraySubs) put most of their effort into **capturing a reusable payment method at checkout and charging it off-session at renewal**. Reading PureCart's code shows this path is incomplete. The other subscription gaps are secondary until it's fixed.

| # | Finding | Evidence |
|---|---|---|
| F1 | **The payment method is never saved when a subscription is created.** `SubscriptionManager::create_from_order_item()` doesn't set `payment_token_id`. It's only written by the card-update flow (`DunningManager::handle_card_updated()`) and the inbound webhook. So every new subscription's first renewal fails with `no_payment_token`. | `SubscriptionManager.php` lines 182–199; `RenewalEngine.php` line 523 |
| F2 | **Gateways aren't told to save the card.** WC Stripe only vaults a card for off-session use when it detects a subscription (via WooCommerce Subscriptions) or when `wc_stripe_force_save_payment_method` / `wc_stripe_force_save_source` returns true. PureCart hooks neither, so a PureCart subscription checkout doesn't vault the card. | `woocommerce-gateway-stripe/includes/class-wc-stripe-helper.php` line 1826, `abstract-wc-stripe-payment-gateway.php` line 966 |
| F3 | **Renewals call the gateway's checkout function.** `attempt_gateway_charge()` calls `$gateway->process_payment()`. That's the interactive checkout path: it reads `$_POST`, may redirect for 3-D Secure, and doesn't mark the charge as off-session. WC Stripe's real renewal path is `scheduled_subscription_payment()` / `process_subscription_payment()` in `trait-wc-stripe-subscriptions.php`, and it only turns on when WooCommerce Subscriptions is active. | `RenewalEngine.php` lines 522–583 |
| F4 | **Guests can check out with a subscription and get no subscription.** A guest's order just gets an order note. Nothing forces account creation when the cart contains a subscription product. | `SubscriptionManager.php` lines 131–146 |
| F5 | **Subscriptions are only created when the order is `completed`.** Virtual, non-downloadable orders stay in `processing`, so with default WooCommerce settings the subscription is never created. Licenses already honour the `LICENSE_DELIVERY_STATUS` setting; subscriptions don't. | `SubscriptionManager.php` line 79 |
| F6 | **No `uninstall.php`** and no uninstall hook, even though `plugin-guideline.md` §20.3 requires one. | glob / grep |
| F7 | **No customer-scoped REST API.** Every endpoint is either admin-only or license-key/API-key based. A headless storefront or mobile app (CoCart's use case) has no way to list a signed-in customer's licenses, downloads, or API keys. | Route list in `includes/API/*.php` |

---

## 3. Gap summary

| # | Gap | Seen in | Priority |
|---|---|---|---|
| A1 | Capture the payment method at checkout, require an account, create the subscription on the right order status | Milo, Recurio, Sublium, YITH | **P0** |
| A2 | Off-session renewal gateway adapters (Stripe, WooPayments, PayPal Payments, manual invoice) | Milo (Stripe Bridge, Any Gateway), Recurio, Sublium | **P0** |
| A3 | Subscription Health Check (broken tokens, drifted dates, orphaned scheduled actions) | Milo | **P0** |
| A4 | Importers from competing plugins (subscriptions, licenses, downloads) | Milo (WooCommerce Subscriptions migrator), DLM (LMFWC migrator), Key Manager | P1 |
| A5 | Uninstall routine + Plugin Check (PCP) pass in CI | Plugin Check | **P0** (WP.org) |
| B1 | Subscribe & Save on regular products | Recurio Pro, Milo, Sublium | P1 |
| B2 | Compliance: consent proof, one-click cancel link, audit export | Milo Compliance | P1 |
| B3 | Customer-scoped REST API + CORS for headless storefronts and apps | CoCart, miniOrange | P1 |
| B4 | Outbound webhook hub (signed, with retries and delivery log) shared by every module | Milo Webhooks, Key Manager Pro | P1 |
| B5 | Key Manager extras: stock from key pool, reuse keys from refunds, QR code, keys in PDF invoices | Key Manager | P2 |
| B6 | Pricing table block that knows the customer's current plan | WRC Pricing Tables, Milo Pricing Tables | P2 |
| B7 | Cohort retention and revenue forecast analytics | Recurio, Sublium, Milo Advanced Analytics | P2 |
| C1 | Win-back and onboarding email sequences | Milo Winback / Onboarding | P2 |
| C2 | Subscription transfer and gifting | Milo Transfer / Gifting | P3 |
| C3 | Team seats on licenses / subscriptions | Milo Teams | P3 |
| C4 | "Log in with your store account" (OIDC provider) for SaaS products | WP OAuth Server | P3 |
| C5 | Notification channels (Slack, Discord, SMS) on top of B4 | Milo Slack / Discord, Key Manager Twilio | P3 |
| C6 | Embeddable buy button / direct-checkout link block | Lemon Squeezy, Invizo Cart | P3 |

---

## Phase 0 — Make subscription billing work end-to-end (P0)

### A1 — Capture the payment method + account + correct trigger

**1. Require an account when the cart has a subscription.**
`includes/Subscriptions/Checkout/CheckoutRules.php` (new):
```php
add_filter( 'woocommerce_checkout_registration_required', [ $this, 'require_account' ] );
add_filter( 'woocommerce_checkout_registration_enabled',  [ $this, 'require_account' ] );
public function require_account( bool $required ): bool {
    return $required || CartInspector::has_subscription( WC()->cart );
}
```
- The Checkout Block reads the same WooCommerce settings through the Store API, so both checkouts are covered.
- New `CartInspector::has_subscription()` helper, also used by the gateway filters below.

**2. Tell gateways to vault the payment method.**
```php
add_filter( 'wc_stripe_force_save_payment_method', [ $this, 'force_save' ], 10, 2 ); // UPE
add_filter( 'wc_stripe_force_save_source',         [ $this, 'force_save' ], 10, 2 ); // legacy
add_filter( 'wc_stripe_display_save_payment_method_checkbox', [ $this, 'hide_checkbox' ] );
```
- `force_save()` returns true when the cart or order has a subscription, or a `purecart_split_payment` item.
- **Only show gateways that can renew.** Filter `woocommerce_available_payment_gateways`: when the cart has a subscription, remove gateways that don't support tokens (`! $gateway->supports( 'tokenization' )`) unless the manual-renewal adapter (A2) is enabled. Without this, a customer could pay by bank transfer and the subscription would fail silently at renewal.

**3. Store the token on the subscription.**
In `SubscriptionManager`, after creating the subscription:
```php
$token_id = PaymentMethodResolver::from_order( $order );   // new class
```
Resolution order:
1. `$order->get_payment_tokens()` (gateways that call `add_payment_token()`).
2. WC Stripe order meta `_stripe_source_id` / `_payment_method_id` → match a `WC_Payment_Token_CC` for the customer with the same `get_token()`.
3. `WC_Payment_Tokens::get_customer_default_token( $user_id )` for the same gateway.

Also copy the gateway's renewal meta (`_stripe_customer_id`, `_stripe_source_id`, WooPayments `_payment_method_id`, PayPal `payment_token_id`) onto the subscription row. `RenewalEngine` already copies gateway meta onto renewal orders, so this feeds the existing code.

If nothing resolves, keep the subscription `active`, set `payment_method_state = 'missing'` (new column), and send the existing `PaymentReauthorizationEmail` with the card-update magic link.

**4. Trigger on payment, not just `completed`.**
Hook `woocommerce_payment_complete` and `woocommerce_order_status_processing` in addition to `completed`. Creation is already idempotent (`find_by_order_and_product`). Honour the same delivery-status setting as licenses (`LICENSE_DELIVERY_STATUS`), or add a dedicated `SUB_CREATE_ON_STATUS` option.

**DB:** `purecart_subscriptions` add `payment_gateway VARCHAR(64)`, `payment_method_state ENUM('ok','missing','expired','requires_action') DEFAULT 'ok'`, `gateway_customer_id VARCHAR(191)`.

### A2 — Off-session renewal gateway adapters

Replace `attempt_gateway_charge()`'s `process_payment()` call with an adapter interface:

```php
namespace PureCart\Subscriptions\Payment\Gateways;

interface RenewalGateway {
    public function supports( string $gateway_id ): bool;
    /** @return array{success:bool, reason?:string, requires_action?:bool, transaction_id?:string} */
    public function charge( object $subscription, \WC_Order $renewal_order ): array;
}
```

| Adapter | How it charges | Notes |
|---|---|---|
| `StripeRenewal` | Reuses WC Stripe's own class: `WC_Stripe_Payment_Gateway::process_subscription_payment( $amount, $order, false, false )` when available. Otherwise creates a PaymentIntent through `WC_Stripe_API::request()` with `customer`, `payment_method`, `off_session: true`, `confirm: true`. | On `authentication_required`: set `requires_action`, put the order on-hold, send `PaymentReauthorizationEmail` with the order's pay URL. Mirrors WC Stripe's `WC_Stripe_Email_Failed_Renewal_Authentication`. |
| `WooPaymentsRenewal` | WooPayments' `process_payment_for_order( $cart, $payment_information )` with the saved token and `merchant_initiated = true` | Only loaded when `WC_Payments` exists |
| `PayPalPaymentsRenewal` | WooCommerce PayPal Payments vaulted token through its renewal handler | Only loaded when the PayPal Payments plugin is active (installed in task #5) |
| `ManualRenewal` (fallback) | No charge: renewal order stays `pending`, customer gets an invoice email with `$order->get_checkout_payment_url()` | Gives every WooCommerce gateway (Payoneer, Visa, bank transfer…) subscription support, the same way Milo's "Any Gateway" does |

- `GatewayRegistry` picks the adapter by `$subscription->payment_gateway`. Third parties can add more via the filter `purecart_renewal_gateways`.
- Keep the existing `purecart_gateway_manages_schedule` filter for gateways that bill on their own schedule.
- **Remove** the `process_payment()` path, or keep it only as an explicit opt-in adapter (`GenericTokenRenewal`) for gateways known to support it.
- Record the gateway transaction ID on the renewal order (`$order->payment_complete( $transaction_id )`) so WooCommerce refunds work from the order screen.

**Test matrix:** Stripe test card `4242…` (success), `4000 0027 6000 3184` (3-D Secure required → `requires_action` email), `4000 0000 0000 0341` (attaches but declines → dunning). Also WooPayments test mode and PayPal sandbox vault.

### A3 — Subscription Health Check

`includes/Subscriptions/Health/HealthScanner.php`, run daily as the Action Scheduler job `purecart_subscription_health_scan` (group `purecart`):

| Check | Flag |
|---|---|
| Active subscription with no `payment_token_id`, or token deleted from `woocommerce_payment_tokens` | `missing_token` |
| Card expires before `next_payment_at` | `card_expires_before_renewal` |
| `next_payment_at` in the past and no pending AS action for it | `stalled_renewal` |
| Pending AS renewal action for a subscription that's cancelled or expired | `orphaned_action` |
| Gateway plugin for `payment_gateway` inactive | `gateway_unavailable` |
| `status = active` but last renewal order is `failed` beyond the grace period | `status_drift` |

- Store results in `purecart_subscription_health` (`subscription_id`, `issue`, `detected_at`, `resolved_at`).
- **"Fix" actions** where safe: re-schedule a stalled renewal, unschedule orphaned actions, send the card-update link.
- **REST:** `GET /purecart/v1/subscriptions/health`, `POST /purecart/v1/subscriptions/health/{id}/fix`.
- **SPA:** "Health" tab in `src/app/modules/subscriptions/` with a count badge in the sidebar nav.
- Also show it as a Site Health test (shares the Site Health class from `EDD-GAPS-PLAN.md` G11).

### A5 — Uninstall + Plugin Check

- `uninstall.php` → `PureCart\Uninstaller::run()`. It only deletes data when `purecart_delete_data_on_uninstall` is on: drop `purecart_*` tables, delete `purecart_*` options and `_purecart_*` meta, unschedule the `purecart` group, remove `purecart-protected/` and `purecart-packages/` directories.
- Add a "Delete all data on uninstall" toggle under Settings → Advanced (off by default).
- **Plugin Check in CI:** add the GitHub Action step `wp plugin check woo-digital-downloads --format=json --exclude-checks=…` using the PCP plugin already installed locally. Fail the build on errors, allow warnings. Run it once locally now and file the findings as issues.

---

## Phase 1 — Parity features that win switchers (P1)

### A4 — Importers from competing plugins

Most merchants who'd buy PureCart are already on one of the plugins in this folder. A good importer removes the main reason not to switch.

`includes/Migration/` with one source class per plugin, a shared `ImporterInterface` (`detect(): bool`, `count(): int`, `import_batch( int $offset, int $limit, bool $dry_run ): Report`):

| Source | Imports |
|---|---|
| `WooCommerceSubscriptionsSource` | `shop_subscription` → `purecart_subscriptions` (status map, dates, token, gateway meta). Disables WCS's scheduled actions for migrated subscriptions. |
| `YithSubscriptionSource`, `ArraySubsSource`, `MiloSource`, `SubliumSource`, `RecurioSource` | Each plugin's own subscription tables → `purecart_subscriptions` |
| `LmfwcSource`, `DlmSource`, `KeyManagerSource`, `SlmSource` | Licenses + activations → `purecart_licenses` / `purecart_license_activations`. LMFWC/DLM keys are decrypted with the source plugin's own `defuse` key file; abort with a clear message if it's missing. |
| `EddSource` | EDD Software Licensing licenses, and download permissions → `purecart_downloads` |

- **Runs in batches** through Action Scheduler (`purecart_migration_batch`) so 50k-row stores don't time out. Progress is stored in an option.
- **WP-CLI:** `wp purecart migrate --from=wcs|yith|arraysubs|milo|sublium|recurio|lmfwc|dlm|keymanager|slm|edd [--dry-run] [--batch=500]`.
- **SPA:** "Import" tab under Settings → Tools. It detects which source plugins are installed and shows dry-run counts before import.
- Every imported row gets `_purecart_migrated_from` meta / a `source` column so a second run skips it (idempotent) and can be rolled back.

### B1 — Subscribe & Save

Lets a merchant offer "buy once" or "subscribe and save X%" on an existing simple or variable product, without a separate subscription product type.

- Product meta: `_purecart_sns_enabled`, `_purecart_sns_discount_percent`, `_purecart_sns_periods` (e.g. `1 month`, `3 months`).
- Front end: radio selector rendered on `woocommerce_before_add_to_cart_button` (classic) and a small block / Store API extension (`woocommerce_store_api_register_endpoint_data`) for block themes.
- Cart: the choice is stored in cart item data and the price adjusted on `woocommerce_before_calculate_totals`. `SubscriptionManager` treats an order item with `_purecart_sns_period` as a subscription item.
- Reuses everything else: A1 vaulting, A2 renewals, the existing customer portal.

### B2 — Compliance (click-to-cancel & consent)

US FTC "click-to-cancel" rules and EU consumer law expect easy cancellation and proof of consent.

- **Consent at checkout:** a required checkbox (classic + block checkout) when the cart has a subscription. Text is configurable and includes price, interval, and the cancellation method. Store the consent text hash, timestamp, IP, and user agent on the subscription (`purecart_subscription_logs`, `event = consent_given`).
- **One-click cancel link** in every renewal reminder and receipt email: signed, single-use, 7-day token → confirmation page → cancel (still offers the RetentionFlow offer, but only once and skippable).
- **Pre-renewal notice** is already covered by `RenewalReminderEmail`. Add a setting that enforces it for annual plans (default 15 days before).
- **Audit export:** `GET /purecart/v1/subscriptions/{id}/audit` returns a CSV/JSON of all log events, including consent, for dispute evidence.

### B3 — Customer-scoped REST API + CORS (headless)

New `includes/API/Account.php`, namespace `purecart/v1/me`, permission = logged-in user (cookie + nonce, Application Passwords, or a PureCart customer JWT):

```
GET  /me/licenses                     own licenses (+ activations)
POST /me/licenses/{id}/activate       { domain }
POST /me/licenses/{id}/deactivate     { domain }
GET  /me/downloads                    own download tokens (signed URLs)
GET  /me/subscriptions                (re-uses API\Subscriptions owner checks)
GET  /me/api-keys                     own SaaS accounts
POST /me/api-keys/{id}/rotate
GET  /me/updates                      available updates per owned product
```
- Every handler checks ownership against `get_current_user_id()`. Never trust an ID from the request body.
- **CORS:** setting `purecart_cors_allowed_origins` (list). Add `rest_pre_serve_request` headers **only** for `purecart/v1/me/*` and only for listed origins. No `*`.
- The My Account PHP templates can later use these same endpoints, keeping one source of truth.

### B4 — Outbound webhook hub

`LICENSING-JWT-GAPS-PLAN.md` Feature 5 proposes license webhooks on their own. **Build this hub first and have that feature register its events here.**

- Table `purecart_webhooks` (`id, url, secret, events JSON, active, created_at`) and `purecart_webhook_deliveries` (`webhook_id, event, payload, response_code, attempts, next_attempt_at, delivered_at`).
- Dispatch through Action Scheduler `purecart_webhook_deliver`. HMAC-SHA256 signature in `X-PureCart-Signature`, timestamp in `X-PureCart-Timestamp`. Retries at 1 m / 5 m / 30 m / 2 h / 12 h, then auto-disable after 10 consecutive failures with an admin notice.
- **Events:** `license.created|activated|deactivated|revoked|expired|transferred`, `subscription.created|renewed|payment_failed|paused|resumed|cancelled|expired`, `download.granted|revoked`, `saas.provisioned|suspended|activated`, `update.published`.
- The existing SaaS provisioning webhook moves onto this hub (it gets retries for free, closing the gap noted in `docs/saas-module/QA-CHECKLIST-BN.md`).
- **SPA:** Settings → Webhooks: list, create, test-send, delivery log with redeliver.

---

## Phase 2 — Growth & insight (P2)

### B5 — Key Manager extras

Builds on the key pool in `LICENSING-JWT-GAPS-PLAN.md` Feature 3.

- **Stock from key pool:** for products with `_purecart_key_source = pool`, sync WooCommerce stock to the count of available keys (`woocommerce_product_get_stock_quantity` filter + update on draw/import). Out of keys means out of stock.
- **Reuse keys from refunded orders:** setting "Return keys to pool on refund". A pooled key goes back to `available`, generated keys are revoked.
- **Non-software keys:** product option "Key type: license / gift card / PIN / account credentials". Credentials get an encrypted `secret` field (reuse the encryption helper from the JWT secret code) and no activation API.
- **QR code** for each license (Phase 3 in `RND-licensing.md`): render via `endroid/qr-code`, shown in My Account and emails.
- **PDF invoice integration:** if "PDF Invoices & Packing Slips" is active, append keys through its `wpo_wcpdf_after_item_meta` hook.

### B6 — Pricing table block

- Gutenberg block `purecart/pricing-table` (`src/blocks/pricing-table/`), server-rendered.
- Columns are WooCommerce products (or variations) picked in the editor. Each column shows the price, billing interval, license site limit, and a feature list (repeater).
- **Knows the current plan:** for a logged-in customer with an active subscription or license, their column shows "Current plan" and other columns show "Upgrade" / "Downgrade" buttons that go through `PlanUpgrade` (proration preview from the existing `/subscriptions/{id}/upgrade` logic).
- Monthly/yearly toggle when a product has both periods.
- No custom CSS framework; uses theme.json presets.

### B7 — Cohort retention & forecast

- `RevenueRepository::cohorts( string $grain = 'month', int $periods = 12 )` → retention matrix (customers active N periods after signup).
- `RevenueRepository::forecast( int $months = 6 )` → projected MRR from current MRR, average churn, and scheduled `next_payment_at` amounts.
- `GET /purecart/v1/reports/subscriptions/cohorts` and `/forecast`.
- SPA: cohort heat-map table + forecast line in the subscriptions analytics view.

### C1 — Win-back & onboarding sequences

- **Win-back:** after cancellation/expiry, schedule emails at +7 / +30 / +60 days (configurable) with a one-click resubscribe link (reuses the existing resubscribe flow) and an optional single-use coupon (`SubscriptionCoupon`).
- **Onboarding:** after subscription creation, a welcome series at +0 / +3 / +7 days with merchant-defined content (subject/body per step in settings).
- Both stop automatically when the subscription status changes. Each email is a `WC_Email` subclass so merchants can toggle and edit it in WooCommerce → Settings → Emails.

---

## Phase 3 — Nice to have (P3)

| Gap | Plan |
|---|---|
| **C2 Transfer & gifting** | Transfer: extend the license transfer endpoint (`LICENSING-JWT-GAPS-PLAN.md` F4) to subscriptions, moving linked licenses, SaaS accounts, and the payment token (or clearing the token and requiring the new owner to add one). Gifting: checkout field "This is a gift" + recipient email → subscription created for the recipient (account auto-created) with the purchaser's payment method for a prepaid term only. |
| **C3 Team seats** | `purecart_license_seats` (`license_id, user_id, invited_email, status`). License owner invites members from My Account. Each seat consumes one activation slot. |
| **C4 OIDC provider** | Once RS256 + JWKS exist (`LICENSING-JWT-GAPS-PLAN.md` F6): add `/.well-known/openid-configuration`, an authorization-code + PKCE flow, and `id_token` issuance, so a merchant's SaaS app can offer "Log in with your {store} account". Scope it to SaaS customers only. Don't try to be a general OAuth server. |
| **C5 Notification channels** | Slack / Discord / Twilio SMS as **preset webhook targets** on the B4 hub (payload transformers). No separate integrations. |
| **C6 Buy button / direct checkout** | Block + shortcode `[purecart_buy product="123" coupon="X"]` → `?add-to-cart=123&purecart_direct=1`, which empties the cart (optional), applies the coupon, and redirects to checkout. Useful for selling from docs or landing pages, like Lemon Squeezy's checkout links. |

---

## 4. Out of scope — and why

| Item | Reason |
|---|---|
| Gateway plugins (Payoneer, Visa, Better Payment, Stripe itself) | WooCommerce owns payments. PureCart only needs the renewal adapters (A2), and `ManualRenewal` gives every gateway basic support. |
| Merchant of record, tax/VAT handling (Lemon Squeezy) | A business-model choice, not a plugin feature. WooCommerce tax and VAT extensions cover it. |
| Standalone mode without WooCommerce (Milo, Invizo, Paid Member Subscriptions) | Goes against PureCart's core principle of extending WooCommerce rather than replacing it. |
| Own cart, checkout, product grids, coupons (Invizo, CoCart cart API) | WooCommerce + Store API + CoCart already provide these. PureCart's headless need is customer data (B3), not cart. |
| Donations / fundraising forms (Better Payment) | Not a digital-goods use case. |
| Physical subscription box, fulfillment, split shipping (Milo add-ons) | PureCart is focused on digital goods. |
| Visual email builder (Sublium) | WooCommerce's block-based email editor (WC 9.x) is the right place for this. |
| ERP product sync (Soldx) | Unrelated. |

---

## 5. Implementation order

| Step | Branch | Covers | Effort |
|---|---|---|---|
| 1 | `fix/subscription-payment-capture` | A1 (account required, vaulting filters, token resolver, trigger statuses) | 2 d |
| 2 | `feature/renewal-gateway-adapters` | A2 (Stripe, WooPayments, PayPal Payments, Manual) | 4 d |
| 3 | `feature/subscription-health-check` | A3 | 2 d |
| 4 | `chore/uninstall-and-pcp` | A5 | 1 d |
| 5 | `feature/webhook-hub` | B4 (then re-base licensing F5 on it) | 3 d |
| 6 | `feature/customer-rest-api` | B3 | 2 d |
| 7 | `feature/compliance-click-to-cancel` | B2 | 2 d |
| 8 | `feature/migration-importers` | A4 (start with WooCommerce Subscriptions + LMFWC, then the rest) | 5 d |
| 9 | `feature/subscribe-and-save` | B1 | 3 d |
| 10 | `feature/key-manager-extras` | B5 (after the licensing key pool) | 2 d |
| 11 | `feature/pricing-table-block` | B6 | 2 d |
| 12 | `feature/cohorts-forecast` | B7 | 2 d |
| 13 | `feature/winback-onboarding` | C1 | 2 d |
| 14 | P3 items | C2–C6 | as needed |

Steps 1–3 are **release blockers** for selling subscriptions with automatic renewal.

---

## 6. Files touched

### New PHP
```
includes/Subscriptions/Checkout/CheckoutRules.php
includes/Subscriptions/Checkout/CartInspector.php
includes/Subscriptions/Payment/PaymentMethodResolver.php
includes/Subscriptions/Payment/Gateways/RenewalGateway.php
includes/Subscriptions/Payment/Gateways/GatewayRegistry.php
includes/Subscriptions/Payment/Gateways/{Stripe,WooPayments,PayPalPayments,Manual}Renewal.php
includes/Subscriptions/Health/HealthScanner.php
includes/Subscriptions/Compliance/{ConsentRecorder,CancelLink}.php
includes/Subscriptions/SubscribeAndSave/{ProductFields,CartHandler}.php
includes/Subscriptions/Emails/{Winback,Onboarding,ManualRenewalInvoice}Email.php
includes/Migration/{ImporterInterface,MigrationRunner,Report}.php
includes/Migration/Sources/*Source.php
includes/Webhooks/{WebhookRepository,Dispatcher,Signer}.php
includes/API/{Account,Webhooks,Migration}.php
includes/Uninstaller.php
uninstall.php
```

### Modified PHP
```
includes/Activator.php                               (subscription columns, health/webhook/seat tables)
includes/Subscriptions/SubscriptionManager.php       (token capture, trigger statuses, guest guard → account required)
includes/Subscriptions/Renewal/RenewalEngine.php     (adapter registry instead of process_payment)
includes/Subscriptions/Payment/DunningManager.php    (requires_action handling)
includes/SaaS/AccountProvisioner.php                 (send webhooks through the hub)
includes/API/Subscriptions.php                       (health, audit, cohorts, forecast endpoints)
includes/Settings/OptionKeys.php                     (SUB_CREATE_ON_STATUS, CORS origins, delete-on-uninstall, compliance, webhooks)
```

### Admin SPA (only once the matching PHP controller exists)
```
src/app/modules/subscriptions/  → Health tab, cohorts/forecast views
src/app/modules/settings/       → Webhooks, Import, Advanced (delete data), Compliance
src/blocks/pricing-table/       → new block
```

---

## 7. Smoke tests

1. **Card vaulted:** Stripe test card, subscription product, new customer → `wp_woocommerce_payment_tokens` has a row, `purecart_subscriptions.payment_token_id` set.
2. **Account required:** guest checkout with a subscription in the cart → account fields are required. With only one-off items → guest allowed.
3. **Processing order:** virtual non-downloadable subscription product → order `processing` → subscription created.
4. **Off-session renewal:** set `next_payment_at` to now → run the renewal job → Stripe PaymentIntent shows `off_session: true`, renewal order `processing`/`completed`, transaction ID stored.
5. **3-D Secure:** card `4000 0027 6000 3184` → `requires_action`, order on-hold, reauthorization email with pay link → customer pays → subscription healthy.
6. **Manual gateway:** bank transfer subscription → renewal order `pending` + invoice email with pay link.
7. **Health check:** delete a token from the DB → next scan flags `missing_token` → "Fix" sends the card-update email.
8. **Migration dry run:** WooCommerce Subscriptions with 3 subscriptions → `wp purecart migrate --from=wcs --dry-run` reports 3, writes nothing. A real run imports 3; a second run imports 0.
9. **Webhooks:** endpoint returns 500 → delivery retried on schedule → endpoint fixed → redelivered and marked delivered.
10. **Customer API:** user A calls `GET /purecart/v1/me/licenses` → only A's licenses. Calling activate on B's license ID → 403.
11. **Click-to-cancel:** the link in a reminder email cancels in ≤2 clicks. The link can't be reused.
12. **Uninstall:** toggle on → delete plugin → no `purecart_*` tables or options remain. Toggle off → data kept.
13. **PCP:** `wp plugin check woo-digital-downloads` → zero errors.
