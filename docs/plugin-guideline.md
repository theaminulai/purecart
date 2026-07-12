# PureCart for WooCommerce — PHP Coding Guideline

**Version 2.0 | Status: Authoritative**

This document is the single source of truth for all PHP code written in the `purecart` plugin. Every class, function, hook, database table, option key, and REST endpoint must follow these rules exactly. When a rule conflicts with preference or habit, this document wins.

---

## 1. PHP Version & Standards

- **Minimum PHP:** 8.1
- **Coding standard:** [WordPress Coding Standards (WPCS)](https://developer.wordpress.org/coding-standards/wordpress-coding-standards/php/) as the base, extended by these guidelines
- **PSR-4** autoloading via Composer
- **Strict types** declared in every file

Every PHP file in `includes/` begins with:

```php
<?php

declare(strict_types=1);
```

No closing `?>` tag in any PHP file. Ever.

---

## 2. File & Folder Structure

```
woo-digital-downloads/
├── purecart.php                       // Plugin header + bootstrap only
├── composer.json
├── composer.lock
├── vendor/                            // Composer dependencies (not edited)
├── includes/                          // All plugin PHP — PSR-4 root
│   ├── Plugin.php                     // Main plugin class, registers all modules
│   ├── Installer.php                  // Activation: creates tables, sets defaults
│   ├── Uninstaller.php                // Deactivation / uninstall cleanup
│   ├── AbstractModule.php             // Base class for all feature modules
│   ├── Contracts/
│   │   ├── ModuleInterface.php
│   │   ├── RepositoryInterface.php
│   │   └── ServiceInterface.php
│   ├── Core/
│   │   ├── Assets.php                 // Enqueues JS/CSS
│   │   ├── AdminMenu.php              // Registers WP admin menu pages
│   │   ├── RestApi.php                // Registers all REST routes
│   │   ├── ProductTypes.php           // Registers purecart_plugin, purecart_saas, purecart_bundle
│   │   └── HposCompat.php             // Declares HPOS compatibility
│   ├── Modules/
│   │   ├── Downloads/
│   │   │   ├── DownloadsModule.php
│   │   │   ├── TokenGenerator.php
│   │   │   ├── DownloadHandler.php
│   │   │   ├── DownloadRepository.php
│   │   │   └── Api/DownloadsController.php
│   │   ├── Licensing/
│   │   │   ├── LicensingModule.php
│   │   │   ├── LicenseGenerator.php
│   │   │   ├── LicenseActivator.php
│   │   │   ├── LicenseRepository.php
│   │   │   └── Api/LicenseController.php
│   │   ├── Updates/
│   │   ├── Subscriptions/
│   │   ├── SaaS/
│   │   ├── Affiliates/
│   │   ├── AbandonedCart/
│   │   ├── Security/
│   │   └── Analytics/
│   ├── Database/
│   │   ├── Migrator.php               // Runs dbDelta() for all tables
│   │   └── Schema.php                 // Table schema definitions as string constants
│   ├── Email/
│   │   ├── AbstractEmail.php
│   │   └── Emails/                    // One class per email type
│   └── Helpers/
│       ├── Crypto.php
│       ├── Format.php
│       └── RateLimiter.php
├── assets/
│   ├── js/admin.js                    // Built by @wordpress/scripts
│   └── css/admin.css
├── src/                               // React source (compiled to assets/)
├── templates/
│   └── emails/                        // Email HTML templates (plain PHP view files)
├── languages/
│   └── purecart.pot
└── docs/
```

### File Naming Rules

- One class per file
- File name exactly matches the class name: `LicenseGenerator.php` → `class LicenseGenerator`
- Directories match the sub-namespace: `Modules/Licensing/` → `namespace PureCart\Modules\Licensing`
- No `functions.php`, no `helpers.php` catch-all files — each helper class has a single purpose
- Template files: lowercase, hyphenated (`email-license-key.php`)

---

## 3. Namespace Convention

### 3.1 Root Namespace

```
PureCart
```

This is the only root namespace used in this plugin. It maps to `includes/` in `composer.json`.

```json
{
    "autoload": {
        "psr-4": {
            "PureCart\\": "includes/"
        }
    }
}
```

### 3.2 Sub-Namespace Map

| Directory | Namespace |
|---|---|
| `includes/` | `PureCart` |
| `includes/Core/` | `PureCart\Core` |
| `includes/Contracts/` | `PureCart\Contracts` |
| `includes/Database/` | `PureCart\Database` |
| `includes/Email/` | `PureCart\Email` |
| `includes/Email/Emails/` | `PureCart\Email\Emails` |
| `includes/Helpers/` | `PureCart\Helpers` |
| `includes/Modules/Downloads/` | `PureCart\Modules\Downloads` |
| `includes/Modules/Licensing/` | `PureCart\Modules\Licensing` |
| `includes/Modules/Updates/` | `PureCart\Modules\Updates` |
| `includes/Modules/Subscriptions/` | `PureCart\Modules\Subscriptions` |
| `includes/Modules/SaaS/` | `PureCart\Modules\SaaS` |
| `includes/Modules/Affiliates/` | `PureCart\Modules\Affiliates` |
| `includes/Modules/AbandonedCart/` | `PureCart\Modules\AbandonedCart` |
| `includes/Modules/Security/` | `PureCart\Modules\Security` |
| `includes/Modules/Analytics/` | `PureCart\Modules\Analytics` |

### 3.3 Namespace Rules

**MUST:**
- Declare `namespace` as the first statement after `declare(strict_types=1)` in every class file
- Use full `use` import statements at the top of the file — no inline fully-qualified class names in method bodies
- Group `use` imports in this order: (1) PHP built-ins, (2) third-party vendor, (3) PureCart classes

**MUST NOT:**
- Use `PureCart_` prefixed class names (the old non-namespaced WordPress style)
- Use the global namespace for any class in this plugin
- Create nested namespaces deeper than 3 levels (e.g., `PureCart\Modules\Licensing\Api` is fine; `PureCart\Modules\Licensing\Api\V1\Handlers` is too deep — collapse it)

---

## 4. Class Conventions

### 4.1 Naming

- **PascalCase** for all class names: `LicenseGenerator`, `DownloadHandler`, `RenewalEngine`
- Name classes after what they **do**, not what they hold — `LicenseActivator` not `LicenseData`
- Suffix conventions:

| Suffix | Purpose |
|---|---|
| `Module` | Top-level module coordinator (`LicensingModule`) |
| `Repository` | Database read/write for one table (`LicenseRepository`) |
| `Controller` | REST API endpoint handler (`LicenseController`) |
| `Generator` | Creates new records/tokens/keys (`LicenseGenerator`, `TokenGenerator`) |
| `Handler` | Processes an inbound request or event (`DownloadHandler`) |
| `Engine` | Orchestrates a business process (`RenewalEngine`, `CommissionEngine`) |
| `Manager` | CRUD facade for a feature area (`AffiliateManager`) |
| `Mailer` / `Email` | Sends email (`LicenseKeyEmail`) |
| `Report` | Aggregates analytics data (`SubscriptionReport`) |
| `ListTable` | Extends `WP_List_Table` (`LicenseListTable`) |
| `Interface` | Contracts (`RepositoryInterface`) |
| `Abstract` | Base class prefix (`AbstractModule`, `AbstractEmail`) |
| `Exception` | Custom exceptions (`LicenseNotFoundException`) |

### 4.2 Class Structure (Required Order)

Every class file follows this order:

```php
<?php

declare(strict_types=1);

namespace PureCart\Modules\Licensing;

// 1. PHP built-in use imports (if any)
use InvalidArgumentException;
use RuntimeException;

// 2. Vendor use imports
use Firebase\JWT\JWT;

// 3. PureCart use imports
use PureCart\Contracts\RepositoryInterface;
use PureCart\Helpers\Crypto;

/**
 * Generates and validates software license keys.
 *
 * @since 1.0.0
 */
class LicenseGenerator {

    // ── Constants ──────────────────────────────────────────────────────────
    private const KEY_BYTE_LENGTH = 20;
    private const GROUPS          = 5;

    // ── Properties ─────────────────────────────────────────────────────────
    private LicenseRepository $repository;
    private Crypto $crypto;

    // ── Constructor ────────────────────────────────────────────────────────
    public function __construct( LicenseRepository $repository, Crypto $crypto ) {
        $this->repository = $repository;
        $this->crypto     = $crypto;
    }

    // ── Public Methods ─────────────────────────────────────────────────────
    public function generate( int $order_id, int $product_id ): string {
        // ...
    }

    // ── Private / Protected Methods ────────────────────────────────────────
    private function format_key( string $raw ): string {
        // ...
    }
}
```

### 4.3 Class Rules

**MUST:**
- Declare all properties with type declarations (`private string $key`)
- Use constructor property promotion only when the class has 3 or fewer injected dependencies
- Use `readonly` for properties that are injected and never reassigned
- Declare class constants in `UPPER_SNAKE_CASE`
- Add a `@since` docblock to every class

**MUST NOT:**
- Use `static` properties for state — use the dependency injection container or WordPress options
- Use magic methods (`__get`, `__set`) — explicit getters/setters only
- Mix concerns inside one class — a `Repository` class must not send emails; a `Mailer` class must not touch the database directly
- Create God classes: if a class has more than ~8 public methods, split it

---

## 5. Method & Function Conventions

### 5.1 Method Naming

- **snake_case** for all method names (WordPress convention)
- **No prefix on public methods** — the PHP namespace `PureCart\` already provides uniqueness. Adding a plugin prefix to every public method is redundant and removed.
- Private and protected methods also carry no prefix — they are scoped to the class.

```php
// CORRECT
public function handle_completed_order( int $order_id ): void { }
public function generate_license( int $order_item_id ): string { }
private function build_key_string( string $raw ): string { }
protected function get_table_name(): string { }

// WRONG — missing type declarations
public function handle_completed_order( $order_id ) { }
public function generateLicense( int $order_item_id ): string { }  // camelCase — not allowed
```

Verb-first naming:

| Method name pattern | Use case |
|---|---|
| `get_*` | Returns a value without side effects |
| `set_*` | Assigns a value (setter) |
| `create_*` | Inserts a new record into the database |
| `update_*` | Updates an existing record |
| `delete_*` | Deletes a record (hard delete) |
| `revoke_*` | Soft-delete / status change to revoked |
| `cancel_*` | Status change to cancelled |
| `generate_*` | Creates a new cryptographic value (key, token) |
| `send_*` | Triggers an email or webhook |
| `validate_*` | Returns bool — checks a condition, no side effects |
| `is_*` / `has_*` | Returns bool — simple state check |
| `handle_*` | Processes an incoming event or webhook |
| `register_*` | Calls `add_action`/`add_filter` — used in `boot()` |
| `render_*` | Outputs or returns HTML |
| `export_*` | Returns data formatted for file export (CSV, JSON) |
| `boot` / `register` | Module lifecycle methods |

### 5.2 Method Signatures

- Always declare parameter types and return types
- Use nullable types (`?string`) only when `null` is a genuinely meaningful return value
- Use union types (`string|int`) sparingly — prefer a specific type
- Use `void` return type for methods that return nothing
- Use `never` return type for methods that always throw or exit

```php
// CORRECT
public function get_license( int $license_id ): ?License {
    // returns null if not found
}

public function revoke( int $license_id, string $reason ): void {
    // no return value
}

// WRONG — missing types
public function get_license( $id ) {
    // ...
}
```

### 5.3 Global Functions

Global (procedural) functions are allowed only for:
- The main plugin bootstrap in `purecart.php`
- Template helper functions in `includes/Helpers/` that are explicitly designed to be called from templates

Global functions must be prefixed `purecart_`:

```php
// Correct
function purecart_get_license( int $id ): ?array { }
function purecart_format_license_key( string $raw ): string { }

// Wrong — no prefix
function get_license( int $id ) { }
function format_key( string $raw ) { }
```

Do not create global functions for business logic. Use static methods on a class or inject dependencies.

### 5.4 Method Length

- A single method should do **one thing**. If you need to describe what it does with "and", split it.
- Hard limit: **40 lines of executable code** per method. Beyond this, extract private helper methods.
- Nesting depth limit: **3 levels** inside a method. Extract nested blocks into named methods.

---

## 6. Prefix Strategy (Master Reference)

The `purecart_` prefix is this plugin's namespace in the global WordPress environment. Every identifier that enters the global scope — functions, hooks, option keys, meta keys, table names, handles, transients, cookies, shortcodes, query vars — carries it. Class methods do **not** carry the prefix because `namespace PureCart\` already provides uniqueness. This section is the authoritative list.

### 6.1 Prefix Table

| Identifier type | Prefix | Format | Example |
|---|---|---|---|
| Global PHP function | `purecart_` | `purecart_{verb}_{noun}` | `purecart_get_license()` |
| Class public method | none | `{verb}_{noun}` | `public function revoke(...)` |
| Class private/protected method | none | `{verb}_{noun}` | `private function build_key(...)` |
| Class constant | `PURECART_` | `PURECART_{NOUN}` | `PURECART_KEY_LENGTH` |
| WordPress action hook | `purecart_` | `purecart_{noun}_{past_verb}` | `purecart_license_revoked` |
| WordPress filter hook | `purecart_` | `purecart_{noun}` | `purecart_commission_rate` |
| Action Scheduler hook | `purecart_` | `purecart_{verb}_{noun}` | `purecart_scan_abandoned_carts` |
| AJAX action | `purecart_` | `purecart_{action}` | `purecart_revoke_license` |
| WP option key | `purecart_` | `purecart_{module}_{key}` | `purecart_downloads_token_expiry` |
| Post/order/user meta key | `_purecart_` | `_purecart_{key}` | `_purecart_provisioned` |
| Database table | `{wpdb->prefix}purecart_` | `{prefix}purecart_{name}` | `wp_purecart_licenses` |
| WP transient key | `purecart_` | `purecart_{purpose}_{id_hash}` | `purecart_rl_a3f9c2...` |
| Cookie name | `purecart_` | `purecart_{purpose}` | `purecart_affiliate_ref` |
| Shortcode tag | `purecart_` | `purecart_{name}` | `purecart_affiliate_dashboard` |
| Rewrite endpoint / query var | `purecart` | `purecart_{name}` | `purecart-download` |
| Post type slug | `purecart_` | `purecart_{type}` | `purecart_plugin`, `purecart_saas` |
| Taxonomy slug | `purecart_` | `purecart_{name}` | `purecart_license_plan` |
| User capability | `purecart_` | `purecart_{action}_{noun}` | `purecart_manage_licenses` |
| JS script handle | `purecart-` | `purecart-{name}` | `purecart-admin` |
| CSS style handle | `purecart-` | `purecart-{name}` | `purecart-admin` |
| JS global object | `purecartAdmin` | camelCase, `purecart` prefix | `purecartAdmin.restUrl` |
| PHP define constant | `PURECART_` | `PURECART_{NOUN}` | `PURECART_VERSION` |
| Nonce action string | `purecart_` | `purecart_{action}` | `purecart_revoke_license` |

### 6.2 Examples by Category

**Global functions:**
```php
function purecart_get_license( int $id ): ?array { }
function purecart_format_license_key( string $raw ): string { }
function purecart_is_module_enabled( string $slug ): bool { }
```

**Class — public vs private:**
```php
class LicenseGenerator {
    // Public: no prefix — namespace PureCart\ already provides uniqueness
    public function generate( int $order_id, int $product_id ): string {
        return $this->format_groups( $this->make_raw_bytes() );
    }

    // Private: no prefix
    private function make_raw_bytes(): string {
        return bin2hex( random_bytes( 20 ) );
    }

    private function format_groups( string $raw ): string {
        return implode( '-', str_split( strtoupper( $raw ), 8 ) );
    }
}
```

**Class constants:**
```php
class LicenseGenerator {
    private const PURECART_KEY_BYTE_LENGTH = 20;
    private const PURECART_GROUP_SIZE      = 8;
    private const PURECART_GROUP_COUNT     = 5;
}
```

**Transients:**
```php
// Rate limiting: purecart_rl_{ip_hash}
$transient_key = 'purecart_rl_' . md5( $ip );

// Analytics cache: purecart_analytics_{report}_{date_range}
$transient_key = 'purecart_analytics_mrr_30d';

// Version check cache: purecart_version_check_{product_id}
$transient_key = 'purecart_version_check_' . $product_id;
```

**Cookie:**
```php
// Affiliate referral cookie
setcookie( 'purecart_affiliate_ref', $affiliate_code, time() + ( $days * DAY_IN_SECONDS ), COOKIEPATH, COOKIE_DOMAIN );
```

**Shortcodes:**
```php
add_shortcode( 'purecart_affiliate_dashboard', [ $this, 'render_affiliate_dashboard' ] );
add_shortcode( 'purecart_login',               [ $this, 'render_saas_login' ] );
```

**AJAX actions:**
```php
// In boot()
add_action( 'wp_ajax_purecart_revoke_license',        [ $this, 'ajax_revoke_license' ] );
add_action( 'wp_ajax_nopriv_purecart_activate_saas',  [ $this, 'ajax_activate_saas' ] );
```

**Rewrite / query vars:**
```php
// Download endpoint: /purecart-download/{token}
add_rewrite_endpoint( 'purecart-download', EP_ROOT );
add_rewrite_tag( '%purecart_token%', '([a-f0-9]{64})' );

// Custom query var for affiliate tracking
add_filter( 'query_vars', function ( array $vars ): array {
    $vars[] = 'purecart_affiliate_ref';
    return $vars;
} );
```

**Post types:**
```php
register_post_type( 'purecart_plugin', [ /* args */ ] );
register_post_type( 'purecart_saas',   [ /* args */ ] );
register_post_type( 'purecart_bundle', [ /* args */ ] );
```

**User capabilities:**
```php
// Applied to Shop Manager role on activation
$role->add_cap( 'purecart_manage_licenses' );
$role->add_cap( 'purecart_manage_subscriptions' );
$role->add_cap( 'purecart_view_analytics' );
$role->add_cap( 'purecart_manage_affiliates' );
```

**Nonces:**
```php
wp_nonce_field( 'purecart_revoke_license_' . $license_id, 'purecart_nonce' );
wp_verify_nonce( $_POST['purecart_nonce'], 'purecart_revoke_license_' . $license_id );
```

**PHP defines (main plugin file only):**
```php
define( 'PURECART_VERSION',     '1.0.0' );
define( 'PURECART_PLUGIN_DIR',  plugin_dir_path( __FILE__ ) );
define( 'PURECART_PLUGIN_URL',  plugin_dir_url( __FILE__ ) );
define( 'PURECART_PLUGIN_FILE', __FILE__ );
define( 'PURECART_MIN_PHP',     '8.1' );
define( 'PURECART_MIN_WC',      '8.0' );
```

### 6.3 Prefix Rules

**MUST:**
- Apply `purecart_` to every global PHP function, hook name, AJAX action, nonce string, shortcode, and query var
- Apply `PURECART_` (uppercase) to every class constant and PHP `define()` constant
- Apply `purecart-` (hyphen) to all `wp_enqueue_script` and `wp_enqueue_style` handle strings
- Apply `purecart_` to every transient key — include a dynamic component (ID or hash) for per-entity transients to avoid collisions
- Apply `_purecart_` (leading underscore) to all post/order/user meta keys

**MUST NOT:**
- Apply any prefix to public, private, or protected class methods — namespace `PureCart\` provides uniqueness
- Use `purecart` without an underscore separator anywhere except the JS global (`purecartAdmin`) and CSS/JS handles (`purecart-admin`)
- Abbreviate the prefix — always the full `purecart_`

---

## 7. WordPress Hooks

### 7.1 Registering Hooks

Hooks are registered in a `boot()` or `register_hooks()` method — never in the constructor, never in a static initializer.

```php
class DownloadsModule extends AbstractModule {

    public function boot(): void {
        add_action( 'woocommerce_download_file_redirect',        [ $this, 'handle_download' ],   10, 2 );
        add_filter( 'woocommerce_customer_available_downloads',  [ $this, 'filter_downloads' ],  10, 2 );
        add_action( 'purecart_scan_abandoned_carts',                  [ $this, 'scan_abandoned_carts' ] );
    }

    public function handle_download( string $file_url, int $order_id ): void { /* ... */ }
    public function filter_downloads( array $downloads, int $customer_id ): array { /* ... */ }
    public function scan_abandoned_carts(): void { /* ... */ }
}
```

### 7.2 Action Hook Names

Format: `purecart_{noun}_{verb_past_tense}`

```
purecart_license_created
purecart_license_revoked
purecart_license_activated
purecart_license_deactivated
purecart_download_token_generated
purecart_download_completed
purecart_subscription_renewed
purecart_subscription_cancelled
purecart_subscription_paused
purecart_subscription_resumed
purecart_saas_account_provisioned
purecart_saas_account_suspended
purecart_affiliate_commission_earned
purecart_abandoned_cart_recovered
```

### 7.3 Filter Hook Names

Format: `purecart_{noun}` or `purecart_{noun}_{context}`

```
purecart_license_key_format
purecart_download_token_expiry
purecart_commission_rate
purecart_activation_domain_patterns      // staging/local domain patterns
purecart_subscription_retry_delays
purecart_email_headers
purecart_webhook_payload_{event}
```

### 7.4 Hook Priority Rules

| Priority | Use case |
|---|---|
| 1 | Must run before WordPress core handlers |
| 10 | Default — use this unless there is a reason not to |
| 20 | Must run after third-party plugins that hook at 10 |
| 100 | Cleanup or logging — must run after all handlers |
| 999 | Final fallback — rarely used |

**Never use** `PHP_INT_MAX` as a priority. If you need to run last, use 999 and document why.

### 7.5 Firing Custom Hooks

Fire an action after every state-changing operation. Fire a filter before returning any computed value that developers might reasonably want to change.

```php
// Fire action after state change
public function revoke( int $license_id, string $reason ): void {
    $this->repository->update_status( $license_id, 'revoked' );

    /**
     * Fires after a license is revoked.
     *
     * @since 1.0.0
     * @param int    $license_id The license ID.
     * @param string $reason     The revocation reason.
     */
    do_action( 'purecart_license_revoked', $license_id, $reason );
}

// Fire filter before returning computed value
public function get_commission_rate( int $affiliate_id, int $product_id ): float {
    $rate = $this->calculate_rate( $affiliate_id, $product_id );  // private helper

    /**
     * Filters the commission rate for a given affiliate and product.
     *
     * @since 1.0.0
     * @param float $rate         Computed rate (0–100).
     * @param int   $affiliate_id Affiliate ID.
     * @param int   $product_id   Product ID.
     */
    return (float) apply_filters( 'purecart_commission_rate', $rate, $affiliate_id, $product_id );
}
```

---

## 8. Database Tables

### 8.1 Table Naming

All plugin tables use the WordPress `$wpdb->prefix` plus `purecart_`:

```
{prefix}purecart_licenses
{prefix}purecart_license_activations
{prefix}purecart_downloads
{prefix}purecart_download_logs
{prefix}purecart_product_versions
{prefix}purecart_subscriptions
{prefix}purecart_subscription_logs
{prefix}purecart_jwt_tokens
{prefix}purecart_saas_accounts
{prefix}purecart_abandoned_carts
{prefix}purecart_affiliates
{prefix}purecart_commissions
{prefix}purecart_affiliate_clicks
{prefix}purecart_payouts
```

### 8.2 Column Naming

- All column names: `snake_case`
- Primary key: always `id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY`
- Foreign keys to WP tables: `{object}_id BIGINT UNSIGNED NOT NULL` (e.g., `order_id`, `user_id`, `product_id`)
- Boolean flags: `is_{flag} TINYINT(1) NOT NULL DEFAULT 0` (e.g., `is_lifetime`, `is_auto_renew`)
- Status columns: `status ENUM(...)` — always specify every valid state in the ENUM
- Timestamps: always two columns — `created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP` and `updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`
- Soft delete: `deleted_at DATETIME NULL DEFAULT NULL`
- Token/hash columns: `VARCHAR(64)` for SHA-256 hex, `VARCHAR(128)` for JWT tokens

### 8.3 Table Creation (dbDelta)

All tables are created via `dbDelta()` inside `includes/Database/Migrator.php`. Schema strings are defined as class constants in `includes/Database/Schema.php`.

```php
<?php

declare(strict_types=1);

namespace PureCart\Database;

class Schema {

    public static function licenses( string $prefix, string $charset_collate ): string {
        return "CREATE TABLE {$prefix}purecart_licenses (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_id        BIGINT UNSIGNED NOT NULL,
  order_item_id   BIGINT UNSIGNED NOT NULL DEFAULT 0,
  user_id         BIGINT UNSIGNED NOT NULL DEFAULT 0,
  product_id      BIGINT UNSIGNED NOT NULL,
  license_key     VARCHAR(64)   NOT NULL,
  status          ENUM('active','expired','revoked','suspended') NOT NULL DEFAULT 'active',
  plan_type       ENUM('single','multi','unlimited','lifetime') NOT NULL DEFAULT 'single',
  activation_limit SMALLINT UNSIGNED NOT NULL DEFAULT 1,
  expires_at      DATETIME NULL DEFAULT NULL,
  is_lifetime     TINYINT(1) NOT NULL DEFAULT 0,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY license_key (license_key),
  KEY order_id (order_id),
  KEY user_id (user_id),
  KEY product_id (product_id),
  KEY status (status)
) $charset_collate;";
    }
}
```

Rules for `dbDelta()`:
- Two spaces before each column definition inside the `CREATE TABLE` block
- PRIMARY KEY, UNIQUE KEY, and KEY declarations after all columns, no trailing comma before closing parenthesis
- Always pass `$wpdb->get_charset_collate()` as the collation argument
- Run `dbDelta()` on every plugin update (not just activation) — it only applies differences

### 8.4 Querying the Database

Never write raw SQL outside of a `Repository` class. Every table has exactly one `Repository` class responsible for all reads and writes against it.

```php
// CORRECT — raw SQL lives in the Repository
class LicenseRepository {

