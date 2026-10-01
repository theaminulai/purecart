# PureCart — Free vs Pro Feature Plan

**Plugin:** PureCart for WooCommerce  
**Date:** 2026-09-28  
**Status:** Proposal — for discussion before implementation  
**Based on:** Full review of all RND documents in `docs/`

---

## Pricing Summary

| Plan | Price | Sites | Best For |
|---|---|---|---|
| **Free** | $0 | 1 | Creators selling downloads, ebooks, templates, design assets |
| **Personal** | $99/yr · $249 one-time | 1 | Solo plugin/theme developers, indie SaaS founders |
| **Enterprise** | $299/yr · $799 one-time | Unlimited | Agencies, multi-product software businesses, marketplace operators |

> **Why we can price below EDD:** WooCommerce handles checkout, payments, coupons, taxes, and orders for free. PureCart adds only what WooCommerce is missing — so merchants pay for real capability, not duplicated commerce infrastructure. EDD's comparable plan stack runs $499–$999/yr for similar coverage on 3 sites.

---

## Module Availability at a Glance

| Module | Free | Personal | Enterprise |
|---|:---:|:---:|:---:|
| Secure Downloads | Core | Advanced | Full |
| License Key Management | — | ✅ | ✅ |
| Plugin & Software Auto-Updates | — | ✅ | ✅ |
| Subscription Tracking | — | ✅ | ✅ |
| SaaS Provisioning | — | — | ✅ |
| Security & Anti-Piracy | Basic | Standard | Full |
| Git Integration (GitHub/Bitbucket) | — | — | ✅ |
| Abandoned Cart Recovery (built-in) | — | ✅ | ✅ |
| Affiliate Program (built-in) | — | — | ✅ |
| Analytics & Reporting | Basic | Standard | Full |
| Cloud Storage (S3 / Cloudflare R2) | — | — | ✅ |
| Customer Dashboard (My Account) | Basic | Standard | Full |
| Developer Hooks & REST API | Partial | ✅ | ✅ |
| WP-CLI Commands | — | ✅ | ✅ |
| Priority Support | — | — | ✅ |

---

## Detailed Feature Tables

### Secure Downloads

| Feature | Free | Personal | Enterprise |
|---|:---:|:---:|:---:|
| Signed, expiring download tokens (64-char hex, HMAC-SHA256) | ✅ | ✅ | ✅ |
| PHP file streaming — no direct URL ever exposed | ✅ | ✅ | ✅ |
| Per-order download count limit (0 = unlimited) | ✅ | ✅ | ✅ |
| Configurable token expiry (global + per-product) | ✅ | ✅ | ✅ |
| Multiple files per product (one token per file per order item) | ✅ | ✅ | ✅ |
| Token revocation on order refund / cancellation | ✅ | ✅ | ✅ |
| Download audit log (IP, user agent, country, status) | ✅ | ✅ | ✅ |
| Denied-attempt logging (expired, exhausted, geo-blocked, license-inactive) | ✅ | ✅ | ✅ |
| License-gated downloads (require active license before serving) | — | ✅ | ✅ |
| X-Sendfile / X-Accel-Redirect delivery (Apache / nginx zero-copy) | — | ✅ | ✅ |
| Customer link regeneration from My Account (admin-controlled) | — | ✅ | ✅ |
| Ad blocker detection notice on downloads page | — | ✅ | ✅ |
| Video play-protect (JS player, separate stream token, no raw download) | — | ✅ | ✅ |
| HTTP range requests for video player scrubbing | — | ✅ | ✅ |
| Protected uploads directory + `.htaccess` / nginx guard | — | ✅ | ✅ |
| Cloud storage: Amazon S3 (presigned URL delivery) | — | — | ✅ |
| Cloud storage: Cloudflare R2 (no egress fees) | — | — | ✅ |
| Geo-blocking (country-level allow / block list) | — | — | ✅ |
| Download throttling (max N per hour per IP) | — | — | ✅ |
| IP binding (lock token to the first-use IP) | — | — | ✅ |
| CloudFront / CDN signed URL delivery | — | — | ✅ |
| PDF watermarking (embed customer email / order ID in PDF metadata) | — | — | ✅ |

