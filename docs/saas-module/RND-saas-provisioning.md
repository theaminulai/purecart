# RND — SaaS Provisioning Module
**Plugin:** purecart
**Module:** SaaS Provisioning
**Phase:** 2
**Standalone:** Yes — works without Licensing or Downloads modules

---

## Overview

The SaaS Provisioning module automates the process of creating, suspending, and cancelling customer accounts on your SaaS platform when orders are placed or subscriptions change in WooCommerce. On order completion, it fires an outbound webhook to your platform's provisioning endpoint and generates a `purecart_` prefixed API key. On refund or subscription cancellation, it fires a suspend webhook automatically. JWT tokens are issued for SaaS login flows.

### Problem It Solves
- Manually creating SaaS accounts for each order is error-prone and unscalable
- WooCommerce has no native concept of external account provisioning
- No existing WooCommerce solution issues JWT tokens for SaaS authentication
- Webhook signatures need to be verified to prevent spoofing

---

## Standalone Usage

Enable this module alone to:
- Automatically provision SaaS accounts when customers buy `purecart_saas` products
- Issue and manage API keys for customers
- Issue JWT tokens for SaaS login
- Suspend accounts on refund or subscription failure
- Track all SaaS accounts in a dedicated DB table

No Licensing or Plugin Updates module required.

---

## Architecture

### Classes

| Class | File | Responsibility |
|---|---|---|
| `AccountProvisioner` | `includes/SaaS/AccountProvisioner.php` | Create/suspend/activate SaaS accounts |
| `PlanSyncer` | `includes/SaaS/PlanSyncer.php` | Sync WooCommerce plan changes to SaaS |
| `ApiKeyManager` | `includes/SaaS/ApiKeyManager.php` | Generate and revoke API keys |
| `JwtIssuer` | `includes/SaaS/JwtIssuer.php` | Issue short-lived JWT access tokens |

### Provisioning Flow

```
Order Completed — product type is purecart_saas
    │
    └── OrderHandler::provision_saas()
            ├── Check _purecart_provisioned order meta → skip if already done
            ├── AccountProvisioner::provision([
            │       user_id, order_id, product_id, plan => _purecart_saas_plan meta
            │   ])
            │       ├── Generate API key: 'purecart_' . bin2hex(random_bytes(24))
            │       ├── INSERT wp_purecart_saas_accounts
            │       ├── AccountProvisioner::fire_webhook('provision', $account_data)
            │       │       POST to purecart_saas_webhook_url option
            │       │       Header: X-PureCart-Sig: sha256=HMAC(secret, payload)
            │       └── Send access email with API key to customer
            └── SET _purecart_provisioned = 1 on order (prevents double-provisioning)

Order Refunded
    │
    └── OrderHandler::on_order_refunded()
            └── AccountProvisioner::suspend(account_id)
                    ├── UPDATE wp_purecart_saas_accounts status = 'suspended'
                    └── fire_webhook('suspend', $account_data)

Subscription Cancelled (via DunningManager or customer)
    │
    └── AccountProvisioner::suspend(account_id)
```

---

## Database Table

### wp_purecart_saas_accounts
```sql
CREATE TABLE wp_purecart_saas_accounts (
    id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id        BIGINT UNSIGNED NOT NULL,
    order_id       BIGINT UNSIGNED NOT NULL,
    product_id     BIGINT UNSIGNED NOT NULL,
    plan           VARCHAR(50),           -- e.g. 'starter', 'pro', 'enterprise'
    api_key        VARCHAR(128) UNIQUE,   -- purecart_ prefix + 48 hex chars
    status         ENUM('active','suspended','cancelled') DEFAULT 'active',
    provisioned_at DATETIME NOT NULL,
    PRIMARY KEY (id),
    KEY idx_user_product (user_id, product_id),
    KEY idx_api_key (api_key),
    KEY idx_status (status)
);
```

---

## REST API Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/purecart/v1/saas/provision` | manage_woocommerce | Manually provision an account (admin) |
| `POST` | `/purecart/v1/saas/suspend` | manage_woocommerce | Suspend an account (admin) |
| `POST` | `/purecart/v1/saas/activate` | manage_woocommerce | Re-activate a suspended account |
| `GET` | `/purecart/v1/saas/usage/{api_key}` | API key | Get usage stats for the account |
| `POST` | `/purecart/v1/saas/token` | API key | Issue a JWT access token |

---

## API Key Format

```php
// ApiKeyManager::generate()
$api_key = 'purecart_' . bin2hex( random_bytes( 24 ) );
// Length: 4 (prefix) + 48 (hex) = 52 characters
// Example: purecart_a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4
```

API keys are stored in `wp_purecart_saas_accounts.api_key` and displayed to customers in the My Account → API Keys tab. Customers can rotate their API key (which fires the webhook with the new key value).

---

## Outbound Webhook

When a provisioning event occurs, PureCart fires a POST request to the URL configured in Settings → PureCart → SaaS:

### Webhook Payload

```json
POST https://your-saas-platform.com/webhooks/purecart
Content-Type: application/json
X-PureCart-Sig: sha256=<HMAC-SHA256 of raw body using purecart_saas_webhook_secret>

{
  "event": "provision",
  "account_id": 42,
  "user_id": 123,
  "order_id": 456,
  "product_id": 789,
  "plan": "pro",
  "api_key": "purecart_a1b2c3d4...",
  "email": "customer@example.com",
  "name": "John Doe",
  "timestamp": "2026-06-24T12:00:00Z"
}
```

### Events