    private \wpdb $db;
    private string $table;

    public function __construct() {
        global $wpdb;
        $this->db    = $wpdb;
        $this->table = $wpdb->prefix . 'purecart_licenses';
    }

    public function find_by_key( string $key ): ?array {
        $row = $this->db->get_row(
            $this->db->prepare(
                "SELECT * FROM {$this->table} WHERE license_key = %s LIMIT 1",
                $key
            ),
            ARRAY_A
        );

        return $row ?: null;
    }

    public function update_status( int $id, string $status ): bool {
        return (bool) $this->db->update(
            $this->table,
            [ 'status' => $status, 'updated_at' => current_time( 'mysql', true ) ],
            [ 'id' => $id ],
            [ '%s', '%s' ],
            [ '%d' ]
        );
    }
}

// WRONG — raw SQL in a module or controller
class LicensingModule {
    public function get_license( string $key ): array {
        global $wpdb;
        return $wpdb->get_row( "SELECT * FROM wp_purecart_licenses WHERE license_key = '$key'" ); // ← SQL injection risk, wrong place
    }
}
```

### 8.5 SQL Rules

**MUST:**
- Use `$wpdb->prepare()` for every query that includes any variable, without exception
- Use `$wpdb->insert()`, `$wpdb->update()`, `$wpdb->delete()` for DML — not raw `$wpdb->query()`
- Pass the format array (`['%s', '%d', '%f']`) to every `insert()` and `update()` call
- Access tables using `$wpdb->prefix . 'purecart_{table}'` — never hard-code `wp_`

**MUST NOT:**
- Concatenate user-supplied input into any SQL string
- Use `$wpdb->query()` for SELECT statements — use `get_row()`, `get_results()`, or `get_var()`
- Use `get_results()` returning objects (`OBJECT`) — always pass `ARRAY_A` for consistency

---

## 9. WordPress Options API

### 9.1 Option Key Naming

Format: `purecart_{scope}_{key}`

All option keys are defined as constants in a single file: `includes/Core/OptionKeys.php`.

```php
<?php