---

### License Key Management

| Feature | Free | Personal | Enterprise |
|---|:---:|:---:|:---:|
| Cryptographically random key generation (`random_bytes()` — no static files) | — | ✅ | ✅ |
| Domain-level activation tracking (DB row per activation) | — | ✅ | ✅ |
| Activation limit enforcement (single / multi / unlimited / lifetime) | — | ✅ | ✅ |
| Staging / localhost auto-exemption from activation limits | — | ✅ | ✅ |
| Remote kill-switch (instant revocation via REST, 403 on next check) | — | ✅ | ✅ |
| License expiry enforcement (daily Action Scheduler cron) | — | ✅ | ✅ |
| License key reveal (blurred by default, click to show) | — | ✅ | ✅ |
| Copy-to-clipboard button on key display | — | ✅ | ✅ |
| Manual domain activation from My Account (no plugin install needed) | — | ✅ | ✅ |
| Multi-quantity key delivery (one key per unit for qty > 1) | — | ✅ | ✅ |
| Delivery status configurable: completed / processing / both | — | ✅ | ✅ |
| Renewal behavior per product: extend expiry OR issue new key | — | ✅ | ✅ |
| REST API: activate, deactivate, check, revoke, ping | — | ✅ | ✅ |
| **JWT layer: 7-day offline-validated access token issued on activation** | — | ✅ | ✅ |
| **JWT refresh tokens (30-day, server-side rotation, per-domain sessions)** | — | ✅ | ✅ |
| **Feature flags in JWT `lic` claim (gate features without network call)** | — | ✅ | ✅ |
| **HS256 JWT signing (firebase/php-jwt, no extra plugin dependency)** | — | ✅ | ✅ |
| Past-order retroactive key generation (admin tool + WP-CLI) | — | ✅ | ✅ |
| Order item meta (`_purecart_license_id`) for developer access | — | ✅ | ✅ |
| Expiry warning emails (14-day and 3-day reminders, configurable) | — | ✅ | ✅ |
| PDF license certificate download (Phase 3) | — | — | ✅ |
| QR code on license certificate (Phase 3) | — | — | ✅ |
| RS256 JWT (asymmetric — needed for open-source plugins, Phase 2) | — | — | ✅ |
| Validate by customer ID (`GET /license/check?user_id={id}`) | — | — | ✅ |
| Migration tool: DLM, WC Serial Numbers, LMFWC (WP-CLI) | — | — | ✅ |
| White-label licensing (custom key format, custom branding) | — | — | ✅ |
| Agency license pool (manage keys across client sites) | — | — | ✅ |

---

### Plugin & Software Auto-Updates

| Feature | Free | Personal | Enterprise |
|---|:---:|:---:|:---:|
| Self-hosted WP plugin update server (appears in WP Admin → Plugins) | — | ✅ | ✅ |
| Self-hosted WP theme update server | — | ✅ | ✅ |
| **Non-WP software updates (desktop apps, CLI tools, SDKs, fonts)** | — | ✅ | ✅ |
| **Per-platform packages: macOS, Windows, Linux (arm64/x64)** | — | ✅ | ✅ |
| Single-file `PureCartUpdater.php` drop-in (no Composer in customer plugin) | — | ✅ | ✅ |
| ZIP upload + version management (admin UI) | — | ✅ | ✅ |
| SHA-256 checksum computed at upload, verified on download | — | ✅ | ✅ |
| Changelog storage and delivery (separate DB field, editable without re-upload) | — | ✅ | ✅ |
| Release channels: stable / beta / nightly (per-product + per-license override) | — | ✅ | ✅ |
| License-gated update delivery (require active license) | — | ✅ | ✅ |
| Free plugin updates (no license gate for freemium models) | — | ✅ | ✅ |
| Customer update email on new stable release (batched, Action Scheduler) | — | ✅ | ✅ |
| Signed 15-minute single-use download tokens (HMAC, replay protection) | — | ✅ | ✅ |
| WP-CLI: list, upload, delete, rollback, generate-url | — | ✅ | ✅ |
| Version history table with per-version download counts | — | ✅ | ✅ |
| Rollback to previous version (admin + customer, Phase 2) | — | — | ✅ |
| Electron / Squirrel auto-update feed (`/latest.json`, Phase 2) | — | — | ✅ |
| Minisign / GPG package signing + `/public-key` endpoint (Phase 2) | — | — | ✅ |
| GitHub webhook → auto ZIP import on tag push (Phase 3) | — | — | ✅ |
| Bitbucket webhook receiver (Phase 3) | — | — | ✅ |
| Auto-changelog from GitHub release body (Phase 3) | — | — | ✅ |
| Delta / binary-diff updates (Phase 3) | — | — | ✅ |
| Composer package repository endpoint `/packages.json` (Phase 3) | — | — | ✅ |

