# RND — Abandoned Cart Recovery Module
**Plugin:** purecart
**Module:** Abandoned Cart Recovery
**Phase:** 5
**Standalone:** Yes — works without any other PureCart module
**Third-party dependency:** None — fully built-in

---

## Overview

The Abandoned Cart Recovery module is a complete, self-contained cart recovery system built directly into PureCart. It detects when a cart containing WDD products is abandoned, saves the cart state to a dedicated DB table, and sends a configurable sequence of recovery emails using WooCommerce's own email engine. No external plugin, service, or API is required.

When the customer returns via the recovery link, their cart is restored automatically and a coupon (optionally auto-generated) can be applied.

---

## Standalone Usage

Enable this module in **Settings → Digital Downloads → Modules → Abandoned Cart**.

This module independently:
- Monitors WooCommerce cart sessions for any product (not just PureCart types)
- Detects abandonment after a configurable inactivity window (default: 60 min)
- Persists cart data in `wp_purecart_abandoned_carts`
- Sends up to 3 recovery emails via `wp_mail()` using WooCommerce HTML email templates
- Generates one-click cart-restore links (cryptographically signed)
- Tracks recovery rate per campaign
- Optionally auto-generates and applies WooCommerce discount coupons in recovery emails

No other PureCart module, no third-party plugin, and no external email service are required.

---

## Architecture

### Classes

| Class | File | Responsibility |
|---|---|---|
| `CartWatcher` | `includes/AbandonedCart/CartWatcher.php` | Detect and record abandoned carts |
| `CartRestorer` | `includes/AbandonedCart/CartRestorer.php` | Restore cart from recovery link |
| `RecoveryEmailer` | `includes/AbandonedCart/RecoveryEmailer.php` | Send sequenced recovery emails |
| `RecoveryCoupon` | `includes/AbandonedCart/RecoveryCoupon.php` | Auto-generate WC discount coupons |
| `AbandonedCartReport` | `includes/AbandonedCart/AbandonedCartReport.php` | Track and report recovery rate |

---

## Abandonment Detection Flow

```
WooCommerce session updated (customer adds to cart)
    │
    └── CartWatcher::on_cart_updated()
            ├── If cart is empty → skip
            ├── If order was just placed → mark recovered, stop sequence
            └── Upsert wp_purecart_abandoned_carts
                    {session_id, user_id, email, cart_contents, cart_total, status: 'active'}

Action Scheduler: purecart_scan_abandoned_carts (every 15 min)
    │
    └── CartWatcher::scan()
            SELECT carts where:
                status = 'active'
                AND last_activity < NOW() - INTERVAL {timeout} MINUTE
                AND customer_email IS NOT NULL
            │
            └── For each qualifying cart:
                    UPDATE status = 'abandoned'
                    Schedule RecoveryEmailer::send_sequence(cart_id)
```

---

## Recovery Email Sequence

Three emails sent via Action Scheduler, using WooCommerce's HTML email infrastructure:

| Step | Delay | Subject (customizable) | Coupon |
|---|---|---|---|
| Email 1 | 1 hour after abandonment | "You left something behind!" | Optional (configurable %) |
| Email 2 | 24 hours after abandonment | "Still thinking it over?" | Optional (higher %) |
| Email 3 | 72 hours after abandonment | "Last chance — your cart expires soon" | Optional (highest %) |

Each email contains:
- Cart item summary (product name, price, thumbnail)
- **One-click restore link** — signed URL that restores the exact cart in one click
- Coupon code (if enabled), auto-applied on cart restore
- Unsubscribe link (GDPR-compliant opt-out stored in DB)

### Email Template Override

Templates follow WooCommerce's override convention:

```
your-theme/
└── woocommerce/
    └── emails/
        ├── purecart-abandoned-cart-1.php
        ├── purecart-abandoned-cart-2.php
        └── purecart-abandoned-cart-3.php
```

---

## Cart Restore Link

```
https://store.com/?purecart_restore={signed_token}
```

`CartRestorer::generate_restore_token()` creates a 64-char hex token stored in DB:

```php
$token = bin2hex( random_bytes( 32 ) ); // 64 hex chars
// Stored in wp_purecart_abandoned_carts.restore_token
// Expires: 7 days after abandonment (configurable)
```

`CartRestorer::handle_restore()` runs on `init`:
1. Validate token exists and is not expired
2. Load cart contents from DB
3. Clear current WC session cart
4. Add all items back via `WC()->cart->add_to_cart()`
5. Auto-apply coupon if configured
6. Redirect to checkout
7. Mark cart as `recovered` in DB

---

## Auto-Generated Coupons

`RecoveryCoupon::create()` generates a WooCommerce coupon programmatically:

```php
$coupon = new WC_Coupon();
$coupon->set_code( 'PURECART-RECOVER-' . strtoupper( wp_generate_password( 8, false ) ) );
$coupon->set_discount_type( 'percent' );           // or 'fixed_cart'
$coupon->set_amount( $discount_percent );
$coupon->set_usage_limit( 1 );                    // single use
$coupon->set_usage_limit_per_user( 1 );
$coupon->set_date_expires( time() + ( 7 * DAY_IN_SECONDS ) );
$coupon->set_individual_use( true );
$coupon->save();
```

Coupon is embedded in the recovery email and auto-applied on restore link click.

---

## Database Table

### `wp_purecart_abandoned_carts`