declare(strict_types=1);

namespace PureCart\Core;

/**
 * Central registry of all WordPress option keys used by this plugin.
 * Never write an option key string anywhere else — always reference these constants.
 *
 * @since 1.0.0
 */
final class OptionKeys {

    // ── Plugin ─────────────────────────────────────────────────────────────
    public const DB_VERSION      = 'purecart_db_version';
    public const PLUGIN_VERSION  = 'purecart_plugin_version';
    public const ACTIVE_MODULES  = 'purecart_active_modules';

    // ── Downloads ──────────────────────────────────────────────────────────
    public const DOWNLOADS_TOKEN_EXPIRY   = 'purecart_downloads_token_expiry';
    public const DOWNLOADS_MAX_PER_ORDER  = 'purecart_downloads_max_per_order';
    public const DOWNLOADS_GEO_MODE       = 'purecart_downloads_geo_mode';        // 'block' | 'allow'
    public const DOWNLOADS_GEO_COUNTRIES  = 'purecart_downloads_geo_countries';   // serialized array

    // ── Licensing ──────────────────────────────────────────────────────────
    public const LICENSING_DEFAULT_PLAN    = 'purecart_licensing_default_plan';
    public const LICENSING_DEFAULT_LIMIT   = 'purecart_licensing_default_limit';
    public const LICENSING_DEFAULT_EXPIRY  = 'purecart_licensing_default_expiry'; // days, 0 = lifetime
    public const LICENSING_STAGING_DOMAINS = 'purecart_licensing_staging_domains';

