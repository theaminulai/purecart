# RND — Affiliate Program Module
**Plugin:** purecart
**Module:** Affiliate Program
**Phase:** 5
**Standalone:** Yes — works without any other PureCart module
**Third-party dependency:** None — fully built-in

---

## Overview

The Affiliate Program module is a complete, self-contained affiliate management system built directly into PureCart. Affiliates register via a dedicated page, receive a unique referral link, and earn commissions on every qualifying WooCommerce order that comes through their link. Commissions are tracked in PureCart's own DB tables, and payouts are managed from the PureCart admin panel. No external plugin or SaaS affiliate platform is required.

---

## Standalone Usage

Enable this module in **Settings → Digital Downloads → Modules → Affiliates**.

This module independently handles:
- Affiliate registration (via a shortcode-powered or block-powered page)
- Referral link generation and cookie tracking
- Commission calculation per order (percentage or flat)
- Commission approval (automatic or manual)
- Payout tracking and export (PayPal email or bank info stored per affiliate)
- Affiliate dashboard in WordPress My Account
- Admin panel: approve affiliates, view commissions, manage payouts

No external plugin is required.

---

## Architecture

### Classes

| Class | File | Responsibility |
|---|---|---|
| `AffiliateManager` | `includes/Affiliates/AffiliateManager.php` | Register, approve, suspend affiliates |
| `ReferralTracker` | `includes/Affiliates/ReferralTracker.php` | Cookie set/read, order attribution |
| `CommissionEngine` | `includes/Affiliates/CommissionEngine.php` | Calculate and record commissions |
| `PayoutManager` | `includes/Affiliates/PayoutManager.php` | Track, approve, and export payouts |
| `AffiliateDashboard` | `includes/Affiliates/AffiliateDashboard.php` | My Account tab for affiliates |

---

## Affiliate Lifecycle

```
Affiliate visits /affiliate-registration/ page
    │
    └── AffiliateManager::register()
            INSERT wp_purecart_affiliates {user_id, status: pending, code: random 8-char slug}
            [If auto-approve enabled] → status: 'active', send welcome email

Admin approves affiliate
    │
    └── AffiliateManager::approve($affiliate_id)
            UPDATE status = 'active'
            Send approval email with referral link

Affiliate shares referral link: https://store.com/?ref={code}

Visitor lands on store via referral link
    │
    └── ReferralTracker::on_init()
            IF ?ref={code} in URL AND affiliate is active:
                Set cookie: purecart_affiliate_ref = {code}
                TTL: purecart_cookie_days (default: 30 days)
                Respect last-click attribution

Visitor places order
    │
    └── CommissionEngine::on_order_completed($order_id)
            ├── Read cookie: purecart_affiliate_ref
            ├── Find affiliate by code → get commission rate
            ├── Calculate commission: order_total × rate (or flat amount)
            ├── INSERT wp_purecart_commissions {affiliate_id, order_id, amount, status: pending}
            ├── [If auto-approve enabled] → status: 'approved'
            └── Fire: do_action('purecart_commission_created', $commission_id, $affiliate_id)

Admin runs payout
    │
    └── PayoutManager::create_payout($affiliate_id, $period)
            ├── Sum all approved commissions for affiliate in period
            ├── INSERT wp_purecart_payouts {affiliate_id, amount, status: pending}
            ├── Export CSV with PayPal emails for bulk payment
            └── Mark commissions as 'paid'
```

---

## Referral Cookie & Attribution

```php
// ReferralTracker::set_cookie()
setcookie(
    'purecart_affiliate_ref',
    sanitize_text_field( $affiliate_code ),
    [
        'expires'  => time() + ( $cookie_days * DAY_IN_SECONDS ),
        'path'     => '/',
        'secure'   => is_ssl(),
        'httponly' => true,
        'samesite' => 'Lax',
    ]
);
```

**Attribution model:** Last-click by default. If a visitor arrives via two different affiliate links, the most recent cookie wins. First-click attribution is available via `purecart_affiliate_attribution_model` filter.

**Self-referral prevention:** If the logged-in user is an affiliate and also the buyer, the commission is not recorded (configurable via `purecart_allow_self_referral` option, default: false).

---

## Commission Rules

Commissions are configured at three levels (highest specificity wins):

1. **Per-product override** — set on individual WooCommerce products via PureCart meta box
2. **Per-affiliate override** — set in affiliate profile (admin-only)
3. **Global default** — set in Settings → Digital Downloads → Affiliates

| Rule | Example |
|---|---|
| Percentage of order subtotal | 30% |
| Flat amount per order | $10.00 |
| Percentage on first order only | 50% first, 20% recurring |
| Recurring subscription commissions | Earn on every renewal |