---

### Subscription Tracking

| Feature | Free | Personal | Enterprise |
|---|:---:|:---:|:---:|
| Subscription state tracking linked to license expiry | — | ✅ | ✅ |
| 2-phase grace period: active grace → on-hold → cancellation | — | ✅ | ✅ |
| Failed payment dunning email sequence | — | ✅ | ✅ |
| Skip next renewal (customer self-service in My Account) | — | ✅ | ✅ |
| Pause / vacation mode (configurable max duration + cooldown) | — | ✅ | ✅ |
| Plan upgrade / downgrade with 3 proration methods | — | ✅ | ✅ |
| Renewal sync (align all renewals to a shared calendar date) | — | ✅ | ✅ |
| Stepped renewal pricing (different price after N cycles) | — | ✅ | ✅ |
| One-trial-per-customer enforcement (prevents trial abuse) | — | ✅ | ✅ |
| License behavior on renewal: extend expiry OR issue new key | — | ✅ | ✅ |
| WP role assignment based on subscription status | — | ✅ | ✅ |
| Retention flow on cancellation (offer discount / pause before cancel) | — | — | ✅ |
| Retention analytics (churn reasons, offer acceptance rate) | — | — | ✅ |

---

### SaaS Provisioning

| Feature | Free | Personal | Enterprise |
|---|:---:|:---:|:---:|
| Outbound webhook on order complete → provision SaaS account | — | — | ✅ |
| HMAC-SHA256 signed webhook payload (`X-PureCart-Sig` header) | — | — | ✅ |
| API key generation (`purecart_` prefix + 48 hex chars) | — | — | ✅ |
| JWT issuer for SaaS login (HS256, 10-min access / 30-day refresh) | — | — | ✅ |
| Webhook events: provision, suspend, activate, cancel, plan_change | — | — | ✅ |
| Account suspension on refund / subscription failure | — | — | ✅ |
| Re-activation webhook on payment recovery | — | — | ✅ |
| Plan sync on WooCommerce upgrade / downgrade | — | — | ✅ |
| API key rotation (customer-initiated, fires webhook with new key) | — | — | ✅ |
| Double-provisioning prevention (`_purecart_provisioned` order meta guard) | — | — | ✅ |
| Usage stats endpoint: `GET /saas/usage/{api_key}` | — | — | ✅ |
| API Keys tab in My Account | — | — | ✅ |
| Usage / plan status tab in My Account | — | — | ✅ |

---

### Security & Anti-Piracy