    // ── Subscriptions ──────────────────────────────────────────────────────
    public const SUBS_AUTO_RENEW         = 'purecart_subs_auto_renew';
    public const SUBS_GRACE_PERIOD_DAYS  = 'purecart_subs_grace_period_days';
    public const SUBS_RETRY_DELAYS       = 'purecart_subs_retry_delays';   // serialized array [1, 3, 5]
    public const SUBS_PRORATION_MODE     = 'purecart_subs_proration_mode'; // 'full' | 'prorated' | 'none'

    // ── SaaS ───────────────────────────────────────────────────────────────
    public const SAAS_WEBHOOK_URL     = 'purecart_saas_webhook_url';
    public const SAAS_WEBHOOK_SECRET  = 'purecart_saas_webhook_secret';
    public const SAAS_JWT_EXPIRY      = 'purecart_saas_jwt_expiry';      // seconds

    // ── Affiliates ─────────────────────────────────────────────────────────
    public const AFF_COMMISSION_RATE  = 'purecart_aff_commission_rate';
    public const AFF_COOKIE_DAYS      = 'purecart_aff_cookie_days';
    public const AFF_AUTO_APPROVE     = 'purecart_aff_auto_approve';
    public const AFF_MIN_PAYOUT       = 'purecart_aff_min_payout';       // in store currency (float)
    public const AFF_ATTRIBUTION      = 'purecart_aff_attribution';      // 'last_click' | 'first_click'

