# RND — Plugin Auto-Updates Module
**Plugin:** purecart
**Module:** Plugin Auto-Updates
**Phase:** 1 (MVP) + Phase 4 (Git Integration)
**Standalone:** Yes — works without Licensing (for free plugins) or with Licensing (for paid plugins)

---

## Overview

The Plugin Updates module turns your WooCommerce store into a self-hosted WordPress plugin update server. Customers' WordPress sites automatically check your store for new versions of your plugin — exactly like the WordPress.org repository, but hosted on your own server. You manage ZIP uploads, versioning, changelogs, and release channels. The update check can be gated behind license validation or left open for free plugins.

### Problem It Solves
- WordPress plugin developers have no native way to deliver self-hosted updates
- Existing solutions (plugin-update-checker library) require manual integration on both the seller's server and the customer's plugin
- No WooCommerce-native version management with SHA-256 checksums and release channels

---

## Standalone Usage

**Free plugins (no license gate):** Enable Plugin Updates only. Upload ZIPs, customers receive updates automatically.

**Paid plugins (license-gated updates):** Enable Plugin Updates + Licensing. The `/plugin/update-check` endpoint validates the license key before returning a download URL.

---

## Architecture

### Classes

| Class | File | Responsibility |
|---|---|---|
| `UpdateServer` | `includes/Updates/UpdateServer.php` | REST endpoints for update check and changelog |
| `VersionManager` | `includes/Updates/VersionManager.php` | Upload/manage ZIP versions, checksums |
| `ChangelogManager` | `includes/Updates/ChangelogManager.php` | Store/retrieve version notes |
| `GitHubSync` | `includes/Updates/GitHubSync.php` | GitHub/Bitbucket webhook receiver |

### How WordPress Plugin Updates Work

When a WordPress site checks for plugin updates (on dashboard load or manual check), WordPress calls `plugins_api` filter and checks a transient. The update-checker library installed in your customer's plugin makes a request to your server's endpoint:

```
GET /wp-json/purecart/v1/plugin/update-check
    ?slug=my-plugin
    &version=1.2.0
    &license_key=A1B2C3D4-...
    &domain=customer-site.com
    &wp_version=6.9
    &php_version=8.2
```

Your server responds with whether an update is available and (if so) a signed download URL.

### Update Check Flow

```
GET /purecart/v1/plugin/update-check
    │
    └── UpdateServer::update_check()
            ├── Validate: slug exists (find product by _purecart_plugin_slug meta)
            ├── [If license-gated] LicenseActivator::validate(license_key, domain)
            ├── VersionManager::get_latest(product_id, channel='stable')
            ├── version_compare(request_version, latest_version)
            ├── [If update available]
            │       ├── TokenManager::create() → signed download token
            │       └── return update payload
            └── [If up to date] return { update: false }

Response payload:
{
  "update": true,
  "version": "1.3.0",
  "download_url": "https://store.com/purecart-download/{token}",
  "requires": "6.0",
  "tested": "6.9",
  "requires_php": "8.1",
  "changelog": "## 1.3.0\n- Fixed login bug\n- Added dashboard widget",
  "checksum_sha256": "abc123..."
}
```

---

## Database Tables

### wp_purecart_product_versions — Version Registry
```sql
CREATE TABLE wp_purecart_product_versions (
    id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    product_id      BIGINT UNSIGNED NOT NULL,
    version         VARCHAR(20) NOT NULL,
    file_path       TEXT NOT NULL,           -- absolute server path to ZIP
    checksum_sha256 VARCHAR(64),             -- SHA-256 of ZIP file
    requires_wp     VARCHAR(10),             -- e.g. '6.0'
    tested_wp       VARCHAR(10),             -- e.g. '6.9'
    requires_php    VARCHAR(10),             -- e.g. '8.1'
    channel         ENUM('stable','beta') DEFAULT 'stable',
    changelog       LONGTEXT,                -- Markdown changelog
    released_at     DATETIME NOT NULL,
    PRIMARY KEY (id),
    KEY idx_product_version (product_id, version),
    KEY idx_channel (channel),
    KEY idx_released_at (released_at)
);
```

---

## REST API Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/purecart/v1/plugin/update-check` | License key (optional) | Check for available update |
| `GET` | `/purecart/v1/plugin/download/{token}` | Token (time-limited) | Download update ZIP |
| `GET` | `/purecart/v1/plugin/changelog/{slug}` | Public | Retrieve changelog for all versions |
| `POST` | `/purecart/v1/plugin/version` | manage_woocommerce | Upload new version (admin) |
| `POST` | `/purecart/v1/plugin/github-webhook` | HMAC signature | GitHub/Bitbucket webhook receiver |

