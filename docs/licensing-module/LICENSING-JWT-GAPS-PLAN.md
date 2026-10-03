# PureCart — Licensing & JWT Gap Features: End-to-End Implementation Plan

**Audit basis:** Comparison against software-license-manager, license-manager-for-woocommerce,
digital-license-manager, jwt-authentication-for-wp-rest-api, jwt-auth, cocart-jwt-authentication (October 2026)  
**Branch convention:** one branch per feature, cut from `development`  
**Done criteria (PHP):** `composer cs` zero errors  
**Done criteria (src/):** `npx tsc --noEmit` + `npm run lint:js` + `npm run lint:css` + `npm run build`

---

## What PureCart Already Has (Confirmed)

**Licensing**
- Single-key generation per order (fixed `XXXXXX-XXXXXX-XXXXXX-XXXXXX` hex format)
- Domain activation / deactivation with environment tags (production / staging / local)
- Staging environments exempt from activation limit
- Per-product activation limit with `activated_count` tracking
- Status lifecycle: `active` / `expired` / `revoked` / `suspended`
- Expiry extension on subscription renewal
- Activation reset, duplicate-license, and bulk-revoke admin actions
- License-purchased email
- My Account `/purecart-licenses` tab with reveal / copy / activate form
- Admin REST API: list, get, extend, suspend, reinstate, revoke, reset-activations, duplicate, bulk-revoke, export-CSV
- CLI commands (`LicenseCommands`)

**JWT (license-scoped tokens)**
- HS256 access + refresh token pair issued on activation
- Refresh token tracked in DB with JTI
- All tokens revoked on license revoke / expire
- Rate-limited refresh
- Token cleanup via Action Scheduler
- Configurable TTLs via filters
- License claims embedded in payload
- Secret auto-generated or overridden by constant

---

## Gap Summary

| # | Feature | Who has it | Priority |
|---|---|---|---|
| 1 | Refresh token rotation on use | jwt-auth, CoCart | **Critical** |
| 2 | License expiry reminder emails | DLM, SLM | High |
| 3 | Custom key format + bulk generation + CSV import | LMFWC, DLM | High |
| 4 | License transfer (reassign to another user) | LMFWC, DLM | Medium |
| 5 | Webhook events for license actions | — (unique, extends existing WebhookHandler) | Medium |
| 6 | RS256 / multiple signing algorithms | CoCart, jwt-auth | Medium |
| 7 | Access token JTI opt-in blacklist check | CoCart | Medium |
| 8 | Cookie-based refresh token + CORS | jwt-auth | Low |
| 9 | Device / user-agent tracking per activation | jwt-auth | Low |
| 10 | License meta (key-value store) | LMFWC, DLM | Low |
| 11 | Hardware fingerprint binding | SLM | Low |

---

## Feature 1 — Refresh Token Rotation on Use

### Security gap
A stolen refresh token can be used indefinitely until its 30-day expiry. Real-world JWT security requires that consuming a refresh token immediately invalidates it and issues a new one. The existing comment in `LicenseTokenIssuer` defers this deliberately — it is now time to close it.

### What to change

#### `includes/Licensing/LicenseTokenRefresher.php`
Current flow: validate refresh JTI → issue new access token → return.  
New flow:

```php
public function refresh( string $refresh_token ): array {
    // 1. Validate the incoming refresh token (existing logic).
    $claims = ( new LicenseTokenValidator() )->validate( $refresh_token, 'refresh' );

    // 2. Revoke the consumed refresh token immediately (rotation).
    ( new LicenseTokenRevoker() )->revoke_by_jti( $claims['jti'] );

    // 3. Issue a brand-new access + refresh pair.
    $license = ( new LicenseGenerator() )->get_by_id( $claims['license_id'] );
    return ( new LicenseTokenIssuer() )->issue( $license ); // returns { access_token, refresh_token, expires_in }
}
```

#### `includes/Licensing/LicenseTokenRevoker.php`
Add `revoke_by_jti( string $jti ): void`:
```php
public function revoke_by_jti( string $jti ): void {
    global $wpdb;
    $table = $wpdb->prefix . 'purecart_license_tokens';
    // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
    $wpdb->update( $table, [ 'revoked' => 1 ], [ 'jti' => $jti ], [ '%d' ], [ '%s' ] );
}
```