    // ── Abandoned Cart ─────────────────────────────────────────────────────
    public const CART_TIMEOUT_MINUTES  = 'purecart_cart_timeout_minutes';
    public const CART_EMAIL_1_DELAY    = 'purecart_cart_email_1_delay';   // hours
    public const CART_EMAIL_2_DELAY    = 'purecart_cart_email_2_delay';
    public const CART_EMAIL_3_DELAY    = 'purecart_cart_email_3_delay';
    public const CART_COUPON_PERCENT   = 'purecart_cart_coupon_percent';  // 0 = no coupon

    // ── Security ───────────────────────────────────────────────────────────
    public const SEC_RATE_LIMIT_MAX    = 'purecart_sec_rate_limit_max';
    public const SEC_RATE_LIMIT_WINDOW = 'purecart_sec_rate_limit_window'; // seconds
    public const SEC_MAX_COUNTRIES     = 'purecart_sec_max_countries';
    public const SEC_MAX_IPS           = 'purecart_sec_max_ips';

    // ── Email ──────────────────────────────────────────────────────────────
    public const EMAIL_FROM_NAME  = 'purecart_email_from_name';
    public const EMAIL_FROM_EMAIL = 'purecart_email_from_email';

    // Prevent instantiation
    private function __construct() {}
}
```

### 9.2 Reading & Writing Options

Always use a wrapper — never call `get_option()` / `update_option()` directly from a module or controller. All option access goes through a settings service class: `includes/Core/Settings.php`.

```php
// CORRECT
$expiry = Settings::get( OptionKeys::DOWNLOADS_TOKEN_EXPIRY, 48 ); // 48h default

// WRONG — raw option call from a module
$expiry = get_option( 'purecart_downloads_token_expiry', 48 );

// WRONG — raw string key
$expiry = Settings::get( 'purecart_downloads_token_expiry' );
```

`Settings.php` pattern:

```php
final class Settings {

    public static function get( string $key, mixed $default = null ): mixed {
        return get_option( $key, $default );
    }

    public static function set( string $key, mixed $value ): bool {
        return update_option( $key, $value );
    }

    public static function delete( string $key ): bool {
        return delete_option( $key );
    }

    /**
     * Returns all module settings as a structured array.
     * Used by the REST API settings endpoint.
     */
    public static function all(): array {
        // ...
    }
}
```

### 9.3 Option Storage Rules

- Store arrays as native PHP arrays — WordPress serializes them automatically. Do not `json_encode()` arrays into options.
- Sensitive values (webhook secrets, JWT secrets): store as-is — WordPress does not encrypt options. Document that these should be rotated and are plaintext in the database.
- Do not cache option lookups manually with a static variable — `get_option()` already uses the WordPress object cache.
- Default values for all options must be defined in one place: `Installer::set_defaults()`, called on activation.

---

## 10. Post Meta & Order Meta

### 10.1 Meta Key Naming

Format: `_purecart_{key}` (underscore prefix marks it as private/hidden in the WP admin)

All meta keys are constants in `includes/Core/MetaKeys.php`:

```php
final class MetaKeys {

    // Order meta
    public const ORDER_PROVISIONED = '_purecart_provisioned';   // '1' when all modules have processed

    // Product meta
    public const PRODUCT_LICENSE_PLAN        = '_purecart_license_plan';
    public const PRODUCT_LICENSE_LIMIT       = '_purecart_license_limit';
    public const PRODUCT_LICENSE_EXPIRY_DAYS = '_purecart_license_expiry_days';
    public const PRODUCT_UPDATE_REQUIRES_LICENSE = '_purecart_update_requires_license';
    public const PRODUCT_WEBHOOK_URL         = '_purecart_webhook_url';

    // User meta
    public const USER_AFFILIATE_ID   = '_purecart_affiliate_id';
    public const USER_AFFILIATE_CODE = '_purecart_affiliate_code';

    private function __construct() {}
}
```

### 10.2 Accessing Order Meta (HPOS)

Never call `get_post_meta()` on orders. Use the WooCommerce order object:

```php
// CORRECT — HPOS compatible
$order = wc_get_order( $order_id );
$provisioned = $order->get_meta( MetaKeys::ORDER_PROVISIONED );
$order->update_meta_data( MetaKeys::ORDER_PROVISIONED, '1' );
$order->save();

// WRONG — breaks HPOS
$provisioned = get_post_meta( $order_id, '_purecart_provisioned', true );
update_post_meta( $order_id, '_purecart_provisioned', '1' );
```

---

## 11. REST API

### 11.1 Namespace & Versioning

All plugin REST endpoints use:

```
/wp-json/purecart/v1/{resource}
```

The namespace string `purecart/v1` is a constant:

```php
// includes/Core/RestApi.php
public const NAMESPACE = 'purecart/v1';
```

When a breaking change is required, create `purecart/v2` — never modify existing `v1` endpoints in a way that breaks backwards compatibility.

### 11.2 Route Registration

Routes are registered in `register_rest_routes()` called from `rest_api_init`:

```php
public function register_routes(): void {
    register_rest_route( self::NAMESPACE, '/licenses', [
        [
            'methods'             => \WP_REST_Server::READABLE,
            'callback'            => [ $this->license_controller, 'index' ],
            'permission_callback' => [ $this->license_controller, 'can_manage' ],
            'args'                => $this->license_controller->get_index_args(),
        ],
        [
            'methods'             => \WP_REST_Server::CREATABLE,
            'callback'            => [ $this->license_controller, 'create' ],
            'permission_callback' => [ $this->license_controller, 'can_manage' ],
            'args'                => $this->license_controller->get_create_args(),
        ],
    ] );

    register_rest_route( self::NAMESPACE, '/licenses/(?P<id>\d+)', [
        [
            'methods'             => \WP_REST_Server::READABLE,
            'callback'            => [ $this->license_controller, 'show' ],
            'permission_callback' => [ $this->license_controller, 'can_manage' ],
        ],
        // ...
    ] );
}
```

### 11.3 Controller Structure

Every REST controller follows this structure:

```php
class LicenseController {

    public function __construct( private readonly LicenseRepository $repository ) {}

    // ── Permission callbacks ────────────────────────────────────────────────

    public function can_manage( \WP_REST_Request $request ): bool {
        return current_user_can( 'manage_woocommerce' );
    }

    public function can_activate( \WP_REST_Request $request ): bool|\WP_Error {
        // Public endpoint — validate the license key exists first
        $key = $request->get_param( 'license_key' );
        if ( empty( $key ) ) {
            return new \WP_Error( 'purecart_missing_key', __( 'License key required.', 'purecart' ), [ 'status' => 400 ] );
        }
        return true;
    }

    // ── Arg definitions ────────────────────────────────────────────────────

