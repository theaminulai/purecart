# RND — Subscription Module
**Plugin:** woo-digital-downloads
**Module:** Subscriptions
**Phase:** 2
**Standalone:** Yes — works independently; links to Licensing and SaaS modules when both are active
**Third-party dependency:** None — fully built-in

---

## Overview

The Subscriptions module is a complete, self-contained recurring billing management system built directly into WDD. It adds a subscription product type to WooCommerce, handles recurring billing via Stripe and PayPal (through WooCommerce's gateway layer), manages the full subscription lifecycle (trial → active → paused → cancelled → expired), and ties renewals directly to license expiry and SaaS account status when those modules are enabled.

This is not a billing layer wrapper — it is a full subscription engine.

---

## Standalone Usage

Enable this module in **Settings → Digital Downloads → Modules → Subscriptions**.

Without any other WDD module:
- Create subscription products with recurring pricing, free trials, sign-up fees
- Auto-renew via Stripe or PayPal
- Customer self-service: pause, resume, cancel, change payment method, upgrade/downgrade
- Admin: manage all subscriptions, trigger manual renewals, bulk actions
- Dunning: configurable retry and email sequence on payment failure
- Reports: active/expired/cancelled counts, revenue from subscriptions, CSV export

With **Licensing** enabled: renewal automatically extends license expiry.
With **SaaS** enabled: suspension automatically suspends the SaaS account.

---

## Feature Specification

### 1. Subscription Product Types

| Feature | Description | Developer Notes |
|---|---|---|
| Subscription product type | Admin creates `wdd_subscription` product in WooCommerce | Register via `woocommerce_product_class` + product meta boxes |
| Recurring price | Set a recurring billing amount | Store in `_wdd_sub_price` product meta |
| Billing interval | Daily / Weekly / Monthly / Yearly | Store in `_wdd_sub_interval` + `_wdd_sub_period` meta |
| Free trial | Optional free trial period before billing starts | `_wdd_sub_trial_length` + `_wdd_sub_trial_period` meta |
| Sign-up fee | Optional one-time fee collected on first payment | `_wdd_sub_signup_fee` meta |
| Subscription length | Max duration (e.g., 12 months); empty = indefinite | `_wdd_sub_length` meta |
| Variable subscriptions | Support product variations with different prices/intervals | Integrate with WooCommerce variable product structure |
| Mixed cart | Subscription + non-subscription products in one checkout | WC cart compatibility required |
| Multiple subscriptions | Multiple subscription products in a single checkout | Create separate subscription records per product |
| Subscription coupons | Sign-up fee coupon type + recurring fee coupon type | Custom WC coupon discount types |
| Drip content | Deliver downloadable files incrementally over time | Phase 4 — requires Downloads module |

---

### 2. Subscription Management (Customer)

| Feature | Description |
|---|---|
| My Account subscriptions tab | Customer views all active/past subscriptions |
| Pause subscription | Customer can pause; billing suspended, access maintained during pause |
| Resume subscription | Resume from paused state; next billing on resume date |
| Cancel subscription | Customer cancels; access continues to period end (grace period) |
| Change payment method | Customer updates card/PayPal for future renewals |
| Upgrade plan | Switch to higher-tier product; proration applied or full price charged |
| Downgrade plan | Switch to lower-tier product; change effective next cycle |
| Resubscribe | Re-activate a cancelled or expired subscription |
| Update quantity | Change subscription quantity (if product allows) |
| View renewal history | Full log of payments, status changes, retries |

---

### 3. Admin Features

| Feature | Description |
|---|---|
| Admin subscription list | Sortable list table of all subscriptions |
| Filter subscriptions | Filter by status, product, customer, date range |
| Subscription detail page | View all details, payment log, status history |
| Manual status change | Admin changes status with reason and hook fires |
| Manual renewal trigger | Admin forces renewal from detail page |
| Manual cancellation | Admin cancels with optional grace period |
| Bulk actions | Bulk cancel, bulk retry payment, bulk export |
| Overdue/suspend period | Configurable days before overdue → suspended |
| Payment retry settings | Number of retries and intervals (configurable) |
| Multiple reminder emails | Pre-renewal reminders (configurable days before) |
| Tax in renewal | Include or exclude tax in renewal orders |
| Shipping in renewal | Include or exclude shipping in renewal orders |
| Subscription logs | Per-subscription log of all events (payment attempt, status change, email sent) |

---

### 4. Renewal Methods

| Method | Requirement |
|---|---|
| Auto-renewal via Stripe | WooCommerce Stripe Gateway active |
| Auto-renewal via PayPal | WooCommerce PayPal Payments active |
| Auto-renewal via PayPal Subscriptions | PayPal Subscriptions API (billing agreements) |
| Manual renewal | Customer pays renewal invoice manually via any WC gateway |
| Fallback to manual | If auto-renewal fails or is cancelled, subscription switches to manual mode |

Auto-renewal uses the payment token stored by the gateway on initial purchase. WDD does not store card data — it stores the gateway's token reference.

---

### 5. Notifications (Email)

All emails use WooCommerce's HTML email infrastructure. Templates overridable in `your-theme/woocommerce/emails/`.

| Email | Trigger | Customizable |
|---|---|---|
| Subscription created | Order completed with subscription product | Yes |
| Renewal reminder | N days before renewal (configurable) | Yes |
| Renewal successful | Payment captured successfully | Yes |
| Payment failed | Auto-renewal charge fails | Yes |
| Overdue notice | Payment still outstanding after X days | Yes |
| Suspend notice | Subscription suspended after overdue period | Yes |
| Cancellation notice | Customer or admin cancels | Yes |
| Expiration notice | Fixed-length subscription reaches end | Yes |
| Resubscription confirmed | Customer resubscribes | Yes |

Multiple pre-renewal reminders can be configured (e.g., 7 days before, 3 days before, 1 day before).

---

### 6. Reports

| Report | Description |
|---|---|
| Active subscriptions | Count by product, with MRR breakdown |
| Expired subscriptions | Count and revenue lost |
| Cancelled subscriptions | Count, churn rate |
| Trial to paid conversion | % of trials that converted |
| Revenue report | Total billed per period |
| Export to CSV | All subscription data including customer info, billing amounts, dates |

---

## Architecture

### Classes

| Class | File | Responsibility |
|---|---|---|
| `SubscriptionProduct` | `includes/Subscriptions/SubscriptionProduct.php` | Register product type, meta boxes, pricing display |
| `SubscriptionManager` | `includes/Subscriptions/SubscriptionManager.php` | Create, renew, pause, cancel, resubscribe |
| `RenewalEngine` | `includes/Subscriptions/RenewalEngine.php` | Action Scheduler jobs for auto-renewal |
| `DunningManager` | `includes/Subscriptions/DunningManager.php` | Failed payment retry sequence + emails |
| `PlanUpgrade` | `includes/Subscriptions/PlanUpgrade.php` | Proration, upgrade/downgrade logic |
| `SubscriptionEmail` | `includes/Subscriptions/SubscriptionEmail.php` | All subscription-specific email classes |
| `SubscriptionReport` | `includes/Subscriptions/SubscriptionReport.php` | Admin reports and CSV export |
| `SubscriptionListTable` | `includes/Admin/SubscriptionListTable.php` | WP_List_Table implementation |

---

## Subscription Lifecycle

```
Order Completed (initial purchase — subscription product)
    │
    └── SubscriptionManager::create_from_order($order_id)
            ├── Extract subscription product meta (price, interval, trial, signup fee)
            ├── INSERT wp_wdd_subscriptions {
            │       status: 'trialing' (if trial) or 'active',
            │       trial_ends_at: NOW() + trial_days (or NULL),
            │       next_payment_at: NOW() + billing_interval
            │   }
            ├── [If Licensing active] → link license_id, set expires_at = next_payment_at
            ├── [If SaaS active]     → AccountProvisioner::provision()
            ├── Store gateway token reference from order
            └── Schedule: RenewalEngine::schedule_renewal(subscription_id, next_payment_at)

Renewal Due (Action Scheduler fires)
    │
    └── RenewalEngine::process_renewal($subscription_id)
            ├── Load subscription + stored gateway token
            ├── Create new WC order for renewal amount
            ├── Attempt charge via gateway token
            ├── [Success]
            │       ├── UPDATE next_payment_at += interval
            │       ├── [If Licensing] LicenseExpiry::extend(license_id, interval_days)
            │       ├── [If SaaS]     AccountProvisioner::activate(account_id)
            │       ├── Send "Renewal successful" email
            │       └── Schedule next renewal
            └── [Failure] → DunningManager::on_payment_failed(subscription_id)

Payment Failed (Dunning Sequence — via Action Scheduler)
    │
    ├── Day 0:  Status → 'past_due'. Send "Payment failed" email.
    ├── Day N:  Retry charge. On success → back to Active flow above.
    │           On failure → send overdue reminder.
    ├── Day X:  Status → 'suspended'. Suspend license / SaaS account.
    │           Send "Access suspended" email.
    └── Day Y:  Status → 'cancelled'. Final cancellation email.
                [If Licensing] License remains until expires_at (grace) or revoked.

Customer Pauses Subscription
    │
    └── SubscriptionManager::pause($subscription_id)
            ├── UPDATE status = 'paused', paused_at = NOW()
            ├── Cancel scheduled renewal Action Scheduler job
            └── [License stays valid during pause]

Customer Resumes Subscription
    │
    └── SubscriptionManager::resume($subscription_id)
            ├── UPDATE status = 'active'
            ├── Calculate new next_payment_at (NOW() + remaining_days or fresh cycle)
            └── Schedule renewal job

Customer Cancels Subscription
    │
    └── SubscriptionManager::cancel($subscription_id)
            ├── UPDATE status = 'cancelled', cancelled_at = NOW()
            ├── Cancel scheduled renewal
            ├── Send cancellation email
            ├── [License stays active until expires_at — grace period]
            └── [SaaS account suspended immediately or at period end — configurable]

Subscription Expires (fixed length)
    │
    └── SubscriptionManager::expire($subscription_id)
            ├── UPDATE status = 'expired'
            ├── [License revoked or allowed to expire naturally]
            └── Send expiration email

Customer Resubscribes
    │
    └── SubscriptionManager::resubscribe($subscription_id)
            ├── Create new subscription record (or re-activate if within N days)
            ├── New payment collected immediately
            └── Link to existing license (extend) or generate new license
```

---

## Upgrade / Downgrade with Proration

```
Customer upgrades from Plan A ($49/mo) to Plan B ($99/mo)
    │
    └── PlanUpgrade::process($subscription_id, $new_product_id)
            ├── Calculate days_remaining = (next_payment_at - NOW()) in days
            ├── Calculate days_in_cycle = billing_interval in days
            ├── Unused credit = (days_remaining / days_in_cycle) × Plan A price
            ├── Prorated charge = Plan B price − unused_credit
            ├── Create WC order for prorated amount
            ├── Charge immediately via stored gateway token
            ├── UPDATE wp_wdd_subscriptions {product_id = Plan B, price = $99}
            ├── [If Licensing] UPDATE plan_type and activation_limit
            └── next_payment_at = NOW() + billing_interval (reset cycle)

Downgrade: same logic, issue store credit for the difference instead of charging
```

Proration mode is configurable: **Prorate** (charge/credit difference) or **Next cycle** (switch takes effect at next renewal, no charge today).

---

## Database Schema

### `wp_wdd_subscriptions` (expanded)

```sql
CREATE TABLE {prefix}wdd_subscriptions (
    id                  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id             BIGINT UNSIGNED NOT NULL,
    product_id          BIGINT UNSIGNED NOT NULL,
    order_id            BIGINT UNSIGNED NOT NULL,   -- initial order
    license_id          BIGINT UNSIGNED NULL,
    saas_account_id     BIGINT UNSIGNED NULL,
    status              ENUM(
                            'trialing',
                            'active',
                            'paused',
                            'past_due',
                            'suspended',
                            'cancelled',
                            'expired'
                        ) DEFAULT 'active',
    billing_interval    INT UNSIGNED NOT NULL,       -- numeric value
    billing_period      ENUM('day','week','month','year') NOT NULL,
    recurring_amount    DECIMAL(10,2) NOT NULL,
    currency            VARCHAR(10) DEFAULT 'USD',
    signup_fee          DECIMAL(10,2) DEFAULT 0.00,
    trial_ends_at       DATETIME NULL,
    next_payment_at     DATETIME NULL,
    last_payment_at     DATETIME NULL,
    max_length_at       DATETIME NULL,              -- NULL = indefinite
    paused_at           DATETIME NULL,
    cancelled_at        DATETIME NULL,
    gateway             VARCHAR(50) NULL,           -- 'stripe', 'paypal', etc.
    gateway_subscription_id VARCHAR(255) NULL,      -- gateway's recurring ID
    retry_count         TINYINT UNSIGNED DEFAULT 0,
    starts_at           DATETIME NOT NULL,
    created_at          DATETIME NOT NULL,
    PRIMARY KEY (id),
    KEY idx_user_id (user_id),
    KEY idx_product_id (product_id),
    KEY idx_status (status),
    KEY idx_next_payment (next_payment_at),
    KEY idx_trial_ends (trial_ends_at)
);
```

### `wp_wdd_subscription_logs`

```sql
CREATE TABLE {prefix}wdd_subscription_logs (
    id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    subscription_id BIGINT UNSIGNED NOT NULL,
    event           VARCHAR(100) NOT NULL,          -- 'renewal_success', 'payment_failed', 'status_change', etc.
    old_status      VARCHAR(30) NULL,
    new_status      VARCHAR(30) NULL,
    amount          DECIMAL(10,2) NULL,
    order_id        BIGINT UNSIGNED NULL,
    note            TEXT NULL,
    created_at      DATETIME NOT NULL,
    PRIMARY KEY (id),
    KEY idx_subscription_id (subscription_id),
    KEY idx_event (event),
    KEY idx_created_at (created_at)
);
```

---

## Product Meta Fields

| Meta Key | Type | Description |
|---|---|---|
| `_wdd_sub_price` | decimal | Recurring price |
| `_wdd_sub_interval` | int | Billing interval number (e.g., 1, 2, 3) |
| `_wdd_sub_period` | string | `day`, `week`, `month`, `year` |
| `_wdd_sub_trial_length` | int | Trial period number |
| `_wdd_sub_trial_period` | string | `day`, `week`, `month` |
| `_wdd_sub_signup_fee` | decimal | One-time sign-up fee (0 = none) |
| `_wdd_sub_length` | int | Max subscription length (0 = indefinite) |
| `_wdd_sub_length_period` | string | `month`, `year` |
| `_wdd_sub_limit` | int | Max active subscriptions per customer (0 = unlimited) |
| `_wdd_sub_proration` | string | `prorated` or `next_cycle` |
| `_wdd_sub_include_shipping` | bool | Include shipping in renewal orders |
| `_wdd_sub_include_tax` | bool | Include tax in renewal orders |

---

## Configuration Options

| Option | Default | Description |
|---|---|---|
| `wdd_sub_auto_renew` | `true` | Enable automatic renewal |
| `wdd_sub_retry_attempts` | `3` | Number of failed payment retry attempts |
| `wdd_sub_retry_intervals` | `[1, 3, 5]` | Days between retries |
| `wdd_sub_overdue_days` | `7` | Days past_due before suspension |
| `wdd_sub_cancel_days` | `14` | Days past_due before cancellation |
| `wdd_sub_grace_period_days` | `0` | Days license stays active after cancel |
| `wdd_sub_proration_mode` | `prorated` | `prorated` or `next_cycle` |
| `wdd_sub_renewal_reminder_days` | `[7, 3, 1]` | Days before renewal to send reminder emails |
| `wdd_sub_allow_pause` | `true` | Allow customers to pause |
| `wdd_sub_allow_cancel` | `true` | Allow customers to self-cancel |
| `wdd_sub_allow_upgrade` | `true` | Allow customers to upgrade/downgrade |
| `wdd_sub_cancel_saas_immediately` | `false` | Suspend SaaS on cancel (vs. at period end) |

---

## REST API Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/wdd/v1/subscriptions` | manage_woocommerce | List all subscriptions |
| `GET` | `/wdd/v1/subscriptions/{id}` | manage_woocommerce | Get subscription detail |
| `POST` | `/wdd/v1/subscriptions/{id}/pause` | Customer / Admin | Pause subscription |
| `POST` | `/wdd/v1/subscriptions/{id}/resume` | Customer / Admin | Resume subscription |
| `POST` | `/wdd/v1/subscriptions/{id}/cancel` | Customer / Admin | Cancel subscription |
| `POST` | `/wdd/v1/subscriptions/{id}/renew` | manage_woocommerce | Manual renewal trigger |
| `POST` | `/wdd/v1/subscriptions/{id}/upgrade` | Customer / Admin | Upgrade/downgrade plan |
| `GET` | `/wdd/v1/subscriptions/{id}/logs` | manage_woocommerce | Get event log for subscription |

---

## Admin Panel Structure

**Digital Downloads → Subscriptions**

### List Table Columns

| Column | Description |
|---|---|
| Subscription ID | Unique ID (SUB-XXXXX) |
| Customer | Name + email |
| Product | Subscription product name |
| Status | Badge: active / paused / past_due / suspended / cancelled / expired |
| Recurring Amount | Price + billing cycle |
| Next Payment | Date of next renewal |
| Started | Start date |
| Actions | View, Cancel, Renew now |

Filterable by: status, product, date range, customer.

### Detail Page Tabs

- **Overview** — all subscription fields, status, dates
- **Payment Log** — all renewal attempts with order IDs, amounts, gateway responses
- **Status History** — every status change with timestamp and reason
- **Emails Sent** — log of all notifications sent for this subscription

### Settings Tabs (inside WDD Settings → Subscriptions)

| Tab | Key Options |
|---|---|
| General | Enable/disable, auto-renew, mixed cart |
| Billing | Retry attempts, retry intervals, overdue/suspend days |
| Renewals | Reminder days, renewal email templates |
| Upgrade/Downgrade | Proration mode, immediate vs. next-cycle |
| Customer Portal | Allow pause/cancel/upgrade from My Account |
| Notifications | Email template customization per event |
| Advanced | Cron interval, debug mode, gateway sync |

### Role-Based Access

| Capability | Admin | Shop Manager | Customer |
|---|---|---|---|
| View all subscriptions | ✅ | ✅ | ❌ |
| Change subscription status | ✅ | ✅ | ❌ |
| Trigger manual renewal | ✅ | ❌ | ❌ |
| Bulk actions | ✅ | ❌ | ❌ |
| View own subscriptions | ✅ | ✅ | ✅ |
| Pause / Resume | ✅ | ✅ | ✅ (if allowed) |
| Cancel | ✅ | ✅ | ✅ (if allowed) |
| Upgrade / Downgrade | ✅ | ✅ | ✅ (if allowed) |

---

## Developer Hooks

```php
// After subscription record is created
do_action( 'wdd_subscription_created', $subscription_id, $order_id, $product_id );

// After trial ends and first real payment occurs
do_action( 'wdd_subscription_trial_ended', $subscription_id );

// After successful renewal
do_action( 'wdd_subscription_renewed', $subscription_id, $order_id, $new_next_payment_at );

// When license is extended on renewal
do_action( 'wdd_license_renewed', $license_id, $new_expires_at );

// After payment fails (before dunning starts)
do_action( 'wdd_subscription_payment_failed', $subscription_id, $order_id, $retry_count );

// When subscription is suspended (overdue period exceeded)
do_action( 'wdd_subscription_suspended', $subscription_id );

// When subscription is cancelled
do_action( 'wdd_subscription_cancelled', $subscription_id, $cancelled_by );

// When subscription expires (fixed length)
do_action( 'wdd_subscription_expired', $subscription_id );

// When subscription is paused
do_action( 'wdd_subscription_paused', $subscription_id );

// When subscription is resumed
do_action( 'wdd_subscription_resumed', $subscription_id );

// When plan is upgraded or downgraded
do_action( 'wdd_subscription_plan_changed', $subscription_id, $old_product_id, $new_product_id, $prorated_charge );

// Filter dunning schedule (return array of days after failure)
apply_filters( 'wdd_dunning_schedule', [ 1, 3, 7, 14 ], $subscription_id );

// Filter proration calculation
apply_filters( 'wdd_proration_amount', $amount, $subscription_id, $new_product_id );

// Filter renewal order args before creation
apply_filters( 'wdd_renewal_order_args', $args, $subscription_id );
```

---

## Competitor Comparison

| Feature | WooCommerce Subscriptions ($199/yr) | SUMO Subscriptions ($49) | WP Swings (free) | woo-digital-downloads |
|---|---|---|---|---|
| WooCommerce native | ✅ | ✅ | ✅ | **✅** |
| Simple product subscriptions | ✅ | ✅ | ✅ | **✅** |
| Variable product subscriptions | ✅ | ✅ | ✅ | **✅** |
| Grouped product subscriptions | ✅ | ✅ | ❌ | **✅** |
| Mixed cart (sub + non-sub) | ✅ | ✅ | ❌ | **✅** |
| Multiple subs in one checkout | ✅ | ✅ | ❌ | **✅** |
| Free trial | ✅ | ✅ | ✅ (Pro) | **✅** |
| Paid trial | ✅ | ✅ | ❌ | **✅** |
| Sign-up fee | ✅ | ✅ | ✅ | **✅** |
| Billing daily/weekly/monthly/yearly | ✅ | ✅ | ✅ | **✅** |
| Max subscription length | ✅ | ✅ | ❌ | **✅** |
| Pause / Resume | ✅ | ✅ | ❌ | **✅** |
| Cancel | ✅ | ✅ | ✅ | **✅** |
| Resubscribe | ✅ | ✅ | ❌ | **✅** |
| Update payment method | ✅ | ✅ | ❌ | **✅** |
| Upgrade / Downgrade | ✅ | ✅ | ❌ | **✅** |
| Proration on upgrade | ✅ | ✅ | ❌ | **✅** |
| Auto-renewal via Stripe | ✅ | ✅ | ✅ | **✅** |
| Auto-renewal via PayPal | ✅ | ✅ | ✅ | **✅** |
| Manual renewal fallback | ✅ | ✅ | ✅ | **✅** |
| Payment retry / dunning | ✅ | ✅ configurable | ❌ (Pro) | **✅ configurable** |
| Multiple renewal reminder emails | ✅ | ✅ | ❌ | **✅** |
| Subscription logs per record | ✅ | ✅ | ❌ | **✅** |
| Bulk admin actions | ✅ | ✅ | ❌ | **✅** |
| CSV export | ✅ | ❌ | ❌ | **✅** |
| Linked to software license | ❌ | ❌ | ❌ | **✅** |
| Linked to SaaS account | ❌ | ❌ | ❌ | **✅** |
| Subscription coupon types | ✅ | ✅ (sign-up + recurring) | ❌ | **✅** |
| Drip content / downloads | ❌ | ✅ | ❌ | **✅ (Phase 4)** |
| Update subscription quantity | ✅ | ✅ | ❌ | **✅** |
| HPOS compatible | ✅ | ⚠️ | ⚠️ | **✅** |
| Single-site license only | N/A | ✅ only | N/A | **N/A (multi-site WDD)** |
| Price | $199/yr | $49 one-time | Free | **Included in WDD** |

### Key WDD Differentiators

1. **License-linked renewals** — renewal payment automatically extends software license expiry; no manual work
2. **SaaS-linked renewals** — renewal re-activates a suspended SaaS account automatically
3. **Built into WDD** — no separate plugin install, no compatibility risk with WDD modules
4. **CSV export** — SUMO Subscriptions lacks this; WC Subscriptions requires extra steps
5. **Unified admin** — subscriptions, licenses, and downloads in one admin area