#### `includes/Licensing/LicenseTokenValidator.php`
`validate()` must already check `revoked = 0` in the DB for refresh tokens. Confirm this is true; add the check if missing.

#### Admin SPA impact
None — the REST endpoint shape is unchanged. Clients receive a new refresh token on every refresh call (same field name).

#### Test
1. Issue tokens for `demo_alice`'s license.
2. Call `/license/token/refresh` with the refresh token.
3. Verify: old refresh JTI is now `revoked = 1` in DB. New refresh JTI is different.
4. Re-use the old refresh token → must return `401`.

---

## Feature 2 — License Expiry Reminder Emails

### What it is
Scheduled emails to customers warning that their license will expire in N days. Configurable lead times (e.g., 30 days + 7 days before expiry).

### Backend

#### `includes/Licensing/Emails/LicenseExpiringEmail.php`
```php
namespace PureCart\Licensing\Emails;

class LicenseExpiringEmail extends \WC_Email {

    public function __construct() {
        $this->id             = 'purecart_license_expiring';
        $this->title          = __( 'License Expiring Soon', 'purecart' );
        $this->description    = __( 'Sent to customers when their license is about to expire.', 'purecart' );
        $this->template_html  = 'emails/license-expiring.php';
        $this->template_plain = 'emails/plain/license-expiring.php';
        $this->placeholders   = [
            '{license_key}'    => '',
            '{product_name}'   => '',
            '{expiry_date}'    => '',
            '{days_remaining}' => '',
            '{renewal_url}'    => '',
        ];
        parent::__construct();
    }

    public function trigger( int $license_id ): void {
        $license = ( new \PureCart\Licensing\LicenseGenerator() )->get_by_id( $license_id );
        if ( ! $license || ! $license->expires_at ) { return; }

        $this->recipient = get_userdata( $license->user_id )->user_email ?? '';
        $this->placeholders['{license_key}']    = $license->license_key;
        $this->placeholders['{product_name}']   = get_the_title( $license->product_id );
        $this->placeholders['{expiry_date}']    = date_i18n( get_option( 'date_format' ), strtotime( $license->expires_at ) );
        $this->placeholders['{days_remaining}'] = (string) max( 0, (int) ceil( ( strtotime( $license->expires_at ) - time() ) / DAY_IN_SECONDS ) );
        $this->placeholders['{renewal_url}']    = wc_get_cart_url(); // or a direct product add-to-cart link

        $this->send( $this->recipient, $this->get_subject(), $this->get_content(), $this->get_headers(), [] );
    }
}
```

#### `includes/Licensing/LicenseExpiryReminder.php`
Action Scheduler job that runs daily:

```php
namespace PureCart\Licensing;

class LicenseExpiryReminder {

    public const ACTION = 'purecart_license_expiry_reminder_daily';

    public function register(): void {
        add_action( self::ACTION, [ $this, 'run' ] );
    }

    public function schedule(): void {
        if ( ! as_next_scheduled_action( self::ACTION ) ) {
            as_schedule_recurring_action( strtotime( 'tomorrow 08:00:00' ), DAY_IN_SECONDS, self::ACTION, [], 'purecart' );
        }
    }

    public function run(): void {
        global $wpdb;
        $table      = $wpdb->prefix . 'purecart_licenses';
        $lead_times = apply_filters( 'purecart_license_expiry_lead_times', [ 30, 7 ] ); // days

        foreach ( $lead_times as $days ) {
            $target_date = gmdate( 'Y-m-d', strtotime( "+{$days} days" ) );
            // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.PreparedSQL.InterpolatedNotPrepared
            $ids = $wpdb->get_col( $wpdb->prepare(
                "SELECT id FROM {$table} WHERE status = 'active' AND DATE(expires_at) = %s",
                $target_date
            ) );
            foreach ( $ids as $id ) {
                ( new \PureCart\Licensing\Emails\LicenseExpiringEmail() )->trigger( (int) $id );
            }
        }
    }
}
```