    public function get_index_args(): array {
        return [
            'page'     => [ 'type' => 'integer', 'default' => 1, 'minimum' => 1 ],
            'per_page' => [ 'type' => 'integer', 'default' => 20, 'minimum' => 1, 'maximum' => 100 ],
            'status'   => [ 'type' => 'string', 'enum' => [ 'active', 'expired', 'revoked', 'suspended', '' ] ],
            'search'   => [ 'type' => 'string', 'sanitize_callback' => 'sanitize_text_field' ],
        ];
    }

    // ── Endpoint handlers ──────────────────────────────────────────────────

    public function index( \WP_REST_Request $request ): \WP_REST_Response|\WP_Error {
        $licenses = $this->repository->paginate(
            page:     (int) $request->get_param( 'page' ),
            per_page: (int) $request->get_param( 'per_page' ),
            status:   (string) $request->get_param( 'status' ),
            search:   (string) $request->get_param( 'search' ),
        );

        return rest_ensure_response( $licenses );
    }

    public function show( \WP_REST_Request $request ): \WP_REST_Response|\WP_Error {
        $license = $this->repository->find( (int) $request->get_param( 'id' ) );

        if ( null === $license ) {
            return new \WP_Error( 'purecart_not_found', __( 'License not found.', 'purecart' ), [ 'status' => 404 ] );
        }

        return rest_ensure_response( $license );
    }
}
```

### 11.4 REST API Rules

**MUST:**
- Define `args` with types, sanitize callbacks, and validate callbacks for every parameter
- Return `WP_Error` with a descriptive code string and appropriate HTTP status for all failures
- Use `rest_ensure_response()` for successful responses — never `wp_send_json()`
- Include HTTP status codes: 200 (success), 201 (created), 400 (bad request), 401 (unauthenticated), 403 (forbidden), 404 (not found), 409 (conflict), 422 (validation error), 500 (server error)
- Keep controllers thin: they validate + delegate to a service/repository, then format the response

**MUST NOT:**
- Put business logic in a controller — controllers call the service layer
- Skip `permission_callback` — every route must have one, even public routes return `true` explicitly
- Return raw database arrays directly — format them through a `prepare_item_for_response()` method

### 11.5 Error Code Convention

Format: `purecart_{noun}_{condition}`

```
purecart_license_not_found
purecart_license_already_revoked
purecart_license_activation_limit_reached
purecart_license_expired
purecart_license_domain_not_activated
purecart_token_invalid
purecart_token_expired
purecart_subscription_not_found
purecart_permission_denied
purecart_missing_parameter
purecart_invalid_parameter
```

---

## 12. Security

### 12.1 Nonce Verification

Every admin form submission and AJAX request must verify a nonce.

```php
// In form output
wp_nonce_field( 'purecart_revoke_license', 'purecart_nonce' );

// In handler
if ( ! isset( $_POST['purecart_nonce'] ) || ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['purecart_nonce'] ) ), 'purecart_revoke_license' ) ) {
    wp_die( esc_html__( 'Security check failed.', 'purecart' ), 403 );
}
```

REST API endpoints authenticated via WP REST nonce (the React app sends `X-WP-Nonce` automatically when using `wp_create_nonce('wp_rest')`).

### 12.2 Capability Checks

Every admin action checks `manage_woocommerce` capability. Public-facing API endpoints (license activation) have no capability check but validate the input rigorously.

```php
if ( ! current_user_can( 'manage_woocommerce' ) ) {
    wp_die( esc_html__( 'Insufficient permissions.', 'purecart' ), 403 );
}
```

### 12.3 Input Sanitization

Sanitize at the point of input. Escape at the point of output.

| Data type | Sanitize with | Escape with |
|---|---|---|
| Plain text | `sanitize_text_field()` | `esc_html()` |
| HTML | `wp_kses_post()` | (already sanitized) |
| URL | `esc_url_raw()` on save | `esc_url()` on output |
| Email | `sanitize_email()` | `esc_html()` |
| Integer | `absint()` or `(int)` cast | none needed |
| Float | `(float)` cast | none needed |
| Slug/key | `sanitize_key()` | `esc_attr()` |
| File path | `sanitize_file_name()` | none in output |

### 12.4 Cryptographic Operations

All crypto lives in `includes/Helpers/Crypto.php`. Never use `rand()`, `mt_rand()`, `uniqid()`, or `md5()` for anything security-sensitive.

```php
final class Crypto {

    /**
     * Generates a download token: 64-character hex string.
     * Format: bin2hex(random_bytes(32))
     */
    public static function generate_token(): string {
        return bin2hex( random_bytes( 32 ) );
    }

    /**
     * Generates a license key.
     * Format: XXXXXXXX-XXXXXXXX-XXXXXXXX-XXXXXXXX-XXXXXXXX (5 groups of 8 hex chars)
     */
    public static function generate_license_key(): string {
        $raw    = strtoupper( bin2hex( random_bytes( 20 ) ) );
        $groups = str_split( $raw, 8 );
        return implode( '-', $groups );
    }

    /**
     * Generates an API key.
     * Format: purecart_{48-char hex}
     */
    public static function generate_api_key(): string {
        return 'purecart_' . bin2hex( random_bytes( 24 ) );
    }

    /**
     * Signs a webhook payload with HMAC-SHA256.
     * Send result in X-PureCart-Sig header.
     */
    public static function sign_webhook( string $payload, string $secret ): string {
        return hash_hmac( 'sha256', $payload, $secret );
    }

    /**
     * Verifies a webhook signature.
     */
    public static function verify_webhook( string $payload, string $secret, string $signature ): bool {
        return hash_equals( self::sign_webhook( $payload, $secret ), $signature );
    }

    /**
     * Hashes a file with SHA-256.
     * Used to verify plugin ZIP integrity.
     */
    public static function file_hash( string $path ): string|false {
        return hash_file( 'sha256', $path );
    }
}
```

### 12.5 Rate Limiting

Rate limiting uses WP transients. Never use raw `$_SERVER['REMOTE_ADDR']` directly — hash it.

```php
// In RateLimiter.php
public function check( string $ip, int $max, int $window_seconds ): bool {
    $key     = 'purecart_rl_' . md5( $ip );   // md5 is fine here — it's just a cache key, not crypto
    $current = (int) get_transient( $key );

    if ( $current >= $max ) {
        return false; // rate limited
    }

    if ( 0 === $current ) {
        set_transient( $key, 1, $window_seconds );
    } else {
        set_transient( $key, $current + 1, $window_seconds );
    }

    return true;
}
```

---

## 13. Action Scheduler

All background jobs use Action Scheduler. Never use raw `wp_schedule_event()` or `wp_cron`.

### 13.1 Scheduling a Job

```php
// Schedule a single future job
as_schedule_single_action(
    time() + HOUR_IN_SECONDS,
    'purecart_send_recovery_email_1',
    [ 'cart_id' => $cart_id ],
    'purecart'  // group — always this string
);

// Schedule a recurring job (admin registers this on plugin activation)
as_schedule_recurring_action(
    time(),
    15 * MINUTE_IN_SECONDS,
    'purecart_scan_abandoned_carts',
    [],
    'purecart'
);
```

### 13.2 Handling a Job

```php
// Register the handler in the module's boot() method
add_action( 'purecart_send_recovery_email_1', [ $this, 'send_recovery_email' ], 10, 1 );