```sql
CREATE TABLE {prefix}purecart_abandoned_carts (
    id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    session_id      VARCHAR(255) NOT NULL,
    user_id         BIGINT UNSIGNED DEFAULT 0,
    customer_email  VARCHAR(255) DEFAULT NULL,
    customer_name   VARCHAR(255) DEFAULT NULL,
    cart_contents   LONGTEXT NOT NULL,              -- JSON serialized cart
    cart_total      DECIMAL(10,2) DEFAULT 0.00,
    currency        VARCHAR(10) DEFAULT 'USD',
    status          ENUM(
                        'active',           -- cart is live, not yet abandoned
                        'abandoned',        -- inactivity threshold crossed
                        'email_1_sent',
                        'email_2_sent',
                        'email_3_sent',
                        'recovered',        -- order placed after abandon
                        'unsubscribed'      -- customer opted out
                    ) DEFAULT 'active',
    restore_token   CHAR(64) DEFAULT NULL UNIQUE,
    coupon_code     VARCHAR(100) DEFAULT NULL,
    abandoned_at    DATETIME DEFAULT NULL,
    recovered_at    DATETIME DEFAULT NULL,
    restore_token_expires_at DATETIME DEFAULT NULL,
    last_activity   DATETIME NOT NULL,
    created_at      DATETIME NOT NULL,
    PRIMARY KEY (id),
    KEY idx_session (session_id),
    KEY idx_email (customer_email),
    KEY idx_status (status),
    KEY idx_abandoned_at (abandoned_at),
    KEY idx_restore_token (restore_token)
);
```

---

## REST API Endpoints (Admin)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/purecart/v1/abandoned-carts` | manage_woocommerce | List abandoned carts with filters |
| `GET` | `/purecart/v1/abandoned-carts/{id}` | manage_woocommerce | Get single cart detail |
| `POST` | `/purecart/v1/abandoned-carts/{id}/send-email` | manage_woocommerce | Manually trigger recovery email |
| `DELETE` | `/purecart/v1/abandoned-carts/{id}` | manage_woocommerce | Delete cart record |

---

## Admin Dashboard

**Digital Downloads → Abandoned Carts**

| Column | Description |
|---|---|
| Customer | Name + email |
| Cart Value | Total value |
| Products | Item names |
| Abandoned At | Date/time |
| Emails Sent | 0 / 1 / 2 / 3 |
| Status | Badge: abandoned / email_1_sent / recovered |
| Actions | Send email now, View cart, Delete |

**Recovery Stats panel (top of page):**
- Total abandoned (last 30 days)
- Total recovered
- Recovery rate %
- Revenue recovered $

---

## Configuration Options

**Settings → Digital Downloads → Abandoned Cart**

| Option | Default | Description |
|---|---|---|
| Enable module | Off | Master toggle |
| Abandonment timeout | 60 min | Inactivity before cart is "abandoned" |
| Capture guest carts | Off | Track carts before email is known |
| Email 1 — delay | 60 min | Time after abandonment |
| Email 1 — subject | "You left something behind!" | Customizable |
| Email 1 — coupon | Off | Enable auto-coupon |
| Email 1 — coupon % | 0 | Discount percentage |
| Email 2 — delay | 1440 min (24h) | |
| Email 2 — coupon % | 10 | |
| Email 3 — delay | 4320 min (72h) | |
| Email 3 — coupon % | 15 | |
| Restore link expiry | 7 days | Days before restore token expires |
| Stop sequence on purchase | On | Cancel scheduled emails if order placed |

---

## GDPR Compliance

- Unsubscribe link in every email → sets `status = 'unsubscribed'`, clears email
- WooCommerce privacy eraser hooked: erases all cart records for a user on erasure request
- IP address is never stored in cart records
- Cart data is purged after `purecart_abandoned_cart_retention_days` (default: 90 days) via scheduled cleanup

---

## Developer Hooks

```php
// Fired when a cart is first detected as abandoned
do_action( 'purecart_cart_abandoned', $cart_id, $user_id, $customer_email, $cart_total );

// Fired after each recovery email is sent
do_action( 'purecart_cart_recovery_email_sent', $cart_id, $email_step, $customer_email );

// Fired when cart is restored from recovery link
do_action( 'purecart_cart_restored', $cart_id, $user_id );

// Fired when cart is recovered (order placed)
do_action( 'purecart_cart_recovered', $cart_id, $order_id );

// Filter: modify cart restore token expiry (seconds)
apply_filters( 'purecart_cart_restore_token_expiry', 7 * DAY_IN_SECONDS, $cart_id );

// Filter: modify coupon amount per email step
apply_filters( 'purecart_cart_recovery_coupon_amount', $amount, $step, $cart_id );

// Filter: skip email for a specific cart
apply_filters( 'purecart_cart_recovery_skip_email', false, $cart_id, $step );
```

---

## Competitor Comparison

| Feature | Cart Abandonment Recovery (Brainstorm Force) | WooCommerce Abandoned Cart (Tychesoftwares) | CartBounty | purecart |
|---|---|---|---|---|
| Built into plugin (no install) | ❌ Separate plugin | ❌ Separate plugin | ❌ Separate plugin | **✅ Built-in** |
| Third-party dependency | ❌ Required | ❌ Required | ❌ Required | **✅ None** |
| WC email infrastructure | ✅ | ✅ | ✅ | **✅** |
| Auto-coupon generation | ✅ | ✅ (Pro) | ✅ (Pro) | **✅ Built-in** |
| One-click cart restore | ✅ | ✅ | ✅ | **✅ Signed token** |
| Recovery rate reporting | ✅ | ✅ | ✅ | **✅ Built-in** |
| GDPR unsubscribe | ✅ | ✅ | ✅ | **✅ Built-in** |
| Action Scheduler | ✅ | ✅ | ❌ | **✅** |
| Guest cart capture | ✅ | ✅ | ✅ | **✅ Optional** |
| Configurable email sequence | 3 emails | 3 emails (Pro) | 3 emails (Pro) | **✅ 3 emails** |
| Price | Free | Free / Pro | Free / Pro | **✅ Included in PureCart** |