Schedule in `includes/Licensing/Module.php` via `register_activation_hook` or `init`.

#### Email templates
```
templates/emails/license-expiring.php       — HTML
templates/emails/plain/license-expiring.php — plain text
```

#### Settings
Add to Settings → Licensing:
- **Expiry reminder lead times** — comma-separated days (default: `30, 7`)
- Toggle to enable/disable reminders

#### Admin SPA
In `src/app/modules/licenses/` — the KPI strip or list view could highlight licenses expiring within 30 days with a color badge. No new page needed.

---

## Feature 3 — Custom Key Format + Bulk Generation + CSV Import

These three are architecturally coupled: the key generator uses a configurable pattern, bulk generation fills a pool, and CSV import fills the same pool.

### Step 1 — DB table: `purecart_license_pool`

```sql
CREATE TABLE {prefix}purecart_license_pool (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  product_id  BIGINT UNSIGNED NOT NULL,
  license_key VARCHAR(191)    NOT NULL UNIQUE,
  status      ENUM('available','assigned') NOT NULL DEFAULT 'available',
  created_at  DATETIME        NOT NULL,
  INDEX idx_product_available (product_id, status)
)
```

Add to `includes/Activator.php`.

### Step 2 — `includes/Licensing/KeyPattern.php`

Stores and applies per-product key format:

```php
namespace PureCart\Licensing;

class KeyPattern {

    // Default pattern: XXXXXX-XXXXXX-XXXXXX-XXXXXX (4 chunks of 6 hex chars)
    public const DEFAULT_CHUNKS    = 4;
    public const DEFAULT_LENGTH    = 6;
    public const DEFAULT_CHARSET   = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    public const DEFAULT_SEPARATOR = '-';

    public function get_for_product( int $product_id ): array {
        return [
            'prefix'    => (string) get_post_meta( $product_id, '_purecart_key_prefix', true ),
            'suffix'    => (string) get_post_meta( $product_id, '_purecart_key_suffix', true ),
            'chunks'    => (int) ( get_post_meta( $product_id, '_purecart_key_chunks', true ) ?: self::DEFAULT_CHUNKS ),
            'length'    => (int) ( get_post_meta( $product_id, '_purecart_key_length', true ) ?: self::DEFAULT_LENGTH ),
            'charset'   => (string) ( get_post_meta( $product_id, '_purecart_key_charset', true ) ?: self::DEFAULT_CHARSET ),
            'separator' => (string) ( get_post_meta( $product_id, '_purecart_key_separator', true ) ?: self::DEFAULT_SEPARATOR ),
        ];
    }

    public function generate( array $pattern ): string {
        $charset = str_split( $pattern['charset'] );
        $chunks  = [];
        for ( $c = 0; $c < $pattern['chunks']; $c++ ) {
            $chunk = '';
            for ( $i = 0; $i < $pattern['length']; $i++ ) {
                $chunk .= $charset[ random_int( 0, count( $charset ) - 1 ) ];
            }
            $chunks[] = $chunk;
        }
        return $pattern['prefix']
            . implode( $pattern['separator'], $chunks )
            . $pattern['suffix'];
    }
}
```

Update `LicenseGenerator::generate_key( int $product_id )` to use `KeyPattern`.

### Step 3 — `includes/Licensing/KeyPoolManager.php`