| Feature | Free | Personal | Enterprise |
|---|:---:|:---:|:---:|
| Token validation on every download request (no client-side trust) | ✅ | ✅ | ✅ |
| Order status and entitlement check before serving any file | ✅ | ✅ | ✅ |
| IP logging per download event | ✅ | ✅ | ✅ |
| GDPR-compliant log retention (configurable, WC privacy eraser hooked) | ✅ | ✅ | ✅ |
| Rate limiting on license activation endpoint (transient-based, per IP) | — | ✅ | ✅ |
| Rate limiting on download endpoint | — | ✅ | ✅ |
| Rate limiting on JWT token refresh endpoint | — | ✅ | ✅ |
| SHA-256 checksum verification on update ZIPs (server + client) | — | ✅ | ✅ |
| Trusted proxy IP detection (Cloudflare, X-Forwarded-For, nginx) | — | ✅ | ✅ |
| Shared license / multi-country abuse detection (auto-suspend on threshold) | — | — | ✅ |
| Concurrent download detection (multiple IPs using same token simultaneously) | — | — | ✅ |
| Geo-blocking: country-level allow / block list | — | — | ✅ |
| Geo detection: ip-api.com (free) or MaxMind GeoLite2 (local, no rate limit) | — | — | ✅ |
| IP block list management (admin UI) | — | — | ✅ |
| VPN / proxy detection (3rd-party API, opt-in, Phase 3+) | — | — | ✅ |
| Audit logs — all admin mutations (license revoke, account suspend, etc.) | — | — | ✅ |

---

### Abandoned Cart Recovery

> Fully built-in — no third-party plugin required.

| Feature | Free | Personal | Enterprise |
|---|:---:|:---:|:---:|
| Cart abandonment detection (Action Scheduler, every 15 min) | — | ✅ | ✅ |
| Configurable inactivity timeout before cart is "abandoned" (default: 60 min) | — | ✅ | ✅ |
| Persistent cart DB table with status machine (active → abandoned → recovered) | — | ✅ | ✅ |
| Sequenced recovery emails (3 emails via WC email infrastructure) | — | ✅ | ✅ |
| Configurable email delays: 1h / 24h / 72h (defaults) | — | ✅ | ✅ |
| Custom email subject lines per step | — | ✅ | ✅ |
| One-click cart restore link (signed 64-char token, 7-day TTL) | — | ✅ | ✅ |
| Auto-generated WC coupon per email step (configurable %, single-use) | — | ✅ | ✅ |
| Coupon auto-applied on restore link click | — | ✅ | ✅ |
| Email sequence stops automatically when order is placed | — | ✅ | ✅ |
| Guest cart capture (optional — before email is known) | — | ✅ | ✅ |
| Recovery stats: total abandoned, total recovered, recovery rate %, revenue | — | ✅ | ✅ |
| Admin dashboard: cart list, manual email trigger, delete | — | ✅ | ✅ |
| WC email template override (theme/woocommerce/emails/) | — | ✅ | ✅ |
| GDPR: unsubscribe link, erasure on privacy request, no IP in cart records | — | ✅ | ✅ |
| 90-day cart data retention with automatic cleanup | — | ✅ | ✅ |
| REST API admin endpoints (list, detail, send email, delete) | — | ✅ | ✅ |

---

### Affiliate Program

> Fully built-in — no third-party plugin required.

| Feature | Free | Personal | Enterprise |
|---|:---:|:---:|:---:|
| Affiliate registration (shortcode + block powered page) | — | — | ✅ |
| Unique referral link (`?ref={code}`) + pretty permalink option | — | — | ✅ |
| Cookie tracking (configurable TTL, default 30 days, secure + SameSite) | — | — | ✅ |
| Last-click attribution (first-click configurable via filter) | — | — | ✅ |
| Commission rules: global default, per-product override, per-affiliate override | — | — | ✅ |
| Commission types: percentage of subtotal or flat amount | — | — | ✅ |
| Recurring commissions on subscription renewals | — | — | ✅ |
| Higher first-order rate (e.g., 50% first, 20% recurring) | — | — | ✅ |
| Commission approval: automatic or manual per-admin | — | — | ✅ |
| Commission reversal on order refund | — | — | ✅ |
| Self-referral prevention (configurable) | — | — | ✅ |
| Payout management (batch by date range, minimum threshold) | — | — | ✅ |
| PayPal Mass Pay CSV export | — | — | ✅ |
| Affiliate My Account dashboard (referral link, stats, commissions, payouts) | — | — | ✅ |
| Admin panel: affiliates, commissions, payouts, settings | — | — | ✅ |
| Click tracking table (`affiliate_clicks` DB) | — | — | ✅ |
| REST API: register, approve, suspend, commissions, payouts | — | — | ✅ |

