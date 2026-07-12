# RND — Secure Downloads Module
**Plugin:** purecart
**Module:** Secure Downloads
**Phase:** 1 (MVP)
**Standalone:** Yes — works without any other PureCart module

---

## Overview

WooCommerce's built-in downloadable file system exposes direct file URLs after purchase. These URLs can be shared, scraped, or accessed without authorization. The Secure Downloads module replaces WooCommerce's download URLs with signed, expiring, count-limited tokens. Files are served through PHP — no direct URL is ever exposed to the customer.

### Problem It Solves
- WooCommerce download URLs are guessable or shareable
- No IP logging or geo-blocking on native WooCommerce downloads
- No download attempt counting beyond a basic WooCommerce setting
- No ability to block downloads by country

---

## Standalone Usage

Enable this module alone (without Licensing or Plugin Updates) to:
- Protect any WooCommerce downloadable product (PDFs, videos, templates, assets)
- Track every download event with IP address and timestamp
- Set per-order expiry windows and maximum download counts
- Optionally block downloads from specific countries

No license key system is required. The module works with standard WooCommerce downloadable products.

---

## Architecture

### Classes

| Class | File | Responsibility |
|---|---|---|
| `TokenManager` | `includes/Downloads/TokenManager.php` | Create, validate, and expire download tokens |
| `DownloadDispatcher` | `includes/Downloads/DownloadDispatcher.php` | Rewrite URL, validate token, stream file |
| `DownloadLogger` | `includes/Downloads/DownloadLogger.php` | Write IP, user-agent, country, timestamp log |
| `GeoBlocker` | `includes/Downloads/GeoBlocker.php` | Country-level allow/block list |
| `AdBlockDetector` | `includes/Downloads/AdBlockDetector.php` | Detect ad blocker and show inline notice (Phase 2) |
| `VideoProtector` | `includes/Downloads/VideoProtector.php` | Signed URL streaming for video files via JS player (Phase 2) |
| `MediaLibraryGuard` | `includes/Downloads/MediaLibraryGuard.php` | Protect WP media library files from direct URL access (Phase 2) |

### How the Token Flow Works

```
Order Completed
    │
    └── TokenManager::create_for_order_item()
            ├── Reads: purecart_download_expiry_seconds (default: DAY_IN_SECONDS)
            ├── Reads: purecart_download_max_count (default: 3)
            ├── Inserts row in wp_purecart_downloads
            └── Returns: 64-char hex token

Customer clicks Download link → /purecart-download/{token}
    │
    └── DownloadDispatcher::maybe_dispatch()
            ├── TokenManager::validate(token)
            │       ├── Check: expires_at > NOW()
            │       └── Check: download_count < max_downloads
            ├── GeoBlocker::check(ip_address) [if enabled]
            ├── DownloadLogger::record(token_id, ip, user_agent)
            ├── TokenManager::record_download(token_id, ip, user_agent)
            └── stream_file(file_path)
                    ├── ob_end_clean()
                    ├── header: Content-Type, Content-Disposition, Content-Length
                    └── readfile(file_path)
```

### Rewrite Rule

```php
// Registered in DownloadDispatcher::__construct()
add_rewrite_rule(
    '^purecart-download/([a-f0-9]{64})/?$',
    'index.php?purecart_download_token=$matches[1]',
    'top'
);
```

---

## Database Tables

### wp_purecart_downloads — Token Registry
```sql
CREATE TABLE wp_purecart_downloads (
    id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    order_id        BIGINT UNSIGNED NOT NULL,
    user_id         BIGINT UNSIGNED NOT NULL,
    product_id      BIGINT UNSIGNED NOT NULL,
    file_id         BIGINT UNSIGNED NOT NULL,
    token           VARCHAR(128) NOT NULL UNIQUE,
    download_count  INT UNSIGNED DEFAULT 0,
    max_downloads   INT UNSIGNED DEFAULT 3,
    expires_at      DATETIME NOT NULL,
    ip_address      VARCHAR(45),      -- IP at token creation
    country_code    VARCHAR(2),
    created_at      DATETIME NOT NULL,
    PRIMARY KEY (id),
    KEY idx_token (token),
    KEY idx_user_id (user_id),
    KEY idx_order_id (order_id)
);
```

### wp_purecart_download_logs — Per-Event Audit Log
```sql
CREATE TABLE wp_purecart_download_logs (
    id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    download_id     BIGINT UNSIGNED NOT NULL,  -- FK: wp_purecart_downloads.id
    ip_address      VARCHAR(45),
    user_agent      TEXT,
    country_code    VARCHAR(2),
    downloaded_at   DATETIME NOT NULL,
    PRIMARY KEY (id),
    KEY idx_download_id (download_id),
    KEY idx_downloaded_at (downloaded_at)
);
```