```php
namespace PureCart\Licensing;

class KeyPoolManager {

    /** Draw one available key from pool for a product; returns null if pool empty. */
    public function draw( int $product_id ): ?string {
        global $wpdb;
        $table = $wpdb->prefix . 'purecart_license_pool';
        // Atomic SELECT + UPDATE to prevent race conditions.
        // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
        $key = $wpdb->get_var( $wpdb->prepare(
            "SELECT license_key FROM {$table}
             WHERE product_id = %d AND status = 'available'
             ORDER BY id ASC LIMIT 1 FOR UPDATE",
            $product_id
        ) );
        if ( ! $key ) { return null; }
        // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
        $wpdb->update( $table, [ 'status' => 'assigned' ], [ 'license_key' => $key ], [ '%s' ], [ '%s' ] );
        return $key;
    }

    /** Pre-generate N keys into the pool for a product. */
    public function fill( int $product_id, int $count ): int {
        $pattern = ( new KeyPattern() )->get_for_product( $product_id );
        $table   = $wpdb->prefix . 'purecart_license_pool';
        $inserted = 0;
        for ( $i = 0; $i < $count; $i++ ) {
            $key = ( new KeyPattern() )->generate( $pattern );
            global $wpdb;
            // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
            $result = $wpdb->insert( $table, [
                'product_id'  => $product_id,
                'license_key' => $key,
                'status'      => 'available',
                'created_at'  => current_time( 'mysql' ),
            ], [ '%d', '%s', '%s', '%s' ] );
            if ( $result ) { $inserted++; }
        }
        return $inserted;
    }

    /** Import keys from an array (CSV rows). Skips duplicates. */
    public function import_keys( int $product_id, array $keys ): array {
        global $wpdb;
        $table    = $wpdb->prefix . 'purecart_license_pool';
        $imported = 0;
        $skipped  = 0;
        foreach ( $keys as $key ) {
            $key = sanitize_text_field( trim( $key ) );
            if ( ! $key ) { continue; }
            // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
            $result = $wpdb->insert( $table, [
                'product_id'  => $product_id,
                'license_key' => $key,
                'status'      => 'available',
                'created_at'  => current_time( 'mysql' ),
            ], [ '%d', '%s', '%s', '%s' ] );
            $result ? $imported++ : $skipped++;
        }
        return [ 'imported' => $imported, 'skipped' => $skipped ];
    }
}
```

Update `OrderHandler` to try `KeyPoolManager::draw()` first; fall back to `LicenseGenerator::generate_key()` if pool is empty.

### Step 4 — REST endpoints (add to `includes/API/Licenses.php`)

```
GET    /purecart/v1/licenses/pool/{product_id}          → pool stats (available, assigned, total)
POST   /purecart/v1/licenses/pool/{product_id}/generate → { count: N } → fills pool
POST   /purecart/v1/licenses/pool/{product_id}/import   → multipart CSV file → { imported, skipped }
DELETE /purecart/v1/licenses/pool/{product_id}          → clear available pool for product
```

### Step 5 — Product meta fields (key pattern)
Add to the WooCommerce product "License" tab (in `includes/Subscriptions/Product/` or dedicated product fields hook):
- Prefix / Suffix text inputs
- Chunks (integer, 1–8)
- Chunk length (integer, 4–16)
- Character set (select: Hex / Alphanumeric / Alpha / Numeric / Custom)
- Separator (text, single char)
- Live preview of generated key format

### Step 6 — Admin SPA
In `src/app/modules/licenses/`:

**`LicensePoolPanel.tsx`** — slide-over or sub-page:
- Pool stats per product (available / assigned / total count)
- "Generate Keys" — number input + button → `POST /pool/{id}/generate`
- "Import CSV" — file drop zone → `POST /pool/{id}/import` → shows `{ imported, skipped }`
- "Clear Pool" → `DELETE /pool/{id}` with confirm dialog

**Key Pattern fields** — in the product edit screen (handled in PHP product tab, not SPA).

---

## Feature 4 — License Transfer (Reassign)

### Backend

#### REST endpoint (add to `includes/API/Licenses.php`)
```
POST /purecart/v1/licenses/{id}/transfer
Body: { "user_id": 42 }
```

Handler:
```php
public function transfer_license( WP_REST_Request $request ): WP_REST_Response {
    $license_id = (int) $request->get_param( 'id' );
    $new_user   = (int) $request->get_param( 'user_id' );

    if ( ! get_userdata( $new_user ) ) {
        return new WP_REST_Response( [ 'message' => 'User not found.' ], 404 );
    }

    global $wpdb;
    $table = $wpdb->prefix . 'purecart_licenses';
    // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
    $wpdb->update( $table, [ 'user_id' => $new_user ], [ 'id' => $license_id ], [ '%d' ], [ '%d' ] );

    do_action( 'purecart_license_transferred', $license_id, $new_user );

    return new WP_REST_Response( [ 'transferred' => true ], 200 );
}
```