---

### Analytics & Reporting

| Feature | Free | Personal | Enterprise |
|---|:---:|:---:|:---:|
| Download audit log visible in admin (IP, country, status, timestamp) | ✅ | ✅ | ✅ |
| Denied download attempts visible in log | ✅ | ✅ | ✅ |
| Token status admin table (active / expired / exhausted) | ✅ | ✅ | ✅ |
| Download stats per product (chart, configurable date range) | — | ✅ | ✅ |
| License stats: active / expired / revoked / suspended counts | — | ✅ | ✅ |
| Licenses expiring in 30 days (renewal opportunity report) | — | ✅ | ✅ |
| License activation rate (avg activations per license) | — | ✅ | ✅ |
| Export to CSV (downloads, licenses) | — | ✅ | ✅ |
| Revenue metrics: MRR, ARR, New MRR, Churned MRR, Net Growth | — | — | ✅ |
| Churn rate + LTV dashboard | — | — | ✅ |
| MRR trend chart (12-month line graph) | — | — | ✅ |
| Download stats by version (version adoption heatmap) | — | — | ✅ |
| Update adoption: % of licenses on latest vs older versions | — | — | ✅ |
| Geographic distribution of downloads (top countries) | — | — | ✅ |
| Affiliate performance report (revenue per affiliate) | — | — | ✅ |
| Dunning outcome report (which email recovered most failed payments) | — | — | ✅ |
| Cohort analysis (revenue retention by signup month) | — | — | ✅ |
| WooCommerce Analytics integration | — | — | ✅ |
| Analytics cache with admin-clearable WP transients (1-hour TTL) | — | ✅ | ✅ |
| WP-CLI: `wp purecart analytics mrr`, `wp purecart analytics export` | — | — | ✅ |

---

### Customer Dashboard (My Account)

| Feature | Free | Personal | Enterprise |
|---|:---:|:---:|:---:|
| Downloads tab: file list, count used/limit, expiry, download button | ✅ | ✅ | ✅ |
| Expired / exhausted / license-inactive states with actionable notice | ✅ | ✅ | ✅ |
| Re-send download links button (rate-limited: once per 10 min per order) | ✅ | ✅ | ✅ |
| Order detail augmentation (license + downloads on standard orders page) | ✅ | ✅ | ✅ |
| Thank-you page: license key + download links immediately after purchase | ✅ | ✅ | ✅ |
| Licenses tab: key reveal, copy, status, sites used/limit, expiry | — | ✅ | ✅ |
| Manual domain activation form in My Account | — | ✅ | ✅ |
| Deactivate domain button (staging domains exempt, shown with badge) | — | ✅ | ✅ |
| License expiry states: expired card with Renew button, revoked card | — | ✅ | ✅ |
| Updates tab: update-available card, changelog, download button | — | ✅ | ✅ |
| Update notification banner for WP plugin updates via WP dashboard | — | ✅ | ✅ |
| Dashboard summary widget (license / download / update counts) | — | ✅ | ✅ |
| Product detail unified page: License + Downloads + Updates in one view | — | ✅ | ✅ |
| Transactional email: License & Download Delivery (order complete) | ✅ | ✅ | ✅ |
| Transactional email: License Expiry Warning (14-day + 3-day reminders) | — | ✅ | ✅ |
| Transactional email: Update Available notification (stable release) | — | ✅ | ✅ |
| Transactional email: Activation Confirmation (admin-toggled) | — | ✅ | ✅ |
| Theme template override system (`theme/purecart/...`) | ✅ | ✅ | ✅ |
| API Keys tab (SaaS key, plan, status, rotate button) | — | — | ✅ |
| Usage / plan status tab | — | — | ✅ |
| PDF license certificate download (Phase 3) | — | — | ✅ |
| Geo-aware download notices ("Not available in your region") | — | — | ✅ |
| WPML / Polylang My Account template integration (Phase 3) | — | — | ✅ |
| Login as User (admin impersonation for support) | — | — | ✅ |

---

### Developer & Platform