// The handler — public method, no prefix needed
public function send_recovery_email( int $cart_id ): void {
    $cart = $this->repository->find( $cart_id );

    if ( null === $cart || 'recovered' === $cart['status'] ) {
        return; // already recovered — abort silently
    }

    // ...send email
}
```

### 13.3 Action Scheduler Rules

- Always pass the group string `'purecart'` to every `as_schedule_*` call
- Handler methods must be idempotent — running them twice must produce the same result as running them once
- Check current state at the start of every handler before doing work — the state may have changed since the job was queued
- Unschedule recurring jobs on plugin deactivation via `as_unschedule_all_actions( 'purecart_scan_abandoned_carts', [], 'purecart' )`

---

## 14. Emails

### 14.1 Email Architecture

All plugin emails extend `AbstractEmail`, which extends `WC_Email`. This gives us:
- WooCommerce email wrappers (header, footer)
- Auto-inclusion in WooCommerce → Settings → Emails panel
- `get_recipient()`, `get_subject()`, `get_content_html()`, `get_content_plain()` contract

```php
class LicenseKeyEmail extends \WC_Email {

    public function __construct() {
        $this->id             = 'purecart_license_key';
        $this->title          = __( 'License Key Delivery', 'purecart' );
        $this->description    = __( 'Sent to the customer when a license key is generated.', 'purecart' );
        $this->template_html  = 'emails/license-key.php';
        $this->template_plain = 'emails/plain/license-key.php';
        $this->placeholders   = [
            '{license_key}'  => '',
            '{product_name}' => '',
        ];

        parent::__construct();
    }

    public function trigger( int $license_id ): void {
        $license = purecart_get_license( $license_id );
        if ( ! $license ) {
            return;
        }

        $this->placeholders['{license_key}']  = $license['license_key'];
        $this->placeholders['{product_name}'] = get_the_title( $license['product_id'] );
        $this->recipient                      = $license['customer_email'];

        $this->send( $this->get_recipient(), $this->get_subject(), $this->get_content(), $this->get_headers(), $this->get_attachments() );
    }
}
```

### 14.2 Email Template Files

Located in `templates/emails/`. Template files are plain PHP view files — no logic beyond variable output.

```php
// templates/emails/license-key.php
<?php
defined( 'ABSPATH' ) || exit;

/** @var WC_Email $email */
/** @var string   $license_key */
/** @var string   $product_name */

do_action( 'woocommerce_email_header', $email->get_heading(), $email );
?>
<p><?php printf( esc_html__( 'Thank you for purchasing %s. Your license key is below.', 'purecart' ), esc_html( $product_name ) ); ?></p>
<p style="font-family: monospace; font-size: 16px;"><?php echo esc_html( $license_key ); ?></p>
<?php
do_action( 'woocommerce_email_footer', $email );
```

---

## 15. Translations (i18n)

### 15.1 Text Domain

Always `'purecart'`. Never use a variable as the text domain.

### 15.2 Translation Functions

| Function | Use case |
|---|---|
| `__( 'string', 'purecart' )` | Basic string, returns translated |
| `_e( 'string', 'purecart' )` | Echo a translated string |
| `_n( 'single', 'plural', $count, 'purecart' )` | Singular/plural |
| `esc_html__( 'string', 'purecart' )` | Translate + escape for HTML output |
| `esc_attr__( 'string', 'purecart' )` | Translate + escape for attribute output |

### 15.3 i18n Rules

- Wrap every user-visible string in a translation function
- Never translate strings that go into database or option values
- Never use variable interpolation inside a translation string: `__( "Hello $name" )` — wrong. Use `sprintf( __( 'Hello %s', 'purecart' ), $name )` — correct
- Use `_n()` for any string that depends on a count
- **Never call `__()`, `_e()`, or any translation function inside a constructor.** WordPress 6.7+ requires the text domain to be loaded at `init` or later. A constructor that fires during `plugins_loaded` will trigger `_load_textdomain_just_in_time` too early and produce a notice. Return translated strings from methods instead:

```php
// WRONG — __() inside __construct() fires before the text domain is loaded
public function __construct() {
    $this->tab_label = __( 'My Licenses', 'purecart' );
}

// CORRECT — defer translated strings to a method called at/after init
public function get_tab_label(): string {
    return __( 'My Licenses', 'purecart' );
}
```

- **Do NOT call `load_plugin_textdomain()`** — WordPress automatically loads translations for plugins hosted on WordPress.org since WP 4.6. Calling it manually is redundant and can cause double-loading. Simply use the correct `'purecart'` text domain string everywhere and provide a `languages/purecart.pot` file.

---

## 16. Assets & Enqueueing

### 16.1 Enqueue Pattern

```php
// includes/Core/Assets.php
public function enqueue_admin( string $hook ): void {
    // Only load on PureCart admin pages
    if ( ! $this->is_purecart_page( $hook ) ) {
        return;
    }

    $asset_file = PURECART_PLUGIN_DIR . 'assets/js/admin.asset.php';
    $asset      = file_exists( $asset_file ) ? require $asset_file : [ 'dependencies' => [], 'version' => PURECART_VERSION ];

    wp_enqueue_script(
        'purecart-admin',
        PURECART_PLUGIN_URL . 'assets/js/admin.js',
        $asset['dependencies'],
        $asset['version'],
        true    // load in footer
    );

    wp_localize_script( 'purecart-admin', 'purecartAdmin', [
        'restUrl'    => esc_url_raw( rest_url( 'purecart/v1/' ) ),
        'nonce'      => wp_create_nonce( 'wp_rest' ),
        'siteUrl'    => esc_url( get_site_url() ),
        'currency'   => get_woocommerce_currency(),
        'locale'     => get_locale(),
        'version'    => PURECART_VERSION,
        'modules'    => Settings::get( OptionKeys::ACTIVE_MODULES, [] ),
        'user'       => $this->get_current_user_data(),
    ] );

    wp_enqueue_style(
        'purecart-admin',
        PURECART_PLUGIN_URL . 'assets/css/admin.css',
        [ 'wp-components' ],
        $asset['version']
    );
}
```

### 16.2 Constants

Defined in the main plugin file:

```php
define( 'PURECART_VERSION',     '1.0.0' );
define( 'PURECART_PLUGIN_DIR',  plugin_dir_path( __FILE__ ) );
define( 'PURECART_PLUGIN_URL',  plugin_dir_url( __FILE__ ) );
define( 'PURECART_PLUGIN_FILE', __FILE__ );
```

---

## 17. Plugin Bootstrap (`purecart.php`)

The main plugin file does three things and nothing else:

1. Declares the plugin header
2. Defines constants
3. Boots the plugin

```php
<?php

/**
 * Plugin Name:       PureCart for WooCommerce
 * Plugin URI:        https://wordpress.org/plugins/purecart/
 * Description:       The complete digital product platform for WooCommerce.
 * Version:           1.0.0
 * Requires at least: 6.0
 * Requires PHP:      8.1
 * Author:            Aminul Islam
 * Author URI:        https://xpeedstudio.com
 * License:           GPLv2 or later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       purecart
 * Domain Path:       /languages
 * WC requires at least: 8.0
 * WC tested up to:      9.8
 */

declare(strict_types=1);

defined( 'ABSPATH' ) || exit;

define( 'PURECART_VERSION',     '1.0.0' );
define( 'PURECART_PLUGIN_DIR',  plugin_dir_path( __FILE__ ) );
define( 'PURECART_PLUGIN_URL',  plugin_dir_url( __FILE__ ) );
define( 'PURECART_PLUGIN_FILE', __FILE__ );

// Composer autoloader
if ( file_exists( PURECART_PLUGIN_DIR . 'vendor/autoload.php' ) ) {
    require_once PURECART_PLUGIN_DIR . 'vendor/autoload.php';
}

// Boot only after plugins_loaded to ensure WooCommerce is available
add_action( 'plugins_loaded', function (): void {
    if ( ! class_exists( 'WooCommerce' ) ) {
        add_action( 'admin_notices', function (): void {
            echo '<div class="notice notice-error"><p>' .
                esc_html__( 'PureCart for WooCommerce requires WooCommerce to be installed and active.', 'purecart' ) .
                '</p></div>';
        } );
        return;
    }

    \PureCart\Plugin::boot();
}, 10 );