Permission: `manage_woocommerce` only.

### Admin SPA
In `src/app/modules/licenses/` — add **"Transfer"** to the row `ActionDropdown`:
- Opens `TransferLicenseModal.tsx` with a user-search field (async, calls WP users API).
- On confirm: `POST /licenses/{id}/transfer`.
- On success: refreshes the license list.

---

## Feature 5 — Webhook Events for License Actions

PureCart already has `includes/Subscriptions/Webhooks/WebhookHandler.php`. Extend it (or create a parallel `includes/Licensing/WebhookDispatcher.php`) to fire on license events.

### Hooks to capture (all already fired by existing code)
```php
do_action( 'purecart_license_created',    $license_id );
do_action( 'purecart_license_activated',  $license_id, $domain );
do_action( 'purecart_license_deactivated',$license_id, $domain );
do_action( 'purecart_license_revoked',    $license_id );
do_action( 'purecart_license_expired',    $license_id );
do_action( 'purecart_license_transferred',$license_id, $new_user_id );
```

### `includes/Licensing/WebhookDispatcher.php`
```php
namespace PureCart\Licensing;

class WebhookDispatcher {

    public function register(): void {
        $events = [
            'purecart_license_created',
            'purecart_license_activated',
            'purecart_license_deactivated',
            'purecart_license_revoked',
            'purecart_license_expired',
            'purecart_license_transferred',
        ];
        foreach ( $events as $event ) {
            add_action( $event, fn( ...$args ) => $this->dispatch( $event, $args ) );
        }
    }

    private function dispatch( string $event, array $args ): void {
        $license_id = (int) ( $args[0] ?? 0 );
        $license    = ( new LicenseGenerator() )->get_by_id( $license_id );
        if ( ! $license ) { return; }

        $payload = [
            'event'      => $event,
            'license_id' => $license_id,
            'license'    => (array) $license,
            'extra'      => array_slice( $args, 1 ),
        ];

        // Dispatch via the existing WebhookHandler infrastructure.
        do_action( 'purecart_webhook_dispatch', $payload );
    }
}
```

Register in `includes/Licensing/Module.php`.

---

## Feature 6 — RS256 / Multiple Signing Algorithms

### What it is
HS256 uses a shared symmetric secret — any party that verifies tokens also knows the secret and can forge tokens. RS256 uses a private key to sign and a public key to verify, so the public key can be shared safely with third-party services.

### `includes/Licensing/Jwt.php` — add algorithm support

```php
// Current: always HS256 with shared secret
// New: algorithm determined by constant

const ALGORITHM_HS256 = 'HS256';
const ALGORITHM_RS256 = 'RS256';

public static function algorithm(): string {
    return defined( 'PURECART_JWT_ALGORITHM' ) ? PURECART_JWT_ALGORITHM : self::ALGORITHM_HS256;
}

public static function sign( array $payload ): string {
    $algo = self::algorithm();
    if ( self::ALGORITHM_RS256 === $algo ) {
        return self::sign_rs256( $payload );
    }
    return self::sign_hs256( $payload );
}

private static function sign_rs256( array $payload ): string {
    $private_key = Settings::get( OptionKeys::JWT_RS256_PRIVATE_KEY );
    // Build header.payload, then openssl_sign with SHA256.
    $header    = self::base64url_encode( wp_json_encode( [ 'alg' => 'RS256', 'typ' => 'JWT' ] ) );
    $body      = self::base64url_encode( wp_json_encode( $payload ) );
    $signing   = "{$header}.{$body}";
    openssl_sign( $signing, $signature, $private_key, OPENSSL_ALGO_SHA256 );
    return "{$signing}." . self::base64url_encode( $signature );
}
```

#### Settings
Add to `includes/Settings/OptionKeys.php`:
```php
const JWT_RS256_PRIVATE_KEY = 'purecart_jwt_rs256_private_key'; // PEM
const JWT_RS256_PUBLIC_KEY  = 'purecart_jwt_rs256_public_key';  // PEM
```

