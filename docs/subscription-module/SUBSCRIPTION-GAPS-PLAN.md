# PureCart Subscriptions — Missing Features: End-to-End Implementation Plan

**Module:** Subscriptions  
**Audit basis:** Competitive comparison against YITH WooCommerce Subscription and WP Swings Subscriptions for WooCommerce (October 2026)  
**Branch convention:** cut from `development` → one branch per feature  
**Done criteria (PHP):** `composer cs` zero errors  
**Done criteria (src/):** `npx tsc --noEmit` + `npm run lint:js` + `npm run lint:css` + `npm run build`

---

## Summary of Gaps

| # | Feature | Competitors that have it | Priority |
|---|---|---|---|
| 1 | Signup / initial fee | YITH, WP Swings | High |
| 2 | Billing date synchronization | YITH | Medium |
| 3 | Variable product subscriptions | WP Swings Pro | Medium |
| 4 | Manual admin subscription creation | YITH, WP Swings Pro | Medium |
| 5 | My Account customer portal (verify + complete) | YITH, WP Swings | High |

---

## Feature 1 — Signup / Initial Fee

### What it is
A one-time fee charged on the **first payment only**, on top of the regular subscription price. Example: "$10 setup fee + $49/month". Competitors display it as a separate line item in the cart, on the checkout page, and in the first WooCommerce order.

### Current state
No `signup_fee` field exists anywhere in PureCart's Subscriptions module — not in the product meta, the DB schema, the cart, the order handler, or the renewal engine.

### What to build

#### Step 1 — DB schema (migration)
Add `signup_fee DECIMAL(10,2) NOT NULL DEFAULT 0.00` to `purecart_subscriptions`. Add a migration in `includes/Activator.php` guarded by a version option so it only runs once.

```php
// In Activator::maybe_run_migrations()
if ( version_compare( $installed_version, '1.1.0', '<' ) ) {
    $wpdb->query( "ALTER TABLE {$wpdb->prefix}purecart_subscriptions
        ADD COLUMN signup_fee DECIMAL(10,2) NOT NULL DEFAULT 0.00
        AFTER recurring_amount" );
    update_option( 'purecart_db_version', '1.1.0' );
}
```

#### Step 2 — Product meta
In `includes/Subscriptions/Product/SubscriptionProductType.php` (or its WooCommerce product tab):
- Add `_purecart_signup_fee` meta field to the "Subscription" product tab.
- Save and sanitize it alongside `_purecart_recurring_amount`.

```php
// Product tab field
woocommerce_wp_text_input( [
    'id'          => '_purecart_signup_fee',
    'label'       => __( 'Sign-up Fee', 'purecart' ) . ' (' . get_woocommerce_currency_symbol() . ')',
    'placeholder' => '0.00',
    'type'        => 'text',
    'desc_tip'    => true,
    'description' => __( 'One-time fee charged on the first payment only.', 'purecart' ),
] );
```

#### Step 3 — Cart / checkout display
In `includes/Subscriptions/Product/` (cart hooks):
- Hook `woocommerce_cart_item_subtotal` and `woocommerce_checkout_cart_item_quantity` to append the signup fee as a note when `$signup_fee > 0`.
- Hook `woocommerce_cart_fees` → `WC()->cart->add_fee()` to inject the signup fee as a cart fee on first-time subscription checkouts (not on renewal orders).

```php
add_action( 'woocommerce_cart_calculate_fees', function() {
    foreach ( WC()->cart->get_cart() as $item ) {
        $product_id  = $item['product_id'];
        $signup_fee  = (float) get_post_meta( $product_id, '_purecart_signup_fee', true );
        if ( $signup_fee > 0 ) {
            WC()->cart->add_fee(
                __( 'Sign-up Fee', 'purecart' ),
                $signup_fee,
                true  // taxable — respects store tax settings
            );
        }
    }
} );
```

#### Step 4 — Order handler
In `includes/Subscriptions/` order processing (wherever `SubscriptionManager` or `OrderHandler` creates the subscription row on `woocommerce_order_status_completed`):
- Read `_purecart_signup_fee` from the product.
- Persist `signup_fee` to `purecart_subscriptions`.
- **Do not** include it in renewal payment amounts.