```php
// CommissionEngine::calculate($order_id, $affiliate_id)
$rate = apply_filters( 'purecart_commission_rate', $global_rate, $affiliate_id, $order_id );
$base = $order->get_subtotal();  // excl. shipping, excl. tax (configurable)
return round( $base * $rate, 2 );
```

---

## Referral Link Format

```
https://store.com/?ref={code}
```

Affiliates can append `?ref={code}` to any page on the store. The cookie is set on any page load regardless of which page they land on.

Pretty permalink option (configurable):
```
https://store.com/ref/{code}/
```

Enabled via a custom rewrite rule in `AffiliateManager::register_rewrite_rules()`.

---

## Database Tables

### `wp_purecart_affiliates`

```sql
CREATE TABLE {prefix}purecart_affiliates (
    id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id         BIGINT UNSIGNED NOT NULL UNIQUE,
    affiliate_code  VARCHAR(20) NOT NULL UNIQUE,
    status          ENUM('pending','active','suspended','rejected') DEFAULT 'pending',
    commission_rate DECIMAL(5,4) DEFAULT NULL,  -- NULL = use global default
    commission_type ENUM('percent','flat') DEFAULT 'percent',
    payout_method   ENUM('paypal','bank','manual') DEFAULT 'paypal',
    payout_email    VARCHAR(255) DEFAULT NULL,
    total_earned    DECIMAL(10,2) DEFAULT 0.00,
    total_paid      DECIMAL(10,2) DEFAULT 0.00,
    total_clicks    BIGINT UNSIGNED DEFAULT 0,
    total_orders    BIGINT UNSIGNED DEFAULT 0,
    notes           TEXT DEFAULT NULL,
    created_at      DATETIME NOT NULL,
    PRIMARY KEY (id),
    KEY idx_code (affiliate_code),
    KEY idx_status (status),
    KEY idx_user_id (user_id)
);
```

### `wp_purecart_commissions`

```sql
CREATE TABLE {prefix}purecart_commissions (
    id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    affiliate_id    BIGINT UNSIGNED NOT NULL,
    order_id        BIGINT UNSIGNED NOT NULL,
    product_id      BIGINT UNSIGNED DEFAULT NULL,
    amount          DECIMAL(10,2) NOT NULL,
    currency        VARCHAR(10) DEFAULT 'USD',
    rate            DECIMAL(5,4) NOT NULL,
    status          ENUM('pending','approved','rejected','paid','reversed') DEFAULT 'pending',
    created_at      DATETIME NOT NULL,
    approved_at     DATETIME DEFAULT NULL,
    paid_at         DATETIME DEFAULT NULL,
    PRIMARY KEY (id),
    KEY idx_affiliate_id (affiliate_id),
    KEY idx_order_id (order_id),
    KEY idx_status (status),
    KEY idx_created_at (created_at)
);
```

### `wp_purecart_affiliate_clicks`

```sql
CREATE TABLE {prefix}purecart_affiliate_clicks (
    id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    affiliate_id    BIGINT UNSIGNED NOT NULL,
    ip_address      VARCHAR(45) NOT NULL,
    user_agent      VARCHAR(255) DEFAULT NULL,
    landing_url     VARCHAR(500) DEFAULT NULL,
    clicked_at      DATETIME NOT NULL,
    PRIMARY KEY (id),
    KEY idx_affiliate_id (affiliate_id),
    KEY idx_clicked_at (clicked_at)
);
```

### `wp_purecart_payouts`

```sql
CREATE TABLE {prefix}purecart_payouts (
    id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    affiliate_id    BIGINT UNSIGNED NOT NULL,
    amount          DECIMAL(10,2) NOT NULL,
    currency        VARCHAR(10) DEFAULT 'USD',
    status          ENUM('pending','completed','failed') DEFAULT 'pending',
    payout_method   VARCHAR(50) DEFAULT NULL,
    transaction_ref VARCHAR(255) DEFAULT NULL,
    period_start    DATE NOT NULL,
    period_end      DATE NOT NULL,
    created_at      DATETIME NOT NULL,
    completed_at    DATETIME DEFAULT NULL,
    PRIMARY KEY (id),
    KEY idx_affiliate_id (affiliate_id),
    KEY idx_status (status)
);
```

---