Add REST endpoint `GET /purecart/v1/jwks` returning the public key in JWK Set format (for OpenID Connect / third-party verification).

---

## Feature 7 — Access Token JTI Opt-In Blacklist Check

Currently `LicenseTokenValidator::validate()` skips DB lookup (by design, for performance). Add an opt-in filter for high-security installs:

```php
// In LicenseTokenValidator::validate()
if ( apply_filters( 'purecart_jwt_check_jti', false ) ) {
    global $wpdb;
    $table   = $wpdb->prefix . 'purecart_license_tokens';
    // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
    $revoked = $wpdb->get_var( $wpdb->prepare(
        "SELECT revoked FROM {$table} WHERE jti = %s AND token_type = 'access'",
        $claims['jti']
    ) );
    if ( '1' === (string) $revoked ) {
        return new WP_Error( 'purecart_jwt_revoked', 'Token has been revoked.', [ 'status' => 401 ] );
    }
}
```

Enable via `add_filter( 'purecart_jwt_check_jti', '__return_true' )` in `wp-config.php`.

---

## Feature 8 — Cookie-Based Refresh Token + CORS

### Cookie auth
After activation, set an `HttpOnly; Secure; SameSite=Strict` cookie alongside the JSON response body:

```php
// In LicenseTokenIssuer::issue() after generating tokens:
if ( apply_filters( 'purecart_jwt_use_cookie', false ) ) {
    setcookie(
        'purecart_rt',
        $refresh_token,
        [
            'expires'  => time() + MONTH_IN_SECONDS,
            'path'     => '/wp-json/purecart/v1/license/token/refresh',
            'secure'   => is_ssl(),
            'httponly' => true,
            'samesite' => 'Strict',
        ]
    );
}
```

In `/license/token/refresh` handler: also accept `$_COOKIE['purecart_rt']` as fallback if no `Authorization: Bearer` header is present.

### CORS
In `includes/Licensing/Module.php`:
```php
if ( defined( 'PURECART_JWT_CORS_ENABLE' ) && PURECART_JWT_CORS_ENABLE ) {
    add_filter( 'rest_allowed_cors_headers', function( array $headers ): array {
        $headers[] = 'Authorization';
        $headers[] = 'X-PureCart-Token';
        return $headers;
    } );
}
```

---

## Feature 9 — Device / User-Agent Tracking

Add optional `device` and `user_agent` columns to `purecart_license_activations`:

```sql
ALTER TABLE {prefix}purecart_license_activations
    ADD COLUMN device     VARCHAR(191) NULL AFTER reported_version,
    ADD COLUMN user_agent VARCHAR(255) NULL AFTER device;
```

In `LicenseActivator::activate()`: accept optional `device` param from the REST request body; capture `$_SERVER['HTTP_USER_AGENT']` automatically.

Admin SPA: show Device column in the activations list (expandable inside the license detail view). Add **"Revoke by device"** action that calls `DELETE /licenses/{id}/activations` filtered by device.

---

## Feature 10 — License Meta (Key-Value Store)

### DB table — `purecart_license_meta`
```sql
CREATE TABLE {prefix}purecart_license_meta (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  license_id  BIGINT UNSIGNED NOT NULL,
  meta_key    VARCHAR(191)    NOT NULL,
  meta_value  LONGTEXT,
  INDEX idx_license_meta (license_id, meta_key)
)
```

### `includes/Licensing/LicenseMeta.php`
Standard `get` / `update` / `delete` API — mirrors WP's `get_post_meta` pattern.

### REST endpoints
```
GET    /purecart/v1/licenses/{id}/meta              → all meta
POST   /purecart/v1/licenses/{id}/meta              → { key, value }
PUT    /purecart/v1/licenses/{id}/meta/{key}        → { value }
DELETE /purecart/v1/licenses/{id}/meta/{key}
```

Use case: store integration-specific data (e.g., Stripe customer ID, third-party product slug) alongside the license without schema changes.

---

## Feature 11 — Hardware Fingerprint Binding