---

## REST API Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/purecart/v1/download/{token}` | Token (public) | Validate token and stream file |
| `POST` | `/purecart/v1/download/generate` | manage_woocommerce | Generate a new token manually (admin) |

Note: The primary download URL is a WordPress rewrite rule (`/purecart-download/{token}`), not a REST endpoint, to allow streaming with full header control.

---

## Configuration Options

All stored in `wp_options`:

| Option Key | Default | Description |
|---|---|---|
| `purecart_download_expiry_seconds` | `86400` (1 day) | How long a token is valid after order completion |
| `purecart_download_max_count` | `3` | Maximum number of times a token can be used |
| `purecart_geo_block_enabled` | `false` | Enable country-level blocking |
| `purecart_geo_block_mode` | `block` | `block` = deny listed countries; `allow` = only allow listed |
| `purecart_geo_blocked_countries` | `[]` | Array of 2-letter ISO country codes |
| `purecart_geo_detection_api` | `ip-api` | `ip-api` (free) or `maxmind` |
| `purecart_maxmind_license_key` | `''` | MaxMind license key (if using GeoLite2) |
| `purecart_adblock_detection_enabled` | `true` | Show notice when ad blocker detected on download page |
| `purecart_video_protect_enabled` | `false` | Serve video files via JS player instead of direct download |
| `purecart_media_library_guard_enabled` | `false` | Block direct URL access to protected uploads subfolder |
| `purecart_protected_uploads_subdir` | `purecart-protected` | Subfolder under `wp-content/uploads/` for protected files |

---

## WooCommerce Integration

```php
// Replace WooCommerce native download URL with PureCart token URL
add_filter(
    'woocommerce_downloadable_file_download_url',
    [ DownloadDispatcher::class, 'secure_download_url' ],
    10, 2
);

// Generate tokens when order completes
add_action(
    'woocommerce_order_status_completed',
    [ OrderHandler::class, 'on_order_completed' ]
);
```

---

## Token Security Properties

| Property | Implementation |
|---|---|
| Token format | 64 hex chars (`bin2hex(random_bytes(32))`) |
| Uniqueness | `UNIQUE` DB constraint; re-generates on collision |
| Expiry | Hard-coded `expires_at` in DB; checked server-side every request |
| Count limit | `download_count < max_downloads` enforced server-side |
| Direct URL exposure | Never — file path resolved server-side from product meta |
| File path resolution | `_purecart_file_path` product meta, then WooCommerce downloadable files |

---

## Geo-Blocking

GeoBlocker checks the requesting IP against the configured country list on every download attempt. Detection options:

**ip-api.com (free, no key):**
- `GET http://ip-api.com/json/{ip}?fields=countryCode`
- Rate limit: 45 requests/min from a single IP (sufficient for most stores)
- Results cached in WordPress transients for 24 hours per IP

**MaxMind GeoLite2 (free with registration):**
- Local database file — no external API call
- Requires periodic database update (GeoLite2-Country.mmdb)
- `composer require maxmind-db/reader` adds the PHP reader

---

## My Account Integration

The Downloads tab (`/my-account/purecart-downloads/`) shows:
- Product name
- Downloads used / max downloads
- Expiry date
- Download button (active token) or "Expired" badge (invalid token)

---

## Ad Blocker Detection (Phase 2)

Inspired by WPDM. When a customer is on the Downloads tab and an ad blocker is detected, a non-intrusive notice is shown explaining that their ad blocker may interfere with download tracking.

**Detection method:** inject a small script that attempts to load a fake `/wp-content/plugins/woo-digital-downloads/assets/js/ads.js` resource. Ad blockers block resources with `ads` in the path. If the request fails, the JS fires a notice.

```javascript
// assets/js/purecart-adblock-detect.js
const probe = new Image();
probe.src = purecartDownloads.adProbeUrl; // .../assets/images/ad.gif
probe.onerror = () => {
    document.querySelector('.purecart-adblock-notice')?.classList.remove('purecart-hidden');
};
```

**Notice copy (translatable):** "We detected an ad blocker. If your download doesn't start automatically, please disable your ad blocker for this site and try again."

Configurable: `purecart_adblock_detection_enabled` (bool, default `true`).

---

## Video Play-Protect (Phase 2)