## REST API Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/purecart/v1/affiliates/register` | Public | Submit affiliate registration |
| `GET` | `/purecart/v1/affiliates` | manage_woocommerce | List all affiliates |
| `GET` | `/purecart/v1/affiliates/{id}` | manage_woocommerce | Get single affiliate |
| `POST` | `/purecart/v1/affiliates/{id}/approve` | manage_woocommerce | Approve affiliate |
| `POST` | `/purecart/v1/affiliates/{id}/suspend` | manage_woocommerce | Suspend affiliate |
| `GET` | `/purecart/v1/affiliates/{id}/commissions` | manage_woocommerce | Get affiliate commissions |
| `POST` | `/purecart/v1/commissions/{id}/approve` | manage_woocommerce | Approve a commission |
| `GET` | `/purecart/v1/payouts` | manage_woocommerce | List payouts |
| `POST` | `/purecart/v1/payouts/generate` | manage_woocommerce | Generate payout batch for a period |

---

## Admin Dashboard

**Digital Downloads → Affiliates**

Tabs:
- **Affiliates** — list all affiliates with status, total earned, total paid, conversion rate
- **Commissions** — list all commissions with approve/reject actions, bulk approve
- **Payouts** — generate payout batch by date range, export CSV (PayPal Mass Pay format)
- **Settings** — commission rates, cookie duration, registration fields, auto-approve toggle

---

## Affiliate My Account Dashboard

New tab added to WooCommerce My Account: **My Affiliate Account**

Displays:
- Unique referral link (click to copy)
- Stats: total clicks, total orders, total earned, total paid, pending balance
- Commissions table (order ID, date, amount, status)
- Payout history
- Payout method settings (PayPal email)

Shortcode for standalone page: `[purecart_affiliate_dashboard]`

---

## Configuration Options

| Option | Default | Description |
|---|---|---|
| Enable affiliates | Off | Master toggle |
| Auto-approve registrations | Off | Approve immediately on signup |
| Default commission rate | 30% | Global fallback |
| Default commission type | percent | percent or flat |
| Cookie duration | 30 days | How long referral cookie persists |
| Attribution model | last-click | last-click or first-click |
| Allow self-referrals | Off | Affiliate buying their own referral |
| Commission on subtotal | On | Exclude shipping and tax from base |
| Commission on renewals | Off | Earn on subscription renewals |
| Minimum payout threshold | $50 | Minimum balance before payout |
| Auto-approve commissions | Off | Approve commissions immediately |
| Commission reversal on refund | On | Reverse commission if order refunded |

---

## Developer Hooks

```php
// Fired after affiliate registration
do_action( 'purecart_affiliate_registered', $affiliate_id, $user_id );

// Fired after affiliate is approved
do_action( 'purecart_affiliate_approved', $affiliate_id );

// Fired after commission is created
do_action( 'purecart_commission_created', $commission_id, $affiliate_id, $order_id );

// Fired after commission is approved
do_action( 'purecart_commission_approved', $commission_id );

// Fired after commission is reversed (on refund)
do_action( 'purecart_commission_reversed', $commission_id, $order_id );

// Fired after payout batch is created
do_action( 'purecart_payout_created', $payout_id, $affiliate_id, $amount );

// Filter: commission rate for a specific order
apply_filters( 'purecart_commission_rate', $rate, $affiliate_id, $order_id );

// Filter: commission base amount (e.g., exclude specific products)
apply_filters( 'purecart_commission_base', $order_subtotal, $order_id, $affiliate_id );

// Filter: whether to record commission (return false to skip)
apply_filters( 'purecart_should_record_commission', true, $order_id, $affiliate_id );
```

---

## Competitor Comparison

| Feature | AffiliateWP ($149/yr) | SUMO Affiliates Pro ($49) | Solid Affiliate ($149/yr) | purecart |
|---|---|---|---|---|
| Built into plugin (no install) | ❌ Separate plugin | ❌ Separate plugin | ❌ Separate plugin | **✅ Built-in** |
| Third-party dependency | ❌ Required | ❌ Required | ❌ Required | **✅ None** |
| Affiliate registration | ✅ | ✅ | ✅ | **✅** |
| Referral link + cookie tracking | ✅ | ✅ | ✅ | **✅** |
| Percentage + flat commissions | ✅ | ✅ | ✅ | **✅** |
| Per-product commission rates | ✅ | ✅ | ✅ | **✅** |
| Recurring/subscription commissions | ✅ (add-on) | ✅ | ✅ | **✅ Built-in** |
| Manual commission approval | ✅ | ✅ | ✅ | **✅** |
| Payout management + CSV export | ✅ | ✅ | ✅ | **✅** |
| Affiliate My Account dashboard | ✅ | ✅ | ✅ | **✅** |
| Commission reversal on refund | ✅ | ✅ | ✅ | **✅** |
| WooCommerce native | ✅ | ✅ | ✅ | **✅** |
| Self-referral prevention | ✅ | ✅ | ✅ | **✅** |
| Attribution model options | ✅ | Partial | ✅ | **✅ last/first-click** |
| Price | $149/yr | $49 one-time | $149/yr | **✅ Included in PureCart** |