Add `hardware_id VARCHAR(191) NULL` to `purecart_license_activations`. Accept it as an optional parameter in the activate/deactivate API endpoints. When `hardware_id` is present, both `domain` and `hardware_id` must match for a deactivation call to succeed.

---

## Implementation Order

| Step | Feature | Branch | Effort |
|---|---|---|---|
| 1 | **Refresh token rotation** | `fix/jwt-token-rotation` | 1 day |
| 2 | **Expiry reminder emails** | `feature/license-expiry-reminder` | 1 day |
| 3 | **Custom key format + bulk generation + CSV import** | `feature/license-key-pool` | 3 days |
| 4 | **License transfer** | `feature/license-transfer` | 0.5 days |
| 5 | **Webhook events** | `feature/license-webhooks` | 1 day |
| 6 | **RS256 + JWKS endpoint** | `feature/jwt-rs256` | 2 days |
| 7 | **JTI opt-in check** | `fix/jwt-jti-check` | 0.5 days |
| 8 | **Cookie auth + CORS** | `feature/jwt-cookie` | 1 day |
| 9 | **Device tracking** | `feature/license-device-tracking` | 1 day |
| 10 | **License meta** | `feature/license-meta` | 1 day |
| 11 | **Hardware fingerprint** | `feature/license-hardware-id` | 0.5 days |

---

## Files Touched

### New PHP files
```
includes/Licensing/KeyPattern.php
includes/Licensing/KeyPoolManager.php
includes/Licensing/WebhookDispatcher.php
includes/Licensing/LicenseMeta.php
includes/Licensing/LicenseExpiryReminder.php
includes/Licensing/Emails/LicenseExpiringEmail.php
```

### Modified PHP files
```
includes/Activator.php                      (2 new tables: license_pool, license_meta; 2 ALTER columns)
includes/Licensing/LicenseTokenRefresher.php (rotation logic)
includes/Licensing/LicenseTokenRevoker.php   (revoke_by_jti method)
includes/Licensing/LicenseTokenValidator.php (JTI check filter)
includes/Licensing/LicenseTokenIssuer.php    (cookie opt-in)
includes/Licensing/LicenseGenerator.php      (use KeyPattern)
includes/Licensing/LicenseActivator.php      (device/hardware_id params)
includes/Licensing/Jwt.php                   (RS256 support, algorithm selector)
includes/Licensing/Module.php                (register WebhookDispatcher, ExpiryReminder, CORS)
includes/API/Licenses.php                    (transfer, pool, meta, JWKS endpoints)
includes/Settings/OptionKeys.php             (RS256 key constants, expiry lead times)
```

### New email templates
```
templates/emails/license-expiring.php
templates/emails/plain/license-expiring.php
```

### Admin SPA changes
```
src/app/modules/licenses/api.ts                           (pool, transfer, meta endpoints)
src/app/modules/licenses/components/LicensePoolPanel.tsx  (new)
src/app/modules/licenses/components/TransferLicenseModal.tsx (new)
src/app/modules/licenses/components/LicenseMetaTab.tsx    (new detail tab)
src/app/modules/licenses/components/DeviceList.tsx        (new — activations with device column)
```

---

## Done Criteria

After each feature:
```bash
composer cs
npx tsc --noEmit
npm run lint:js
npm run lint:css
npm run build
```

**Smoke tests:**
- **Token rotation:** Use refresh token → get new tokens → retry old refresh token → 401
- **Expiry reminder:** Set `expires_at = tomorrow` on a license → trigger `LicenseExpiryReminder::run()` → email arrives
- **Key pool:** Generate 10 keys for a product → place order → license key comes from pool → pool count drops by 1
- **CSV import:** Upload a CSV of 20 keys → pool count increases by 20 (minus duplicates)
- **Transfer:** Transfer license to another user → license now appears in that user's My Account
- **Webhooks:** Activate a license → registered webhook endpoint receives `purecart_license_activated` payload
- **RS256:** Set `PURECART_JWT_ALGORITHM = 'RS256'` → activate → verify token at `jwt.io` with public key
- **JWKS:** `GET /wp-json/purecart/v1/jwks` → returns `{ keys: [...] }` in JWK Set format