#### Step 5 — Renewal engine guard
In `includes/Subscriptions/Renewal/RenewalEngine.php`:
- Confirm that `charge_amount` for renewals reads `recurring_amount` only, not `recurring_amount + signup_fee`. Add an explicit assertion/comment.

#### Step 6 — Payment ledger
In `includes/Subscriptions/Payment/PaymentRepository.php`:
- Record the first payment as `recurring_amount + signup_fee` (the actual charge) but tag it with `payment_type = 'initial'` so analytics can split it from recurring revenue.

#### Step 7 — Admin SPA
In `src/app/modules/subscriptions/`:
- Add `signup_fee` to the subscription detail `OverviewTab` (read-only display).
- Add it to the `ChangePlanModal` so an admin can set a fee when manually changing a plan (Feature 4).

#### Step 8 — REST API
In `includes/API/Subscriptions.php`:
- Include `signup_fee` in the subscription object schema (`register_rest_field` or `get_subscription_data()` mapping).

#### Step 9 — Emails
In `includes/Subscriptions/Emails/`:
- Add `{signup_fee}` placeholder to `SubscriptionPurchasedEmail` (if one exists) or the WooCommerce order email that fires on checkout.

#### Step 10 — Test
```bash
composer test:remove && composer test:demo
```
Verify: add a product with a signup fee to cart → checkout shows fee → first payment includes fee → renewal charge equals `recurring_amount` only.

---

## Feature 2 — Billing Date Synchronization