| Feature | Free | Personal | Enterprise |
|---|:---:|:---:|:---:|
| All `purecart_*` action hooks | Partial | ✅ | ✅ |
| All `purecart_*` filter hooks | Partial | ✅ | ✅ |
| REST API: downloads, licenses, updates | Download only | ✅ | ✅ |
| REST API: SaaS, affiliates, abandoned carts, analytics | — | Partial | ✅ |
| Outgoing webhooks: license events, subscription events, SaaS events | — | — | ✅ |
| WP-CLI: license, update, analytics, migration commands | — | ✅ | ✅ |
| Settings export / import (JSON) | — | ✅ | ✅ |
| Module-level enable / disable toggles (zero overhead when off) | ✅ | ✅ | ✅ |
| HPOS compatible (wc_get_order() only, no wp_posts queries) | ✅ | ✅ | ✅ |
| WooCommerce Blocks (Cart / Checkout) compatible | ✅ | ✅ | ✅ |
| Action Scheduler for all background jobs (no raw wp_cron) | ✅ | ✅ | ✅ |
| Custom DB tables with indexed queries (no post meta for high-volume data) | ✅ | ✅ | ✅ |
| Multisite support | — | — | ✅ |
| White-label (remove PureCart branding from customer-facing UI) | — | — | ✅ |

---

### Support & License Terms

| Feature | Free | Personal | Enterprise |
|---|:---:|:---:|:---:|
| Community support (WordPress.org forum) | ✅ | ✅ | ✅ |
| Email / ticket support | — | Standard | Priority |
| Sites included | 1 | 1 | Unlimited |
| Annual updates included | — | 1 year | 1 year |
| Lifetime deal | — | $249 one-time | $799 one-time |
| Client use (install on client sites) | — | — | ✅ |

---

## Rationale for Tier Boundaries

### Why Secure Downloads is Free

Secure file delivery solves a complete problem for a large audience — ebook sellers, template creators, font vendors, and any merchant selling files who want better than WooCommerce's native download links. Giving this away free creates a massive top-of-funnel and positions PureCart against EDD's free tier (which also includes download protection). The Free tier must be usable end-to-end, not just a teaser.

### Why Licensing is Personal (not Free)

Software licensing replaces tools priced at $149–$399/yr (EDD Software Licensing $199/yr, AffiliateWP $149/yr, DLM Pro). At $99/yr, Personal delivers compelling value compared to those alternatives for the single-product plugin developer. The JWT layer (offline validation, no network call on each boot) is an additional technical differentiator that justifies the upgrade. Keeping licensing out of Free maintains a clear value distinction while free-tier users still get industry-leading download security.

### Why Abandoned Cart is Personal

Standalone abandoned cart plugins (Cart Abandonment Recovery by Brainstorm Force) are free with 300,000+ installs. PureCart's built-in cart recovery with auto-coupons, signed restore links, and recovery analytics is a complete replacement that removes one external dependency. At Personal, it bundles a feature merchants currently pay for (CartBounty Pro, Tychesoftwares Pro) while making PureCart a more integrated platform.

### Why Affiliates is Enterprise only

Full affiliate program management (AffiliateWP charges $149/yr, Solid Affiliate $149/yr) serves a distinct go-to-market motion — merchants who have established a product and want a partner sales channel. These are larger, more sophisticated operations that match the Enterprise buyer profile. Including affiliates in Personal would add onboarding complexity for users who just need license delivery.

### Why SaaS Provisioning is Enterprise only

SaaS provisioning (JWT, webhook-based account creation, API key management) requires server-to-server integration work and appeals to a narrower technical audience — SaaS founders selling cloud-hosted products. It adds significant support surface. Enterprise's unlimited site license also fits the agency / reseller profile that often builds SaaS products on behalf of clients.

### Why analytics is graduated

Basic download logs (who downloaded what, when, from where) are a Free accountability feature. License stats and per-product download charts belong in Personal — growing businesses need to understand their customer base. Revenue dashboards (MRR, ARR, LTV, churn, cohorts) are Enterprise: a store needs meaningful subscription data before these are actionable, and the audience that cares about MRR is the same one buying Enterprise.