// HPOS compatibility declaration (must be in the main file, before WC loads)
add_action( 'before_woocommerce_init', function (): void {
    if ( class_exists( \Automattic\WooCommerce\Utilities\FeaturesUtil::class ) ) {
        \Automattic\WooCommerce\Utilities\FeaturesUtil::declare_compatibility( 'custom_order_tables', __FILE__, true );
    }
} );
```

### 17.2 Main Plugin Class (`Plugin.php`)

```php
final class Plugin {

    private static bool $booted = false;

    public static function boot(): void {
        if ( self::$booted ) {
            return;
        }

        self::$booted = true;

        $instance = new self();
        $instance->init();
    }

    private function init(): void {
        // Text domain is auto-loaded by WordPress for WP.org plugins — no load_plugin_textdomain() call needed.

        // Core
        ( new Core\Assets() )->register();
        ( new Core\AdminMenu() )->register();
        ( new Core\RestApi() )->register();
        ( new Core\ProductTypes() )->register();

        // Modules — only boot enabled modules
        $active = Settings::get( OptionKeys::ACTIVE_MODULES, [] );
        $this->boot_modules( $active );
    }

    private function boot_modules( array $active ): void {
        $available = [
            'downloads'     => Modules\Downloads\DownloadsModule::class,
            'licensing'     => Modules\Licensing\LicensingModule::class,
            'updates'       => Modules\Updates\UpdatesModule::class,
            'subscriptions' => Modules\Subscriptions\SubscriptionsModule::class,
            'saas'          => Modules\SaaS\SaaSModule::class,
            'affiliates'    => Modules\Affiliates\AffiliatesModule::class,
            'abandoned-cart'=> Modules\AbandonedCart\AbandonedCartModule::class,
            'security'      => Modules\Security\SecurityModule::class,
            'analytics'     => Modules\Analytics\AnalyticsModule::class,
        ];

        foreach ( $available as $slug => $class ) {
            $module = new $class( in_array( $slug, $active, true ) );
            $module->register();  // always register (for admin UI)
            if ( $module->is_enabled() ) {
                $module->boot();  // only boot enabled modules
            }
        }
    }
}
```

---

## 18. Module Architecture

### 18.1 Abstract Module

```php
abstract class AbstractModule {

    public function __construct( private readonly bool $enabled ) {}

    public function is_enabled(): bool {
        return $this->enabled;
    }

    /**
     * Always called — registers admin menu, REST routes for this module's settings.
     */
    abstract public function register(): void;

    /**
     * Called only when module is enabled — registers hooks for the feature itself.
     */
    abstract public function boot(): void;
}
```

### 18.2 Module Rules

- `register()` always runs — it adds the module to the admin sidebar, registers its settings REST route
- `boot()` only runs when the module is enabled — it adds all the functional hooks
- Each module is self-contained: it creates its own database tables (via Migrator), registers its own REST routes, registers its own Action Scheduler jobs
- A module must clean up after itself (unschedule jobs, not drop tables) on disable
- Modules must never directly call methods on other modules — communicate through `do_action()` and `apply_filters()`

---

## 19. Error Handling

### 19.1 Exceptions

Use typed exceptions for exceptional conditions (not control flow):

```php
// includes/Modules/Licensing/LicenseNotFoundException.php
namespace PureCart\Modules\Licensing;

class LicenseNotFoundException extends \RuntimeException {
    public function __construct( string $key ) {
        parent::__construct( "License not found: {$key}", 404 );
    }
}
```

### 19.2 WP_Error for Admin/REST Context

Return `WP_Error` from REST controllers and admin handlers. Throw exceptions inside service/repository classes and catch them in the controller.

```php
// Repository throws
public function find_or_fail( int $id ): array {
    $row = $this->find( $id );
    if ( null === $row ) {
        throw new LicenseNotFoundException( "ID:{$id}" );
    }
    return $row;
}

// Controller catches
public function show( \WP_REST_Request $request ): \WP_REST_Response|\WP_Error {
    try {
        $license = $this->repository->find_or_fail( (int) $request->get_param( 'id' ) );
        return rest_ensure_response( $license );
    } catch ( LicenseNotFoundException $e ) {
        return new \WP_Error( 'purecart_license_not_found', $e->getMessage(), [ 'status' => 404 ] );
    }
}
```

### 19.3 Logging

Use `wc_get_logger()` for all plugin logging. Never use `error_log()`.

```php
$logger  = wc_get_logger();
$context = [ 'source' => 'purecart' ];

$logger->info( "License #{$id} activated for domain {$domain}", $context );
$logger->warning( "Rate limit reached for IP {$ip}", $context );
$logger->error( "Webhook delivery failed: {$error}", $context );
```

Log levels: `debug` (dev only), `info` (normal events), `warning` (unexpected but handled), `error` (something failed, needs attention).

---

## 20. Activation, Deactivation, Uninstall

### 20.1 Activation (`register_activation_hook`)

```php
register_activation_hook( PURECART_PLUGIN_FILE, function (): void {
    require_once PURECART_PLUGIN_DIR . 'includes/Installer.php';
    \PureCart\Installer::activate();
} );
```

`Installer::activate()` does:
1. Check PHP and WC version requirements — `deactivate_plugins()` + `wp_die()` if not met
2. Run `Migrator::run()` — creates all tables via `dbDelta()`
3. Run `Settings::set_defaults()` — write all default option values (using `add_option()`, not `update_option()`, so existing installs are not overwritten)
4. Schedule recurring Action Scheduler jobs
5. Set `purecart_db_version` option to current schema version
6. Flush rewrite rules: `flush_rewrite_rules()`

### 20.2 Deactivation (`register_deactivation_hook`)

```php
register_deactivation_hook( PURECART_PLUGIN_FILE, function (): void {
    as_unschedule_all_actions( '', [], 'purecart' );
    flush_rewrite_rules();
} );
```

Deactivation does NOT delete data. It only unschedules jobs and flushes rewrites.

### 20.3 Uninstall (`uninstall.php`)

```php
// uninstall.php
defined( 'WP_UNINSTALL_PLUGIN' ) || exit;

require_once plugin_dir_path( __FILE__ ) . 'includes/Uninstaller.php';
\PureCart\Uninstaller::run();
```

`Uninstaller::run()` does — only if a "delete all data" option is enabled:
1. Drop all `purecart_*` tables
2. Delete all `purecart_*` options
3. Delete all `_purecart_*` post/user meta
4. Remove all user capabilities added by the plugin

---

## 21. What Never Changes

These rules are frozen. No exception, no workaround.

1. **No raw SQL outside Repository classes** — every DB call goes through a repository
2. **No raw option keys** — always use `OptionKeys::CONSTANT`
3. **No raw meta keys** — always use `MetaKeys::CONSTANT`
4. **No `get_post_meta()` on orders** — always use `$order->get_meta()`
5. **No `wp_schedule_event()`** — always use Action Scheduler
6. **No `rand()` or `md5()` for security tokens** — always use `random_bytes()` via `Crypto` class
7. **No closing `?>` tag** in any PHP file
8. **No inline SQL in controllers or modules** — only in repositories
9. **No direct `echo` in REST controllers** — always return `WP_REST_Response` or `WP_Error`
10. **No business logic in the main plugin file** — bootstrap only
11. **No prefixed class methods** — class methods (public, private, or protected) carry no plugin prefix; namespace `PureCart\` provides uniqueness
12. **No bare string identifiers in the global scope** — hooks, options, meta keys, transients, cookies, shortcodes, nonces, handles all carry `purecart_` / `PURECART_` as defined in Section 6