| Event | Trigger |
|---|---|
| `provision` | Order completed for purecart_saas product |
| `suspend` | Order refunded or subscription payment failed (day 7 of dunning) |
| `activate` | Subscription renewal payment succeeds after suspension |
| `cancel` | Subscription cancelled permanently |
| `plan_change` | Customer upgrades or downgrades plan |

### Signature Verification (Your SaaS Platform)

```php
// Verify on your SaaS platform:
$received_sig = $_SERVER['HTTP_X_PURECART_SIG']; // 'sha256=...'
$raw_body     = file_get_contents('php://input');
$secret       = 'your_configured_webhook_secret';
$expected     = 'sha256=' . hash_hmac( 'sha256', $raw_body, $secret );

if ( ! hash_equals( $expected, $received_sig ) ) {
    http_response_code(401);
    exit;
}
```

---

## JWT Issuance

PureCart uses `firebase/php-jwt` directly — no WordPress JWT plugin dependency.

```php
// JwtIssuer::issue( int $user_id, string $api_key ): string
$payload = [
    'iss'  => home_url(),
    'iat'  => time(),
    'nbf'  => time(),
    'exp'  => time() + 600,   // 10 minutes
    'data' => [
        'user_id' => $user_id,
        'api_key' => $api_key,
        'plan'    => $account->plan,
    ],
];
$token = JWT::encode( $payload, get_option('purecart_jwt_secret'), 'HS256' );
```

**Token properties:**
- Algorithm: HS256
- Access token expiry: 10 minutes (configurable)
- Secret: stored in `purecart_jwt_secret` wp_options key (auto-generated on activation)
- Refresh tokens: 30-day, stored server-side in wp_options keyed by user + device

**Issue a token:**
```
POST /wp-json/purecart/v1/saas/token
{
  "api_key": "purecart_a1b2c3d4..."
}

Response:
{
  "access_token": "eyJ0...",
  "expires_in": 600,
  "refresh_token": "abc123...",
  "refresh_expires_in": 2592000
}
```

---

## Configuration Options

| Option | Default | Description |
|---|---|---|
| `purecart_saas_webhook_url` | `''` | URL of your SaaS provisioning endpoint |
| `purecart_saas_webhook_secret` | auto-generated | HMAC secret for webhook signature |
| `purecart_jwt_secret` | auto-generated | JWT signing key |
| `purecart_jwt_expiry_seconds` | `600` | Access token lifetime (seconds) |
| `purecart_jwt_refresh_expiry_seconds` | `2592000` | Refresh token lifetime (30 days) |
| `purecart_saas_access_email` | `true` | Send API key email to customer on provision |

---

## My Account Integration

The API Keys tab (`/my-account/purecart-api-keys/`) shows:
- Product name
- Plan tier
- API key (click to copy)
- Status badge (active / suspended / cancelled)
- Rotate Key button

---

## Developer Hooks

```php
// Before provisioning — return WP_Error to abort
apply_filters( 'purecart_pre_saas_provision', null, $user_id, $product_id, $order_id );

// After account provisioned
do_action( 'purecart_saas_account_provisioned', $account_id, $user_id, $product_id );

// After account suspended
do_action( 'purecart_saas_account_suspended', $account_id );

// After account re-activated
do_action( 'purecart_saas_account_activated', $account_id );

// Filter webhook payload before sending
apply_filters( 'purecart_saas_webhook_payload', $payload, $event, $account_id );

// Filter JWT payload before signing
apply_filters( 'purecart_jwt_payload', $payload, $user_id, $api_key );

// After API key is rotated
do_action( 'purecart_api_key_rotated', $account_id, $new_api_key );
```

---

## Competitor Comparison

| Feature | WooCommerce Native | SureCart | EDD | purecart |
|---|---|---|---|---|
| SaaS account auto-provisioning | ❌ None | ✅ Partial (SaaS backend) | ❌ None | **✅ Full webhook-based** |
| API key generation | ❌ | ❌ | ❌ | **✅ `purecart_` prefix + 48 hex chars** |
| JWT token issuance | ❌ | ❌ | ❌ | **✅ HS256, firebase/php-jwt** |
| Outbound webhook on provision | ❌ | ✅ (their infra) | ❌ | **✅ HMAC-SHA256 signed** |
| Outbound webhook on refund/cancel | ❌ | ✅ | ❌ | **✅ Automatic** |
| Plan upgrade/downgrade sync | ❌ | ✅ | ❌ | **✅ `plan_change` webhook event** |
| Self-hosted (data stays on your server) | ✅ | ❌ SaaS backend | ✅ | **✅** |
| WooCommerce native | ✅ | ❌ Replaces WC | ❌ | **✅** |
| Refresh tokens (server-side) | ❌ | ❌ | ❌ | **✅ 30-day refresh** |
| Account status in My Account | ❌ | ✅ | ❌ | **✅ API Keys tab** |
| Double-provisioning prevention | ❌ | ✅ | ❌ | **✅ `_purecart_provisioned` meta guard** |

---

## JWT Library Decision

Two WordPress JWT plugins were evaluated:

| | jwt-auth (usefulteam) | JWT Auth for WP REST API (tmeister) |
|---|---|---|
| Installs | 6,000+ | 60,000+ |
| Refresh tokens (free) | Yes | No — Pro required |
| Last updated | 2+ years ago | 4 months ago |
| WP 7.x tested | No (WP 6.5 only) | No (WP 6.9 only) |
| Namespace conflicts | Risk | Risk |

**Decision: Use `firebase/php-jwt` directly** in `JwtIssuer.php`. Reasons:
1. Avoids namespace conflicts (both plugins use the same library internally)
2. No plugin-level dependency risk
3. Full control over token structure, expiry, and refresh logic
4. `firebase/php-jwt` is already a Composer dependency in `composer.json`