### What it is
Lock all new subscriptions (or a product's subscriptions) to a fixed day of the month (e.g., the 1st). The first period is prorated to cover only the days until the next sync date. Common for SaaS businesses that want all charges on the same date.

### Current state
`purecart_subscriptions` stores a `billing_day TINYINT` column (per `SubscriptionRepository`) but nothing reads it or aligns subscription dates on creation.

### What to build

#### Step 1 — Settings
In `includes/Settings/OptionKeys.php`, add:
```php
const SUBSCRIPTION_BILLING_DAY = 'purecart_subscription_billing_day'; // 0 = disabled, 1–28 = fixed day
```
Add it to the Settings UI (Subscriptions tab) as an integer field, 0–28, with "0 = disabled" note.

#### Step 2 — `BillingSyncEngine` class
Create `includes/Subscriptions/Billing/BillingSyncEngine.php`:

```php
namespace PureCart\Subscriptions\Billing;

class BillingSyncEngine {

    /**
     * Given a start date and a billing day, compute:
     * - first_payment_date : the next occurrence of billing_day
     * - prorated_amount    : fraction of recurring_amount for the partial first period
     *
     * @param \DateTimeImmutable $starts_at
     * @param int                $billing_day   1–28
     * @param float              $recurring_amount
     * @param string             $billing_period 'month'|'year'|'week'
     * @return array{first_payment_date: \DateTimeImmutable, prorated_amount: float}
     */
    public function compute( \DateTimeImmutable $starts_at, int $billing_day, float $recurring_amount, string $billing_period ): array {
        // Find next billing_day occurrence.
        $year  = (int) $starts_at->format( 'Y' );
        $month = (int) $starts_at->format( 'n' );
        $day   = (int) $starts_at->format( 'j' );

        if ( $day >= $billing_day ) {
            // Already past this month's billing day — move to next month.
            $month++;
            if ( $month > 12 ) { $month = 1; $year++; }
        }

        // Cap billing_day to last day of target month (handles Jan 31 → Feb 28).
        $days_in_month = (int) ( new \DateTimeImmutable( "{$year}-{$month}-01" ) )->format( 't' );
        $capped_day    = min( $billing_day, $days_in_month );

        $first_payment_date = new \DateTimeImmutable( "{$year}-{$month}-{$capped_day}" );

        // Prorate: days until billing date ÷ days in a full period.
        $days_until  = (int) $starts_at->diff( $first_payment_date )->days;
        $days_period = 'month' === $billing_period ? 30 : ( 'year' === $billing_period ? 365 : 7 );
        $prorated    = round( $recurring_amount * ( $days_until / $days_period ), 2 );

        return [
            'first_payment_date' => $first_payment_date,
            'prorated_amount'    => $prorated,
        ];
    }
}
```

#### Step 3 — Wire into subscription creation
In `SubscriptionManager` (wherever `next_payment_at` is set on subscription creation):

```php
$billing_day = (int) Settings::get( OptionKeys::SUBSCRIPTION_BILLING_DAY );
if ( $billing_day >= 1 && $billing_day <= 28 && 'month' === $billing_period ) {
    $sync   = ( new BillingSyncEngine() )->compute( $starts_at, $billing_day, $recurring_amount, $billing_period );
    $next_payment_at  = $sync['first_payment_date'];
    $first_charge_amount = $sync['prorated_amount']; // persisted separately or added to signup_fee
}
```

#### Step 4 — Per-product override (optional)
Add `_purecart_billing_day` product meta that overrides the global setting for that product's subscriptions. Validate: 0 = inherit global, 1–28 = fixed.

#### Step 5 — Admin SPA
In `src/app/modules/subscriptions/` detail `OverviewTab`:
- Display `billing_day` if set.
- Allow admin to change it with an "Apply at next renewal" option (sets `billing_day` on the record, no immediate reschedule).

#### Step 6 — Test
Set billing day = 1. Create a subscription on the 15th. Verify `next_payment_at` = 1st of next month. Verify prorated first charge < `recurring_amount`.

---

## Feature 3 — Variable Product Subscriptions

### What it is
Let each **variation** of a WooCommerce variable product carry its own subscription price, billing period, and trial. Example: a product with variations "Monthly ($19/mo)" and "Annual ($149/yr)".

### Current state
`SubscriptionProductType` targets simple products. No variation-level subscription fields exist.

### What to build

#### Step 1 — Variable product type
In `includes/Subscriptions/Product/`, register a `purecart-variable-subscription` product type that extends WC's `WC_Product_Variable`, or hook into existing variation saving hooks.

Simpler approach (no new product type needed): hook `woocommerce_product_after_variable_attributes` and `woocommerce_save_product_variation` to add/save subscription fields per variation.

#### Step 2 — Variation meta fields
For each variation, add the following fields in the product variations tab:
- `_purecart_is_subscription` (checkbox — make this variation a subscription)
- `_purecart_recurring_amount` (price — overrides if set, otherwise uses variation regular price)
- `_purecart_billing_period` (select: day / week / month / year)
- `_purecart_billing_interval` (integer)
- `_purecart_trial_length` (integer)
- `_purecart_trial_period` (select: day / week / month)
- `_purecart_signup_fee` (decimal — links to Feature 1)

Save them in `woocommerce_save_product_variation` hook alongside standard variation data.

#### Step 3 — Cart / order handler
In cart processing, when a variable product's chosen variation has `_purecart_is_subscription = 1`:
- Read subscription fields from the **variation** (not the parent product).
- Pass them as cart item data into the subscription creation flow.

```php
add_filter( 'woocommerce_add_cart_item_data', function( $data, $product_id, $variation_id ) {
    if ( ! $variation_id ) { return $data; }
    if ( ! get_post_meta( $variation_id, '_purecart_is_subscription', true ) ) { return $data; }

    $data['purecart_subscription'] = [
        'recurring_amount' => get_post_meta( $variation_id, '_purecart_recurring_amount', true )
                               ?: wc_get_product( $variation_id )->get_regular_price(),
        'billing_period'   => get_post_meta( $variation_id, '_purecart_billing_period', true ),
        'billing_interval' => get_post_meta( $variation_id, '_purecart_billing_interval', true ),
        'trial_length'     => get_post_meta( $variation_id, '_purecart_trial_length', true ),
        'trial_period'     => get_post_meta( $variation_id, '_purecart_trial_period', true ),
        'signup_fee'       => get_post_meta( $variation_id, '_purecart_signup_fee', true ),
    ];
    return $data;
}, 10, 3 );
```

#### Step 4 — Plan switching for variations
When a customer upgrades/downgrades between variations of the same variable product:
- `PlanUpgrade.php` should accept a `variation_id` in its payload.
- Compute proration against the new variation's `recurring_amount`.

#### Step 5 — Admin SPA
In `src/app/modules/subscriptions/` detail:
- Display variation name (if applicable) alongside product name.
- `ChangePlanModal` should list available variations of the same parent product as upgrade/downgrade targets.

#### Step 6 — Test
Create a variable product with two variations (monthly/annual). Add monthly variation to cart. Verify subscription row stores variation-level billing data. Test upgrade from monthly → annual variation.

---

## Feature 4 — Manual Admin Subscription Creation

### What it is
An admin creates a subscription record directly in the dashboard — picking customer, product, plan, price, next payment date — without requiring a checkout flow. Useful for migrating existing customers, gifting subscriptions, or fixing data.

### Current state
No equivalent exists. Every subscription originates from a WooCommerce order.

### What to build

#### Step 1 — REST endpoint
In `includes/API/Subscriptions.php`, register:

```
POST /purecart/v1/subscriptions
```

Request body:
```json
{
  "user_id": 42,
  "product_id": 501,
  "variation_id": 0,
  "recurring_amount": 49.00,
  "currency": "USD",
  "billing_period": "month",
  "billing_interval": 1,
  "trial_ends_at": null,
  "next_payment_at": "2026-11-01 00:00:00",
  "starts_at": "2026-10-03 00:00:00",
  "gateway": "manual",
  "gateway_subscription_id": "",
  "signup_fee": 0.00,
  "status": "active"
}
```

Permission: `manage_woocommerce` only.  
Validation: `user_id` must exist, `product_id` must exist and have `_purecart_is_subscription = 1`, amounts non-negative, dates parseable.

Handler calls `SubscriptionManager::create()` (existing or new method), fires `purecart_subscription_created` action.

#### Step 2 — `SubscriptionManager::create()`
Extract the subscription row insertion from the order-handler path into a standalone `create( array $data ): int` method that:
- Inserts into `purecart_subscriptions`.
- Inserts into `purecart_subscription_items`.
- Inserts an initial log entry (`actor_type = 'admin'`, event = `'manual_creation'`).
- Fires `purecart_subscription_created` action.
- Returns the new subscription ID.

The order-handler path should be refactored to call `create()` instead of duplicating the insert logic.

#### Step 3 — Admin SPA modal
In `src/app/modules/subscriptions/`:
- Add a **"Create Subscription"** button to `SubscriptionsPage.tsx` (top-right, beside "Export").
- Create `CreateSubscriptionModal.tsx` with fields:
  - Customer search (async — calls WP users search API)
  - Product selector (calls WC products API filtered to subscription products)
  - Plan fields: recurring amount, billing period, billing interval
  - Optional: trial end date, signup fee, next payment date
  - Gateway: dropdown (Stripe, PayPal, Manual)
  - Gateway subscription ID (optional — for migrating existing Stripe sub IDs)
- On submit: `POST /purecart/v1/subscriptions`.
- On success: refresh the subscriptions list, open the new subscription's detail panel.

#### Step 4 — Delivery provisioning
After `SubscriptionManager::create()`:
- If the product has a delivery handler (license, download, SaaS, etc.), trigger it immediately.
- Use the existing `DeliveryManager::provision( $subscription_id )` method (or equivalent).

#### Step 5 — Test
Create a subscription manually for an existing customer. Verify: row in DB, log entry shows `manual_creation`, delivery is provisioned, subscription appears in list with correct status.

---

## Feature 5 — My Account Customer Portal (Verify + Complete)

### What it is
The customer-facing tab at `/my-account/purecart-subscriptions/` where customers can view, pause, skip, cancel, and resubscribe to their own subscriptions.

### Current state (audit finding)
The audit found only Redux slice + selectors under `src/app/modules/subscriptions/`. The PHP template `templates/myaccount/purecart-subscriptions.php` does exist, and `Dashboard.php` registers the endpoint and loads it. This section verifies exactly what is and is not working.

### Verification checklist (run before building anything)

1. `templates/myaccount/purecart-subscriptions.php` — does it render the customer's subscription list? ✓/✗
2. REST endpoint `GET /purecart/v1/subscriptions?customer=current` — does it scope to the logged-in user? ✓/✗
3. JS bundle `build/woo-account/subscriptions.js` — does it load and mount the React component on the page? ✓/✗
4. Action buttons (Pause / Cancel / Skip / Resume / Resubscribe) — do they hit the correct REST endpoints and update state? ✓/✗
5. `purecart-subscriptions` WC endpoint — does it resolve without 404? (covered by auto-flush in `Dashboard.php`) ✓/✗

### What to complete (based on likely gaps)

#### Gap A — REST auth for customer-scoped endpoints
The REST API in `includes/API/Subscriptions.php` probably has `manage_woocommerce` permission on all endpoints. Add a secondary permission check: a logged-in customer can call action endpoints (`pause`, `cancel`, `skip`, `resume`, `resubscribe`) on subscriptions they own.

```php
'permission_callback' => function( WP_REST_Request $request ) {
    $sub_id = (int) $request->get_param( 'id' );
    $sub    = $this->repository->find( $sub_id );
    if ( ! $sub ) { return false; }

    // Admin can do anything.
    if ( current_user_can( 'manage_woocommerce' ) ) { return true; }

    // Customer can only act on their own subscriptions.
    return is_user_logged_in() && (int) $sub->user_id === get_current_user_id();
},
```

#### Gap B — Customer-facing action restrictions
In the PHP template or the React component, only show buttons appropriate for the customer role:

| Action | Customer sees? | Condition |
|---|---|---|
| Pause | Yes | Status = active, product allows pause |
| Resume | Yes | Status = paused |
| Skip Next | Yes | Status = active, next payment > today |
| Cancel | Yes | Status = active / trialing / paused |
| Resubscribe | Yes | Status = cancelled |
| Force Renewal | No | Admin only |
| Retry Payment | No | Admin only |
| Change Plan | Yes | Status = active (if variations exist) |
| Apply Discount | No | Admin only |

Add a `?context=customer` query param (or check `current_user_can`) in the REST response to strip admin-only fields from the payload.

#### Gap C — Payment method update
When `status = past_due`, the customer portal should show an "Update Payment Method" button that redirects to the WooCommerce payment methods page (`/my-account/payment-methods/`) or opens a gateway-specific update URL (Stripe customer portal, PayPal subscription management link).

In `includes/API/Subscriptions.php`:
```
GET /purecart/v1/subscriptions/{id}/payment-update-url
```
Returns gateway-specific URL (Stripe: Customer Portal session URL; PayPal: subscription management link; fallback: WC payment methods page).

#### Gap D — Resubscribe flow
A cancelled customer clicking "Resubscribe" should:
1. Call `POST /subscriptions/{id}/resubscribe` (existing endpoint).
2. The endpoint creates a **new** subscription (not revive the old one) with `gateway = manual` and `status = pending`.
3. Redirect the customer to a checkout page pre-filled with the original product.

Alternatively: if the product still exists, redirect directly to `?add-to-cart={product_id}`.

#### Gap E — Mobile-responsive CSS
`build/woo-account/subscriptions.css` covers the tab. Verify it responds well on mobile (table → card layout). Refer to WooCommerce's own responsive table pattern using `data-label` attributes (already applied to `purecart-api-keys.php` and `purecart-licenses.php`).

### Template update
`templates/myaccount/purecart-subscriptions.php` should serve as the mounting point for the React bundle and a no-JS fallback table. Structure:

```php
<?php
// No-JS server-rendered fallback (hidden when JS loads).
$subs = ( new SubscriptionRepository() )->find_by_user( get_current_user_id() );
?>
<div id="purecart-my-subscriptions" data-nonce="<?php echo esc_attr( wp_create_nonce( 'wp_rest' ) ); ?>">
    <?php if ( empty( $subs ) ) : ?>
        <p><?php esc_html_e( 'You have no active subscriptions.', 'purecart' ); ?></p>
    <?php else : ?>
        <!-- server-side fallback table rendered here, hidden by JS on mount -->
    <?php endif; ?>
</div>
```

---

## Implementation Order

| Step | Feature | Branch | Estimated PRs |
|---|---|---|---|
| 1 | Verify My Account portal (Feature 5 — gaps A–E audit) | `fix/myaccount-portal` | 1 |
| 2 | Signup fee — PHP + product meta + cart + order | `feature/signup-fee` | 1 |
| 3 | Signup fee — Admin SPA + REST | `feature/signup-fee` | same PR |
| 4 | Manual creation — REST endpoint + `SubscriptionManager::create()` | `feature/manual-subscription-create` | 1 |
| 5 | Manual creation — Admin SPA modal | `feature/manual-subscription-create` | same PR |
| 6 | Variable products — variation meta + cart handler | `feature/variable-subscription` | 1 |
| 7 | Variable products — Admin SPA `ChangePlanModal` variation support | `feature/variable-subscription` | same PR |
| 8 | Billing date sync — `BillingSyncEngine` + settings | `feature/billing-sync` | 1 |
| 9 | Billing date sync — per-product override + Admin SPA display | `feature/billing-sync` | same PR |

---

## Files Touched Per Feature

### Feature 1 — Signup fee
```
includes/Activator.php                               (DB migration)
includes/Subscriptions/Product/SubscriptionProductType.php  (product meta field)
includes/Subscriptions/SubscriptionManager.php       (persist signup_fee on creation)
includes/Subscriptions/Renewal/RenewalEngine.php     (guard — exclude from renewals)
includes/Subscriptions/Payment/PaymentRepository.php (tag first payment as 'initial')
includes/API/Subscriptions.php                       (add signup_fee to schema)
includes/Subscriptions/Emails/SubscriptionPurchasedEmail.php (placeholder)
src/app/modules/subscriptions/components/OverviewTab.tsx    (display)
src/app/modules/subscriptions/components/CreateSubscriptionModal.tsx (Feature 4 overlap)
```

### Feature 2 — Billing date sync
```
includes/Settings/OptionKeys.php                     (new constant)
includes/Subscriptions/Billing/BillingSyncEngine.php (new class)
includes/Subscriptions/SubscriptionManager.php       (wire on creation)
includes/Store/Subscriptions.php                     (billing_day already present)
src/app/modules/subscriptions/components/OverviewTab.tsx    (display billing_day)
```

### Feature 3 — Variable products
```
includes/Subscriptions/Product/VariationSubscriptionFields.php  (new class — variation hooks)
includes/Subscriptions/SubscriptionManager.php       (read variation cart item data)
includes/Subscriptions/Billing/PlanUpgrade.php       (accept variation_id)
src/app/modules/subscriptions/components/ChangePlanModal.tsx    (list variations)
```

### Feature 4 — Manual creation
```
includes/API/Subscriptions.php                       (POST /subscriptions endpoint)
includes/Subscriptions/SubscriptionManager.php       (create() method refactor)
src/app/modules/subscriptions/SubscriptionsPage.tsx  (Create button)
src/app/modules/subscriptions/components/CreateSubscriptionModal.tsx  (new component)
src/app/modules/subscriptions/api.ts                 (createSubscription() call)
```

### Feature 5 — My Account portal
```
includes/API/Subscriptions.php                       (customer permission check; /payment-update-url)
templates/myaccount/purecart-subscriptions.php       (mounting point + fallback)
src/woo-account/                                     (verify/fix React bundle)
assets/css/purecart-myaccount-subscriptions.css      (responsive table)
```

---

## Done Criteria Per Feature

After completing each feature, run:

```bash
composer cs
npx tsc --noEmit
npm run lint:js
npm run lint:css
npm run build
composer test:remove && composer test:demo
```

Then manually verify in the browser logged in as `demo_alice` (password `demo1234`) at:
- `/my-account/purecart-subscriptions/` — customer portal
- WP Admin → PureCart → Subscriptions — admin SPA

---

## What PureCart Already Has That Competitors Don't

Do not remove or refactor these while implementing the above — they are competitive advantages:

- `DunningManager.php` — configurable payment retry schedules
- `ChurnScorer.php` — predictive churn scoring
- 17 lifecycle email classes (competitors have 4–8)
- `PlanUpgrade.php` with 3 proration modes
- `RetentionFlow.php` — cancellation reasons + retention offers
- `Webhooks/WebhookHandler.php` — outbound webhooks + REST exposure
- Delivery handler registry (downloads, courses, services, memberships)
- `SkipRenewal` — skip next billing cycle workflow
- `CardExpiringSoonEmail` — proactive card expiry warning
