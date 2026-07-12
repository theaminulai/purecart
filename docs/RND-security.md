# RND — Security & Anti-Piracy Module
**Plugin:** purecart
**Module:** Security & Anti-Piracy
**Phase:** 3
**Standalone:** Partial — rate limiting and geo-blocking work standalone; abuse detection requires Licensing module

---

## Overview

The Security module adds multiple layers of protection to prevent license abuse, unauthorized downloads, and API endpoint attacks. It includes IP rate limiting on the license activation endpoint, shared-license / multi-country detection, SHA-256 checksum verification on update ZIPs, geo-blocking on downloads, and concurrent download detection. Staging/localhost exemption (part of the Licensing module) is also documented here for completeness.

---

## Standalone Usage

**Without Licensing module:**
- Geo-blocking on downloads
- Rate limiting on any PureCart REST endpoint
- SHA-256 checksum verification (requires Plugin Updates module)

**With Licensing module:**
- All of the above plus:
- Shared license / multi-country detection
- Concurrent activation detection
- Remote kill-switch (see Licensing RND)

---

## Architecture

### Classes

| Class | File | Responsibility |
|---|---|---|
| `RateLimiter` | `includes/Security/RateLimiter.php` | Throttle activation/download attempts per IP |
| `AbuseDetector` | `includes/Security/AbuseDetector.php` | Detect shared license, multi-country use |
| `ChecksumVerifier` | `includes/Security/ChecksumVerifier.php` | SHA-256 verification on update ZIPs |
| `GeoBlocker` | `includes/Downloads/GeoBlocker.php` | Country-level allow/block on downloads |

---

## 1. Rate Limiting

`RateLimiter` intercepts every call to `POST /purecart/v1/license/activate` before it reaches `LicenseActivator`.

### Implementation

```php
// Stored in WP transients: key = 'purecart_rl_{ip_hash}', value = attempt count
// TTL = purecart_rate_limit_window_seconds (default: 3600)

$ip_hash   = md5( $ip_address );
$transient = "purecart_rl_{$ip_hash}";
$attempts  = (int) get_transient( $transient );

if ( $attempts >= $limit ) {
    return new WP_Error( 'rate_limited', 'Too many activation attempts. Try again later.', [ 'status' => 429 ] );
}

set_transient( $transient, $attempts + 1, $window_seconds );
```

### Configuration

| Option | Default | Description |
|---|---|---|
| `purecart_rate_limit_enabled` | `true` | Enable rate limiting |
| `purecart_rate_limit_max_attempts` | `10` | Max activations from one IP per window |
| `purecart_rate_limit_window_seconds` | `3600` | Window duration (1 hour) |
| `purecart_rate_limit_endpoints` | `['license/activate']` | Which endpoints to rate-limit |

### IP Detection

```php
// RateLimiter::get_client_ip()
// Checks headers in order (trusted proxy support):
$headers = [
    'HTTP_CF_CONNECTING_IP',   // Cloudflare
    'HTTP_X_FORWARDED_FOR',    // Load balancers / proxies
    'HTTP_X_REAL_IP',          // nginx
    'REMOTE_ADDR',             // Direct connection
];
```

---

## 2. Shared License / Multi-Country Abuse Detection

`AbuseDetector` runs on each `/license/check` call and on the daily cron job.

### Detection Logic

```
For each active license:
    │
    ├── Fetch all activation records from wp_purecart_license_activations
    │
    ├── Check: activations from > N distinct countries in last 30 days?
    │       Threshold: purecart_abuse_max_countries (default: 3)
    │       Source: wp_purecart_download_logs.country_code per license_id
    │
    ├── Check: activation requests from > N distinct IPs in 24 hours?
    │       Threshold: purecart_abuse_max_ips_24h (default: 10)
    │
    └── If threshold exceeded:
            ├── SET license status = 'suspended'
            ├── Fire: do_action('purecart_license_abuse_detected', $license_id, $reason, $data)
            └── Send admin notification email
```

### Configuration

| Option | Default | Description |
|---|---|---|
| `purecart_abuse_detection_enabled` | `true` | Enable abuse detection |
| `purecart_abuse_max_countries` | `3` | Max distinct countries per license per 30 days |
| `purecart_abuse_max_ips_24h` | `10` | Max distinct IPs activating a license in 24 hours |
| `purecart_abuse_action` | `suspend` | `suspend` or `notify_only` |
| `purecart_abuse_notify_email` | admin email | Email to receive abuse alerts |

---

## 3. SHA-256 Checksum Verification

When a plugin ZIP is uploaded via the version manager:

```php
// VersionManager::add()
$checksum = hash_file( 'sha256', $absolute_file_path );
// Stored in wp_purecart_product_versions.checksum_sha256
```

The checksum is returned in the update-check response. The customer's plugin verifies it before installation:

```php
// In customer plugin's update-checker integration:
$downloaded_file = download_url( $response['download_url'] );
$actual_checksum = hash_file( 'sha256', $downloaded_file );

if ( $actual_checksum !== $response['checksum_sha256'] ) {
    // ZIP integrity check failed — abort installation
    return new WP_Error( 'checksum_mismatch', 'Downloaded file integrity check failed.' );
}
```

---

## 4. Geo-Blocking

Documented in full in `docs/RND-secure-downloads.md`. Summary:

- Country list maintained in `purecart_geo_blocked_countries` (2-letter ISO codes)
- Mode: `block` (deny listed) or `allow` (only allow listed)
- Detection: ip-api.com (free, rate-limited) or MaxMind GeoLite2 (local, free)
- Applied: every download request through DownloadDispatcher
- Bypass: filterable via `purecart_geo_block_bypass` hook

---

## 5. Staging / Localhost Exemption

Documented in `docs/RND-licensing.md`. Summary:

Domains matching these patterns do not count against the activation limit:
- `localhost`, `127.0.0.1`, `::1`
- `.local`, `.test`, `.dev`
- `.staging.`, `staging.`

Environment is recorded as `local` or `staging` in `wp_purecart_license_activations` for audit purposes. Filterable via `purecart_staging_exempt_patterns` hook.

---

## 6. Concurrent Download Detection

If a download token is being used from more than one IP simultaneously (possible when a download URL is shared), the download log will show multiple IPs within a short time window for the same token.

Detection rule (runs hourly via Action Scheduler):
```
SELECT download_id, COUNT(DISTINCT ip_address) as ip_count
FROM wp_purecart_download_logs
WHERE downloaded_at > DATE_SUB(NOW(), INTERVAL 5 MINUTE)
GROUP BY download_id
HAVING ip_count > 2
```

If concurrent IPs detected:
- Admin notification fired: `do_action('purecart_concurrent_download_detected', $token_id, $ips)`
- Optional: revoke token (`purecart_revoke_on_concurrent_download` option, default: false)

---

## 7. VPN Detection (Optional, Phase 3+)

VPN detection is a future integration using a third-party API (e.g., ipqualityscore.com or proxycheck.io). When enabled:
- VPN/proxy/Tor detected on download request → reject or flag
- License activation from known VPN exits → flag for manual review
- Results cached per IP for 24 hours

Not implemented in Phase 3 MVP; planned as an opt-in option in Phase 3 final.

---

## Security Hardening Checklist

### REST API
- [ ] All license endpoints require nonce or license key authentication
- [ ] Admin endpoints (`/license/revoke`, `/saas/provision`) require `manage_woocommerce` capability
- [ ] Rate limiting on activation endpoint (429 response on excess)
- [ ] Input sanitization on all REST parameters (domain, license key, API key)
- [ ] Output escaping on all REST responses

### File Delivery
- [ ] No direct file URLs exposed — all downloads go through PHP stream
- [ ] Token validated server-side on every request (no client-side expiry)
- [ ] File path resolved server-side (no user-provided path)
- [ ] `Content-Disposition: attachment` header prevents inline execution
- [ ] PHP output buffering cleared before streaming

### Webhooks (Outbound)
- [ ] HMAC-SHA256 signature on all outbound webhook payloads
- [ ] Webhook secret stored in wp_options (not hardcoded)
- [ ] Webhook payload filtered before sending (no sensitive data leak)

### JWT
- [ ] Short-lived access tokens (10-min expiry)
- [ ] Refresh tokens stored server-side (not in cookie only)
- [ ] `firebase/php-jwt` used directly (no WordPress plugin dependency)
- [ ] JWT secret auto-generated on activation, stored in wp_options

### Database
- [ ] All custom queries use `$wpdb->prepare()`
- [ ] License keys stored in DB (not encrypted, but not transmitted in logs)
- [ ] API keys stored in DB — never logged or exposed in error messages
- [ ] `wp_purecart_download_logs` retains IPs — handle in privacy policy and GDPR erasure

---

## Competitor Comparison

| Feature | WooCommerce Native | EDD | Wordfence | purecart |
|---|---|---|---|---|
| License activation rate limiting | ❌ | Partial | ❌ | **✅ WP transients, per-IP, configurable** |
| Multi-country / shared license detection | ❌ | ❌ | ❌ | **✅ Country threshold per license** |
| Geo-blocking on downloads | ❌ | ❌ | Premium only | **✅ ip-api.com / MaxMind GeoLite2** |
| SHA-256 checksum on update ZIPs | ❌ | ❌ | ❌ | **✅ Server + client verification** |
| Concurrent download detection | ❌ | ❌ | ❌ | **✅ Multi-IP same token detection** |
| Remote license kill-switch | ❌ | ✅ (paid) | ❌ | **✅ Instant revoke via REST** |
| Staging/localhost exemption | ❌ | Basic | ❌ | **✅ Pattern-based, no activation cost** |
| Webhook HMAC-SHA256 signing | ❌ | ❌ | ❌ | **✅ X-PureCart-Sig on all outbound calls** |
| GDPR-aware IP logging | ❌ | Partial | ❌ | **✅ Erasure hook, configurable retention** |
| Zero extra plugin dependencies | — | Paid add-on | Separate plugin | **✅ Built into PureCart** |

---

## Developer Hooks

```php
// Rate limiter — filter the limit per endpoint
apply_filters( 'purecart_rate_limit_max', $max, $endpoint, $ip );

// Abuse detector — fire when license flagged
do_action( 'purecart_license_abuse_detected', $license_id, $reason, $data );

// Geo-block bypass — return true to allow regardless of country
apply_filters( 'purecart_geo_block_bypass', false, $ip, $country_code, $token_id );

// Concurrent download detected
do_action( 'purecart_concurrent_download_detected', $token_id, $ip_list );

// Checksum mismatch on update download
do_action( 'purecart_checksum_mismatch', $version_id, $expected, $actual );
```