For video file downloads (`.mp4`, `.webm`, `.mov`), PureCart can serve the video through a JS-based player instead of triggering a browser download. The player uses a short-lived signed token so the video URL cannot be hotlinked.

```
Customer clicks "Watch" → player overlay opens
    │
    └── JS requests: GET /purecart/v1/video-token/{download_token}
            ├── Validates download token (same rules as file download)
            ├── Issues a separate short-lived video stream token (10-min TTL)
            └── Returns { stream_url: "/purecart-stream/{video_token}" }

JS player (Video.js or HTML5 native) loads stream_url.
/purecart-stream/{video_token} → VideoProtector::stream()
    ├── Validates video_token (10-min expiry, single-use optional)
    ├── Reads file via readfile() in chunks
    └── Supports HTTP Range requests for scrubbing
```

Per-product toggle: `_purecart_video_protect` (bool). When off, video files are served as normal downloads.

---

## Media Library Protection (Phase 2)

By default, files uploaded to the WordPress Media Library are publicly accessible via direct URL (`/wp-content/uploads/...`). `MediaLibraryGuard` can block direct access to protected uploads and route them through PureCart token validation.

**Scope:** Only files attached to PureCart-protected products are blocked. Other media files remain publicly accessible.

**Implementation options (admin can choose):**
1. `.htaccess` rule (Apache): `Deny from all` on `wp-content/uploads/purecart-protected/` subfolder
2. Nginx config snippet (displayed in admin for manual paste)
3. PHP intercept via `template_redirect` (slowest but requires no server config)

Files for protected products should be uploaded to a separate "Protected Files" section in PureCart admin, not via the standard Media Library uploader, to keep them in the protected subfolder.

---

## Admin UI — Color Scheme Toggle (Phase 2)

Inspired by WPDM. The PureCart admin panel supports three color schemes selectable per-user:

| Mode | Description |
|---|---|
| Light | Default WP-compatible light scheme |
| Dark | Full dark mode for PureCart admin pages only (does not affect WP core) |
| System | Follows OS `prefers-color-scheme` media query automatically |

Implemented via a CSS custom property set on `<body class="purecart-admin">`:

```css
/* assets/css/purecart-admin.css */
body.purecart-admin[data-scheme="dark"]  { --purecart-bg: #1a1a2e; --purecart-text: #e0e0e0; ... }
body.purecart-admin[data-scheme="light"] { --purecart-bg: #ffffff; --purecart-text: #1a1a1a; ... }
```

Preference stored in user meta: `_purecart_admin_color_scheme` (`light` | `dark` | `system`). The JS reads it on page load and sets `data-scheme` on `<body>`.

---

## Developer Hooks

```php
// Fired before token is created
apply_filters( 'purecart_download_expiry_seconds', $seconds, $order_id, $product_id );
apply_filters( 'purecart_download_max_count', $count, $order_id, $product_id );

// Fired after token is created
do_action( 'purecart_download_token_created', $token_id, $order_id, $product_id );

// Fired before geo-block check (return true to allow regardless)
apply_filters( 'purecart_geo_block_bypass', false, $ip, $country_code, $token_id );

// Fired when file is successfully downloaded
do_action( 'purecart_file_downloaded', $token_id, $ip, $country_code, $user_agent );

// Fired when download is rejected (expired/exhausted)
do_action( 'purecart_download_rejected', $token_id, $reason, $ip );
```

---

## Competitive Context

| | WooCommerce Native | EDD Core | WPDM + Premium Packages | woo-digital-downloads |
|---|---|---|---|---|
| Signed expiring tokens | Partial (nonce-based) | Yes | No (direct URL) | **Yes (64-char hex)** |
| IP logging per download | No | Yes | Yes | **Yes** |
| Geo-blocking | No | No | No | **Yes** |
| Country detection | No | No | No | **Yes (ip-api/MaxMind)** |
| Count limit enforcement | WC setting only | Yes | Yes | **Yes (server-side)** |
| Direct URL exposure | Yes (if WC setting off) | No | Yes | **Never** |
| Customer download portal | Basic | Yes | Yes (standalone, not WC) | **Yes (My Account tab)** |
| Ad blocker detection | No | No | Yes | **Yes (Phase 2)** |
| Video play-protect | No | No | Yes | **Yes (Phase 2)** |
| Media library protection | No | No | Yes | **Yes (Phase 2)** |
| Admin dark mode | No | No | Yes | **Yes (Phase 2)** |
| Works with existing WC products | Native | No (EDD products) | Standalone only | **Yes** |