### Why cloud storage is Enterprise

S3/R2 integration adds external service costs, server-side configuration, and support overhead. Most stores start with local files and graduate to cloud storage as their catalogue or download volume grows. That growth trajectory maps to an Enterprise buyer, not a solo developer just starting out.

---

## Competitive Positioning

### vs Easy Digital Downloads (EDD)

EDD is a commerce platform, not a WooCommerce add-on. PureCart merchants already have WooCommerce handling checkout, payments, orders, coupons, taxes, and product management for free — they are not paying for those features again with PureCart.

| Capability | EDD $99/yr (1 site) | EDD $499/yr (3 sites) | PureCart Personal $99/yr | PureCart Enterprise $299/yr |
|---|:---:|:---:|:---:|:---:|
| WooCommerce native | ❌ | ❌ | ✅ | ✅ |
| Self-hosted (no platform fees) | ✅ | ✅ | ✅ | ✅ |
| Secure downloads | ✅ | ✅ | ✅ | ✅ |
| Software licensing | ❌ ($199 add-on) | ❌ | ✅ | ✅ |
| Plugin auto-updates | ❌ ($199+ add-on) | ❌ | ✅ | ✅ |
| Non-WP software updates | ❌ | ❌ | ✅ | ✅ |
| Subscription bridge | ❌ ($209 add-on) | ❌ | ✅ | ✅ |
| JWT offline license validation | ❌ | ❌ | ✅ | ✅ |
| Staging site exemption | Basic | Basic | ✅ | ✅ |
| Abandoned cart (built-in) | ❌ | ❌ | ✅ | ✅ |
| SaaS provisioning | ❌ | ❌ | ❌ | ✅ |
| Geo-blocking | ❌ | ❌ | ❌ | ✅ |
| Affiliate program (built-in) | ❌ | ❌ | ❌ | ✅ |
| GitHub → auto-update sync | ❌ | ❌ | ❌ | ✅ |
| Unlimited sites | ❌ (3 max) | ❌ (3 max) | ❌ (1 site) | ✅ |
| Sites for price | 1 | 3 | 1 | Unlimited |

### vs Standalone Tools (replaced by PureCart Enterprise)

| Tool | Price | Replaced by |
|---|---|---|
| EDD Software Licensing | $199/yr | PureCart Personal licensing module |
| AffiliateWP | $149/yr | PureCart Enterprise affiliate module |
| Solid Affiliate | $149/yr | PureCart Enterprise affiliate module |
| CartBounty Pro | $59/yr | PureCart Personal abandoned cart module |
| Digital License Manager Pro | ~$99/yr | PureCart Personal licensing module |
| WC Serial Numbers Pro | ~$79/yr | PureCart Personal licensing module |

An Enterprise merchant replacing EDD All Access ($999/yr) + AffiliateWP ($149/yr) saves >$800/yr with PureCart Enterprise ($299/yr) while staying on their existing WooCommerce stack.

### vs SureCart and FluentCart

| Capability | SureCart Pro ($399/yr unlimited) | FluentCart | PureCart Enterprise ($299/yr unlimited) |
|---|:---:|:---:|:---:|
| WooCommerce native | ❌ (replaces WC) | ❌ | ✅ |
| Self-hosted (data stays on your server) | ❌ (SaaS backend) | ✅ | ✅ |
| Software licensing | ❌ | ✅ | ✅ |
| Plugin auto-update server | ❌ | Partial | ✅ |
| Non-WP software updates | ❌ | ❌ | ✅ |
| JWT offline validation | ❌ | ❌ | ✅ |
| Staging exemption | ❌ | ❌ | ✅ |
| SaaS provisioning (webhooks) | Partial (SaaS infra only) | Partial | ✅ |
| Geo-blocking | ❌ | ❌ | ✅ |
| Affiliate program (built-in) | ❌ | ❌ | ✅ |
| GitHub → auto-update sync | ❌ | ❌ | ✅ |
| Abandoned cart (built-in) | ❌ | ❌ | ✅ |

---