---

## Version Management (Admin UI)

The "Plugin Versions" admin submenu shows:
- All versions per product
- Version number, release channel, release date
- Download count per version
- SHA-256 checksum
- Changelog preview
- Delete version action

**Uploading a new version:**
1. Go to Digital Downloads → Plugin Versions
2. Select product
3. Upload ZIP file
4. Enter version number, release channel (stable/beta), and WordPress compatibility range
5. Write changelog (Markdown supported)
6. Submit → `VersionManager::add()` stores file, computes SHA-256, inserts DB record

---

## SHA-256 Checksum Verification

On upload, `VersionManager::add()` computes:
```php
$checksum = hash_file( 'sha256', $file_path );
```

The checksum is returned in the update-check response. The customer's plugin (or update-checker library) can verify the downloaded ZIP before installation:

```php
if ( hash_file( 'sha256', $downloaded_zip ) !== $response['checksum_sha256'] ) {
    // Reject — ZIP may be tampered with
}
```

---

## Release Channels

| Channel | Description | Who Gets It |
|---|---|---|
| `stable` | Production releases | All customers by default |
| `beta` | Pre-release testing | Customers who opt in to beta channel |

Customers opt in to beta updates by adding a filter in their `wp-config.php` or the customer plugin:
```php
add_filter( 'purecart_update_channel', fn() => 'beta' );
```

The update-check request includes `channel=beta` and the server returns the latest beta version.

---

## GitHub / Bitbucket Integration (Phase 4)

`GitHubSync` receives webhook events from GitHub or Bitbucket on tag push:

```
POST /wp-json/purecart/v1/plugin/github-webhook
Headers:
  X-Hub-Signature-256: sha256=<HMAC of payload>
Body: GitHub push event payload
```

On valid tag push event:
1. Verify HMAC signature against `purecart_github_webhook_secret` option
2. Identify product by matching repository name to `_purecart_github_repo` product meta
3. Download release ZIP from GitHub API using stored `purecart_github_token`
4. Call `VersionManager::add()` with tag name as version
5. Extract changelog from GitHub release description

This eliminates the manual upload step entirely — push a git tag → your store is updated automatically.

---

## Customer Plugin Integration

The customer's plugin must call your update endpoint. The simplest approach uses the `plugin-update-checker` library by YahnisElsts:

```php
// In your customer-facing plugin's main file
require 'vendor/yahnis-elsts/plugin-update-checker/plugin-update-checker.php';

$update_checker = YahnisElsts\PluginUpdateChecker\v5\PucFactory::buildUpdateChecker(
    'https://your-store.com/wp-json/purecart/v1/plugin/update-check?slug=my-plugin&license_key=' . get_option('my_plugin_license_key'),
    __FILE__,
    'my-plugin'
);
```

Alternatively, PureCart provides a lightweight client class customers can include directly.

---

## Product Meta Fields

| Meta Key | Type | Description |
|---|---|---|
| `_purecart_plugin_slug` | string | Unique plugin slug (matches wp-content/plugins/{slug}) |
| `_purecart_github_repo` | string | GitHub repo: `owner/repo` (Phase 4) |
| `_purecart_github_token` | string | GitHub personal access token for private repos |
| `_purecart_update_requires_license` | bool | Gate updates behind valid license |
| `_purecart_beta_channel_enabled` | bool | Allow beta release channel for this product |

---

## Developer Hooks

```php
// Filter update response before sending
apply_filters( 'purecart_update_check_response', $response, $product_id, $request );

// Fired after new version is added
do_action( 'purecart_version_added', $version_id, $product_id, $version_number );

// Fired after GitHub webhook triggers import
do_action( 'purecart_github_version_imported', $version_id, $product_id, $tag_name );

// Filter which channel a customer gets
apply_filters( 'purecart_update_channel', 'stable', $license_key, $domain );
```

---

## Competitive Context

| | plugin-update-checker (library) | EDD Software Licensing | purecart |
|---|---|---|---|
| Self-hosted update server | Partial (needs custom endpoint) | Yes (extension) | **Yes (built-in)** |
| License-gated updates | No | Yes | **Yes** |
| ZIP versioning + management | No | Partial | **Yes** |
| SHA-256 checksum | No | No | **Yes** |
| Release channels (beta/stable) | No | No | **Yes** |
| GitHub auto-import | No | No | **Yes (Phase 4)** |
| WooCommerce native | No | No (EDD) | **Yes** |
| Admin version management UI | No | Partial | **Yes** |
| Changelog delivery via API | No | Partial | **Yes** |