## Roadmap Phase → Feature Tier Mapping

| Phase | Features | Plan | Target |
|---|---|---|---|
| Phase 1 (MVP) | Core secure downloads, licensing + JWT layer, WP plugin/software updates, My Account (Licenses, Downloads, Updates tabs), 5 transactional emails | Free + Personal | v1.0 |
| Phase 2 | Subscription tracking, SaaS provisioning, cloud storage (S3/R2), video protection, Electron/Squirrel feed, RS256 JWT, extended My Account (Product detail page, API Keys tab) | Personal + Enterprise | v1.1 |
| Phase 3 | Geo-blocking, abuse detection, rate limiting, PDF certificate, QR code, concurrent download detection | Enterprise | v1.2 |
| Phase 4 | GitHub/Bitbucket sync, auto-changelog, rollback, Minisign/GPG signing, delta updates, Composer endpoint | Enterprise | v1.3 |
| Phase 5 | Abandoned cart recovery, affiliate program, post-purchase funnels | Personal + Enterprise | v1.4 |
| Phase 6 | MRR/ARR dashboard, retention analytics, version adoption heatmap, WC Analytics integration, cohort analysis | Enterprise | v1.5 |
| Phase 7 | White-label, agency license pool, SSO/SAML, OAuth 2.0 PKCE for mobile, DRM watermarking, multisite | Enterprise | v2.0 |

---

## Key Differentiators (No Competitor Matches)

These features do not exist in any researched WooCommerce plugin:

| Differentiator | Significance |
|---|---|
| JWT offline license validation (no network call on each WP boot) | Reduces server load by 10,000+ daily API calls for a mid-size plugin |
| Feature flags in JWT `lic` claim | Customer plugins gate features locally — no round-trip needed |
| Non-WP software updates (desktop apps, CLI, Electron) | Opens the market beyond WP plugin developers |
| Per-platform packages (macOS, Windows, Linux arm64/x64) | Covers the full desktop software distribution chain |
| Staging / localhost activation exemption | No competitor does this automatically; removes #1 developer friction |
| `random_bytes()` dynamic key generation (no static disk-stored secrets) | LMFWC / DLM use disk files — permanent data loss if files are deleted |
| SaaS account provisioning (webhook + JWT) from WooCommerce order | Zero competitors offer this without replacing WooCommerce |
| Full built-in affiliate program (no AffiliateWP required) | Enterprise plan replaces $149/yr third-party cost |
| Full built-in abandoned cart recovery (no Brainstorm Force required) | Personal plan replaces a common free + paid combination |

---

## Open Questions

1. **Lifetime deal ratio:** $249 lifetime vs $99/yr = 2.5× ratio. Market expectation is 3–4×. Testing $299 lifetime may be worth the trade-off in perceived value without significantly reducing first-year conversion.

2. **Personal — 1 site limit:** A "Freelancer" tier at $149/yr for 3 sites would bridge the gap between Personal and Enterprise for developers managing a small client roster who don't need the full Enterprise set (SaaS, affiliates, unlimited sites).

3. **WordPress.org submission strategy:** The Free tier (secure downloads + customer library) meets the bar for a genuinely useful standalone plugin, supporting a WordPress.org listing. This is important for organic discovery — EDD's free listing is how it reached 50,000+ active installs.

4. **No platform transaction fee:** SureCart charges 2.9% on the free tier. PureCart should never charge a platform fee — merchants already pay WooCommerce gateway fees. This is a permanent differentiator to preserve in all public messaging.

5. **Annual vs lifetime offer timing:** Offering lifetime at launch risks anchoring the product as "cheap." A preferred approach: launch with annual only, add lifetime deal after 90 days once social proof exists (similar to how SureCart and FluentCart executed this).

6. **Module licensing granularity:** Should specific modules (e.g., Affiliates alone) be purchasable à la carte? The argument for: a merchant who only wants Affiliates doesn't need to buy Enterprise. The argument against: à la carte pricing adds comparison complexity and increases support surface. Recommended starting position: no à la carte; revisit at v1.1 based on customer feedback.
