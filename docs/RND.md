# R&D Document — woo-digital-downloads
**Project:** `woo-digital-downloads`
**Path:** `D:\wampserver\www\wp-plugin\digital-downloads\wp-content\plugins\woo-digital-downloads`
**Date:** 2026-06-24
**Goal:** A WooCommerce extension that sells and manages WordPress Plugins and SaaS Products from a single platform — with licensing, auto-updates, secure downloads, subscription billing, SaaS provisioning, and anti-piracy built in.

> **Modular Architecture:** Every feature in this plugin is independently operable. A store selling only downloadable files can enable just the Downloads module. A store needing only license keys enables only Licensing. A SaaS company can run only SaaS Provisioning. Features integrate with each other when both are enabled but never require one another unless explicitly noted.

---

## Feature Modules

| Module | Phase | Standalone? | Key Classes |
|---|---|---|---|
| Secure Downloads | 1 | Yes | TokenManager, DownloadDispatcher |
| Licensing | 1 | Yes | LicenseGenerator, LicenseActivator |
| Plugin Updates | 1 | Yes (or with Licensing) | UpdateServer, VersionManager |
| SaaS Provisioning | 2 | Yes | AccountProvisioner, JwtIssuer |
| Subscriptions | 2 | Yes — full built-in engine | SubscriptionManager, RenewalEngine, DunningManager |
| Security & Anti-Piracy | 3 | Partial | RateLimiter, GeoBlocker, AbuseDetector |
| Git Integration | 4 | Requires Updates | GitHubSync |
| Abandoned Cart | 5 | Yes — fully built-in | CartWatcher, RecoveryEmailer, CartRestorer |
| Affiliates | 5 | Yes — fully built-in | AffiliateManager, CommissionEngine, PayoutManager |
| Analytics | 6 | Yes | RevenueReport, LicenseReport |

See individual feature RND files in this docs/ folder for detailed specifications per module.

---

## 1. Competitive Landscape

### 1.1 Easy Digital Downloads (EDD)
**URL:** https://easydigitaldownloads.com
**Model:** Self-hosted WordPress plugin. Free core + paid extensions.
**Trusted by:** 50,000+ businesses, 187 countries, 30M+ orders processed, 13+ years.

**What's free in EDD core:**
- Unlimited products and orders
- Cart & checkout
- Secure download links with expiry & download limits (built-in)
- Basic PayPal/Stripe integration
- Basic discount codes
- Customer account page
- Basic sales reports
- Email notifications

**What costs extra in EDD (paid extensions):**
| Feature | Annual Cost |
|---|---|
| Software Licensing | ~$199/yr |
| Subscriptions / Recurring Billing | ~$209/yr |
| Affiliate Management | ~$199/yr |
| Abandoned Cart Recovery | paid add-on |
| EU VAT Compliance | $40–$80/mo (3rd party) |
| Invoices & Receipts | ~$29/yr |
| Instalment Payments | paid extension |
| Physical Products | paid extension |
| Advanced Reporting | higher plan |
| AWS S3 File Storage | extra cost |

**EDD Pricing (2026):**
- Free core: 3% transaction fee
- $99/yr – 1 site
- $199/yr – 1 site, more features
- $299/yr – 2 sites
- $499/yr – 3 sites
- No lifetime plans

**EDD Strengths:**
- Most mature digital-download solution for WordPress (13 years)
- Purpose-built: expiring download links, download attempt limits, IP tracking included free
- Huge ecosystem and documentation
- REST API included

**EDD Weaknesses:**
- Add-on cost stacks up fast ($499–$999/yr for full features on 3 sites)
- No lifetime license option
- No built-in order bumps, cart abandonment, or affiliate system
- UI uses shortcodes, no visual checkout builder

---

### 1.2 SureCart
**URL:** https://surecart.com
**Model:** Managed eCommerce platform (SaaS backend + WordPress frontend plugin).
**Ratings:** 4.8/5 WordPress, 4.7/5 G2, 4.3/5 Trustpilot

**Pricing:**
| Plan | 1 Store | 5 Stores | Unlimited |
|---|---|---|---|
| Free (Launch) | $0 + 2.9% fee | $0 + 2.9% fee | $0 + 2.9% fee |
| Pro Yearly | $179/yr | $249/yr | $399/yr |
| Pro Lifetime | $599 one-time | $999 one-time | $1,699 one-time |

**SureCart Weaknesses:**
- Backend is SaaS — data lives on SureCart servers
- No dedicated WordPress plugin software licensing extension
- Relatively newer, smaller ecosystem

---

### 1.3 FluentCart
**URL:** https://fluentcart.com
**By:** WPManageNinja (FluentCRM, FluentForms, FluentSupport team)
**Model:** Self-hosted WordPress plugin. Free core + Pro license.

**FluentCart Strengths:**
- Self-hosted, full control
- Licensing and subscriptions built-in from day one
- Headless REST API support
- Deep Fluent ecosystem integration
- Earlybird lifetime deal from $249

**FluentCart Weaknesses:**
- Newer, smaller ecosystem
- No managed infrastructure

---

### 1.4 SUMO Subscriptions for WooCommerce
**URL:** https://codecanyon.net/item/sumo-subscriptions-woocommerce-subscription-system/16486054
**By:** FantasticPlugins | **Price:** $49 | **Sales:** 5,063 | **Rating:** 4.38/5 | **Version:** 17.5.0 (Feb 2026)

#### Core Capabilities
Simple, Variable, and Grouped product subscriptions. Order Subscriptions (attach recurring billing to any product). Mixed cart (subscription + non-subscription in one checkout). Multiple subscriptions per checkout. Free trial + paid trial. Sign-up fee. Switching between identical variations. Upgrade/Downgrade with prorate or full price. Payment synchronization. Customer-selectable renewal frequency and instalment count.

#### Renewal Methods
Auto-renewal via Stripe (requires WooCommerce Stripe Plugin), PayPal (requires WooCommerce PayPal Payments), PayPal Subscriptions (billing agreements), SUMO Reward Points (requires their separate plugin). Manual renewal via any WC gateway. Falls back to manual renewal if auto-renewal is cancelled.

#### Subscriber Controls
Pause, Cancel, Resubscribe. Update subscription quantity.

#### Digital Product Features
Drip downloadable content, additional digital downloads, manually create subscription orders for any user, include/exclude shipping in renewal.

#### Admin Features
Include/exclude tax in renewal. Overdue and suspend period settings. Multiple payment reminder emails. Multiple overdue and suspend reminder emails. Bulk update subscription product settings.

#### Discount & Coupon Types
Sign-up fee coupon type. Recurring fee coupon type.

#### Admin Panel Structure

**Main subscription list table columns:** Subscription ID, Customer, Status, Recurring Amount, Next Payment Date, Actions (Edit / View / Cancel).

**Settings tabs:**

| Tab | Purpose | Key Options |
|---|---|---|
| General Settings | Global behavior | Enable/disable, cart behavior, trial settings |
| Order Subscription | Link subs to orders | Auto-renewal orders, order status sync |
| Synchronization | Gateway/CRM sync | Stripe/PayPal webhook URLs |
| Upgrade/Downgrade | Plan change rules | Proration, immediate vs. next-cycle |
| My Account | Customer portal | Shortcodes, allow pause/cancel |
| Advanced | Technical config | Cron intervals, debug mode |
| Bulk Actions | Scale management | Bulk status changes, retry payments |
| Messages | Communications | Email/SMS templates |

**Role-Based Access:**

| Area | Admin | Shop Manager | Customer |
|---|---|---|---|
| General Settings | ✅ | ✅ | ❌ |
| Bulk Actions | ✅ | ❌ | ❌ |
| My Account portal | ✅ | ✅ | ✅ (own only) |

#### Workflow & Automation
- Renewals: configured in "Order Subscription" tab; cron jobs process them automatically
- Plan Changes: rules in "Upgrade/Downgrade" tab; customer requests via My Account; proration applied
- Payment Failures: configurable 3 retry attempts; admin retries via Bulk Actions; customer notified by email/SMS

#### Add-On Dependencies (weaknesses)
- Membership subscriptions require separate SUMO Memberships plugin
- Recurring donations require separate SUMO Donations plugin
- SUMO Reward Points as renewal method requires their separate plugin
- Single-site CodeCanyon license — no multi-site option at $49

#### Key Gaps vs WDD
- No software license key generation or activation tracking
- No plugin update server
- No SaaS account provisioning
- No signed download tokens
- No API key management
- No geo-blocking or abuse detection
- No affiliate module
- No abandoned cart recovery
- Automatic renewal limited to Stripe/PayPal (no PayFast, Authorize.net, etc. natively)
- No CSV export of subscription data

---

### 1.5 Abandoned Cart Recovery — Ecosystem Research

| Plugin | Price | Installs | Rating | Notable |
|---|---|---|---|---|
| Cart Abandonment Recovery (Brainstorm Force) | Free | 300,000+ | 4.8/5 | Market leader, free coupons, 1-click recovery |
| WC Recover Abandoned Cart (FantasticPlugins) | $49 | 4,984 sales | 4.70/5 | Segmentation, manual mailing, multi-currency |
| Abandoned Cart Lite (Tychesoftwares) | Free | 20,000+ | 4.1/5 | Webhooks in free tier, Action Scheduler |
| CartBounty | Free | 10,000+ | 4.8/5 | Exit Intent free, anonymous cart capture, best hooks |

**WDD Strategy:** Fire `wdd_cart_abandoned` / `wdd_cart_recovered` action hooks — any of these plugins can integrate.

---

### 1.6 Affiliate Management — Ecosystem Research

| Plugin | Price | Sales | Rating | Scope |
|---|---|---|---|---|
| SUMO Affiliates for WooCommerce | $39 | 620 | 4.25/5 | WooCommerce-only |
| SUMO Affiliates Pro | $49 | 954 | 4.53/5 | Any WordPress site, form/email commissions |

**WDD Strategy:** Webhook bridge — fire events on `license_activated`, `order_completed`, `subscription_renewed` so affiliate plugins can consume commission data.

---

### 1.7 Free Subscription Billing Alternatives

| Plugin | Price | Installs | Rating | Notable |
|---|---|---|---|---|
| Subscriptions for WooCommerce (WP Swings) | Free | 10,000+ | 4.4/5 | Subscription Box, AI widget, LearnPress |
| Subscription & Recurring Payment (Convers Lab) | Free | 700+ | 4.9/5 | iDEAL/SEPA free, highest rated |
| Subscriptions by Sublium (FunnelKit) | Free + 2.9% fee | 300+ | 5.0/5 | Variable products + installments free, FunnelKit ecosystem |

**WDD Position:** WDD builds its own full subscription engine (see `docs/RND-subscriptions.md`). It handles recurring billing via Stripe and PayPal through WooCommerce's gateway layer, plus links subscription state to license expiry and SaaS account status. WDD does not depend on any of the free plugins above.

---

### 1.8 License Key / Serial Number Managers — Direct Competitor

**WC Serial Numbers (PluginEver):** https://wordpress.org/plugins/wc-serial-numbers/
Free + Pro | 1,000+ installs | 4.7/5 | Updated May 2026

Pre-generated key delivery: import keys via CSV/TXT, auto-deliver on order complete, HTTP API + REST API for validate/activate/deactivate, DB encryption, customer portal, HPOS + Blocks + WPML. Pro adds: key generator, variable products, bulk export, Twilio SMS.

**WDD vs WC Serial Numbers:**
| | WC Serial Numbers | woo-digital-downloads |
|---|---|---|
| Key generation | Import or Pro generator | Dynamic random_bytes() — no import needed |
| Activation tracking | Basic API | Full domain+environment with staging exemption |
| Update delivery | Not included | /wdd/v1/plugin/update-check |
| ZIP versioning | Not included | Multi-channel, checksum, changelog |
| SaaS provisioning | Not included | Full webhook-based |
| Download tokens | Not included | Signed expiring tokens per order |
| Geo-blocking | Not included | Country-level block list |

---

### 1.9 Payment Gateways — Reference

**WooCommerce Stripe:** 700,000+ installs, free, 23 payment methods, Stripe Radar, Apple/Google Pay, BNPL. WDD hooks into Stripe-fired renewal events.

**WooCommerce PayPal Payments:** 800,000+ installs, free, PayPal + Venmo + Pay Later + Fastlane + Apple/Google Pay + Crypto. WDD hooks into PayPal-fired order status events.

---

### 1.10 JWT Authentication — Library Research

**jwt-auth (usefulteam):** 6,000 installs, 5.0/5, has refresh tokens + rotation. NOT updated in 2+ years — WP 7.x untested. Single-developer risk.

**JWT Authentication for WP REST API (tmeister):** 60,000+ installs, 4.4/5, React admin dashboard, actively maintained. No refresh token in free tier — Pro required.

**WDD Decision:** Use `firebase/php-jwt` directly in `includes/SaaS/JwtIssuer.php` — avoids namespace collisions, plugin conflicts, and external dependency risks. HS256, 10-min access tokens, 30-day refresh tokens stored server-side.

---

## 2. Competitor Feature Gap Analysis

Features none of the competitors handle well for WooCommerce natively:
- Licensing + WooCommerce native hooks integration
- Automatic plugin update delivery tied to WooCommerce order
- GitHub/Bitbucket private repo → auto ZIP build → update API
- JWT-based SaaS account provisioning from WooCommerce checkout
- Geo-blocking and IP logging on downloads
- Remote license kill-switch
- Staging/localhost exemption for site-limit licenses
- WooCommerce webhook → SaaS account creation flow

---

## 3. Project Architecture

### 3.1 Core Philosophy
**WooCommerce handles:** Checkout, cart, orders, coupons, payment gateways, customer accounts.
**woo-digital-downloads handles:** Everything else — licensing, downloads, updates, SaaS, subscriptions, security, and analytics.

### 3.2 Module Structure

```
woo-digital-downloads/
├── woo-digital-downloads.php        # Main plugin file
├── includes/
│   ├── Commerce/                    # WooCommerce integration layer
│   │   ├── OrderHandler.php         # woocommerce_order_status_completed
│   │   ├── ProductTypes.php         # Custom product type registration
│   │   └── WebhookHandler.php       # Outgoing webhooks
│   │
│   ├── Licensing/                   # License system
│   │   ├── LicenseGenerator.php     # Key generation (UUID-based)
│   │   ├── LicenseActivator.php     # Domain activation / deactivation
│   │   ├── LicenseValidator.php     # API endpoint for plugin check
│   │   ├── LicenseExpiry.php        # Cron-based expiry enforcement
│   │   └── LicenseRevoke.php        # Kill-switch / instant revocation
│   │
│   ├── Downloads/                   # Secure file delivery
│   │   ├── TokenManager.php         # Signed, expiring download tokens
│   │   ├── DownloadDispatcher.php   # Serve file via PHP (no direct URL)
│   │   ├── DownloadLogger.php       # IP, user-agent, geo, count log
│   │   └── GeoBlocker.php           # Country-level block list
│   │
│   ├── Updates/                     # WordPress plugin auto-update API
│   │   ├── UpdateServer.php         # /wp-json/wdd/v1/plugin/update
│   │   ├── VersionManager.php       # Upload/manage plugin ZIP versions
│   │   ├── ChangelogManager.php     # Version notes storage
│   │   └── GitHubSync.php           # GitHub webhook → auto ZIP import
│   │
│   ├── Subscriptions/               # Recurring billing
│   │   ├── SubscriptionManager.php  # Create/renew/cancel
│   │   ├── DunningManager.php       # Failed payment retry + emails
│   │   └── PlanUpgrade.php          # Proration + upgrade/downgrade
│   │
│   ├── SaaS/                        # SaaS product provisioning
│   │   ├── AccountProvisioner.php   # Create SaaS user on order complete
│   │   ├── PlanSyncer.php           # Sync WooCommerce plan to SaaS
│   │   ├── ApiKeyManager.php        # Generate/revoke API keys
│   │   └── JwtIssuer.php            # Issue JWT for SaaS login
│   │
│   ├── CustomerDashboard/           # My Account portal
│   │   ├── DashboardController.php  # WooCommerce My Account tabs
│   │   ├── LicenseTab.php           # View, activate, deactivate sites
│   │   ├── DownloadTab.php          # Version history + re-download
│   │   ├── ApiKeyTab.php            # Manage API keys
│   │   └── UsageTab.php             # Usage stats, plan status
│   │
│   ├── Marketing/                   # Emails and growth
│   │   ├── EmailAutomation.php      # Transactional email triggers
│   │   ├── AbandonedCart.php        # Abandoned cart capture + follow-up
│   │   └── AffiliateConnector.php   # Webhook bridge to affiliate tools
│   │
│   ├── Analytics/                   # Reporting
│   │   ├── RevenueReport.php        # MRR, ARR, LTV
│   │   ├── LicenseReport.php        # Active/expired/abused
│   │   └── DownloadReport.php       # Downloads per product/version
│   │
│   ├── Security/                    # Anti-piracy and fraud
│   │   ├── RateLimiter.php          # Throttle activation/download attempts
│   │   ├── AbuseDetector.php        # Shared license / multi-country detection
│   │   └── ChecksumVerifier.php     # SHA-256 file integrity
│   │
│   └── API/                         # REST API endpoints
│       ├── LicenseEndpoints.php
│       ├── UpdateEndpoints.php
│       ├── DownloadEndpoints.php
│       └── SaaSEndpoints.php
│
├── admin/                           # WordPress admin UI
│   ├── views/
│   └── assets/
│
├── assets/                          # Frontend JS/CSS
└── templates/                       # Email templates, dashboard templates
```

---

## 4. Database Schema

### wp_wdd_licenses
```sql
CREATE TABLE wp_wdd_licenses (
    id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    order_id        BIGINT UNSIGNED NOT NULL,
    user_id         BIGINT UNSIGNED NOT NULL,
    product_id      BIGINT UNSIGNED NOT NULL,
    license_key     VARCHAR(64) NOT NULL UNIQUE,
    plan_type       ENUM('single','multi','unlimited','lifetime') DEFAULT 'single',
    status          ENUM('active','expired','revoked','suspended') DEFAULT 'active',
    activation_limit INT UNSIGNED DEFAULT 1,
    activated_count  INT UNSIGNED DEFAULT 0,
    expires_at      DATETIME NULL,
    created_at      DATETIME NOT NULL,
    updated_at      DATETIME NOT NULL,
    PRIMARY KEY (id),
    KEY idx_license_key (license_key),
    KEY idx_user_id (user_id)
);
```

### wp_wdd_license_activations
```sql
CREATE TABLE wp_wdd_license_activations (
    id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    license_id      BIGINT UNSIGNED NOT NULL,
    domain          VARCHAR(255) NOT NULL,
    ip_address      VARCHAR(45),
    environment     ENUM('production','staging','local') DEFAULT 'production',
    activated_at    DATETIME NOT NULL,
    last_check      DATETIME,
    PRIMARY KEY (id),
    KEY idx_license_id (license_id),
    KEY idx_domain (domain)
);
```

### wp_wdd_downloads
```sql
CREATE TABLE wp_wdd_downloads (
    id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    order_id        BIGINT UNSIGNED NOT NULL,
    user_id         BIGINT UNSIGNED NOT NULL,
    product_id      BIGINT UNSIGNED NOT NULL,
    file_id         BIGINT UNSIGNED NOT NULL,
    token           VARCHAR(128) NOT NULL UNIQUE,
    download_count  INT UNSIGNED DEFAULT 0,
    max_downloads   INT UNSIGNED DEFAULT 3,
    expires_at      DATETIME NOT NULL,
    ip_address      VARCHAR(45),
    country_code    VARCHAR(2),
    created_at      DATETIME NOT NULL,
    PRIMARY KEY (id),
    KEY idx_token (token)
);
```

### wp_wdd_download_logs
```sql
CREATE TABLE wp_wdd_download_logs (
    id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    download_id     BIGINT UNSIGNED NOT NULL,
    ip_address      VARCHAR(45),
    user_agent      TEXT,
    country_code    VARCHAR(2),
    downloaded_at   DATETIME NOT NULL,
    PRIMARY KEY (id)
);
```

### wp_wdd_product_versions
```sql
CREATE TABLE wp_wdd_product_versions (
    id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    product_id      BIGINT UNSIGNED NOT NULL,
    version         VARCHAR(20) NOT NULL,
    file_path       TEXT NOT NULL,
    checksum_sha256 VARCHAR(64),
    requires_wp     VARCHAR(10),
    tested_wp       VARCHAR(10),
    requires_php    VARCHAR(10),
    channel         ENUM('stable','beta') DEFAULT 'stable',
    changelog       LONGTEXT,
    released_at     DATETIME NOT NULL,
    PRIMARY KEY (id),
    KEY idx_product_version (product_id, version)
);
```

### wp_wdd_subscriptions
```sql
CREATE TABLE wp_wdd_subscriptions (
    id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id         BIGINT UNSIGNED NOT NULL,
    product_id      BIGINT UNSIGNED NOT NULL,
    order_id        BIGINT UNSIGNED NOT NULL,
    license_id      BIGINT UNSIGNED,
    status          ENUM('active','cancelled','paused','expired','past_due') DEFAULT 'active',
    billing_cycle   ENUM('monthly','yearly') DEFAULT 'yearly',
    starts_at       DATETIME NOT NULL,
    expires_at      DATETIME,
    renewal_at      DATETIME,
    cancelled_at    DATETIME NULL,
    PRIMARY KEY (id),
    KEY idx_user_id (user_id),
    KEY idx_renewal (renewal_at)
);
```

### wp_wdd_saas_accounts
```sql
CREATE TABLE wp_wdd_saas_accounts (
    id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id         BIGINT UNSIGNED NOT NULL,
    order_id        BIGINT UNSIGNED NOT NULL,
    product_id      BIGINT UNSIGNED NOT NULL,
    plan            VARCHAR(50),
    api_key         VARCHAR(128) UNIQUE,
    status          ENUM('active','suspended','cancelled') DEFAULT 'active',
    provisioned_at  DATETIME NOT NULL,
    PRIMARY KEY (id),
    KEY idx_user_product (user_id, product_id)
);
```

---

## 5. All endpoints registered under `/wp-json/wdd/v1/`

### License API
```
POST   /license/activate         # Activate license on a domain
POST   /license/deactivate       # Remove a domain activation
GET    /license/check            # Validate license + return plan features
POST   /license/revoke           # Admin: instantly revoke a license
```

### Plugin Update API
```
GET    /plugin/update-check      # Check if update available for version + license
GET    /plugin/download/{token}  # Serve update ZIP (token-gated)
GET    /plugin/changelog/{slug}  # Return changelog for product
```

### Secure Download API
```
GET    /download/{token}         # Serve file if token valid, not expired, count ok
POST   /download/generate        # Generate a new download token (internal)
```

### SaaS API
```
POST   /saas/provision           # Triggered by order webhook: create SaaS account
POST   /saas/suspend             # Suspend on subscription failure
POST   /saas/activate            # Re-activate after payment recovery
GET    /saas/usage/{api_key}     # Usage stats for a customer
```

---

## 6. WooCommerce Integration Points

```php
add_action('woocommerce_order_status_completed',    [$this, 'on_order_complete']);
add_action('woocommerce_order_status_refunded',     [$this, 'on_order_refunded']);
add_action('woocommerce_subscription_status_active', [$this, 'on_subscription_active']);
add_action('woocommerce_subscription_status_cancelled', [$this, 'on_subscription_cancelled']);
add_action('woocommerce_subscription_renewal_payment_complete', [$this, 'on_renewal']);
// Download access
add_filter('woocommerce_customer_get_downloadable_products', [$this, 'get_downloads']);
add_filter('woocommerce_downloadable_file_download_url',     [$this, 'secure_download_url']);
```

### Order → License → SaaS Flow
```
WooCommerce Order Completed
        │
        ├─ Is product type "wdd_plugin"?
        │       ├─ Generate license key
        │       ├─ Store in wp_wdd_licenses
        │       ├─ Send email with license + download link
        │       └─ Log to wp_wdd_downloads
        │
        └─ Is product type "wdd_saas"?
                ├─ Call SaaS provisioner
                ├─ Create account (via API or internal)
                ├─ Generate API key
                ├─ Store in wp_wdd_saas_accounts
                └─ Send login credentials email
```

---

## 7. Feature Roadmap & Build Priority

### Phase 1 — MVP (Must Ship First)
- [ ] WooCommerce product type: `wdd_plugin` and `wdd_saas`
- [ ] License generation on order complete
- [ ] License activation / deactivation REST API
- [ ] Secure download token system (expiry + count limit)
- [ ] Download log (IP, country, timestamp)
- [ ] Plugin update API (`/wdd/v1/plugin/update-check`)
- [ ] ZIP version upload and management (Admin UI)
- [ ] Customer My Account: License tab + Download tab
- [ ] Email notifications: purchase, license key, download link

### Phase 2 — Subscription & SaaS
- [ ] Subscription tracking (link to license expiry)
- [ ] Failed payment dunning emails
- [ ] Grace period on expired license
- [ ] SaaS account provisioning on order complete
- [ ] API key generation and management
- [ ] JWT issuer for SaaS login
- [ ] Customer dashboard: API Keys tab, Usage tab

### Phase 3 — Security & Anti-Piracy
- [ ] Geo-blocking (country-level block list)
- [ ] IP rate limiting on activation endpoint
- [ ] Shared license / multi-country abuse detection
- [ ] Concurrent download detection
- [ ] SHA-256 checksum on update ZIPs
- [ ] VPN detection (optional, 3rd party API)
- [ ] Remote kill-switch (instant license revocation)
- [ ] Staging/localhost environment auto-exemption

### Phase 4 — Git Integration & Auto-Updates
- [ ] GitHub webhook receiver (on tag push → import ZIP)
- [ ] Bitbucket webhook receiver
- [ ] Auto-version bump on new release
- [ ] Auto-changelog generation from commit messages
- [ ] Release channel management (stable / beta)
- [ ] Rollback to previous version (admin + customer)

### Phase 5 — Marketing & Growth
- [ ] Abandoned cart recovery (email capture + follow-up)
- [ ] Post-purchase upsell funnel hooks
- [ ] Affiliate program connector (webhook bridge)
- [ ] Bulk discount / coupon generation
- [ ] Customer loyalty points system
- [ ] Referral system

### Phase 6 — Analytics & Reporting
- [ ] Revenue dashboard (MRR, ARR, churn, LTV)
- [ ] License statistics (active, expired, abused)
- [ ] Download statistics (per product, per version)
- [ ] Subscription statistics
- [ ] Export to CSV/Excel

### Phase 7 — Enterprise & Advanced
- [ ] White-label licensing
- [ ] Agency license (multi-site, team-managed)
- [ ] SSO / SAML connector
- [ ] Audit logs
- [ ] REST API for all data (full developer access)
- [ ] Webhooks (license events, subscription events)
- [ ] CLI commands (WP-CLI integration)

---

## 8. Tech Stack

| Layer | Technology |
|---|---|
| Core platform | WordPress + WooCommerce |
| Plugin language | PHP 8.1+ |
| Admin UI | React + WordPress Scripts |
| REST API | WordPress REST API framework |
| Database | WordPress $wpdb + custom tables |
| Background jobs | Action Scheduler |
| Email | wp_mail() + HTML templates |
| File serving | PHP stream (no direct URL) |
| Token generation | random_bytes() + SHA-256 |
| JWT | firebase/php-jwt (HS256) |
| GitHub integration | GitHub Webhooks |
| Geo-detection | MaxMind GeoLite2 or ip-api.com |
| Cron | WP-Cron + Action Scheduler |

---

## 9. Differentiation Table

| Capability | EDD | SureCart | FluentCart | SUMO Subscriptions | WC Serial Numbers | woo-digital-downloads |
|---|---|---|---|---|---|---|
| WooCommerce native | No | No | No | Yes | Yes | **Yes** |
| Self-hosted | Yes | No | Yes | Yes | Yes | **Yes** |
| Licensing built-in | $199/yr | Yes | Yes | No | Yes (import) | **Yes (generated)** |
| Plugin auto-update API | Yes (ext) | No | Partial | No | No | **Yes** |
| GitHub update sync | No | No | No | No | No | **Yes** |
| SaaS provisioning | No | Partial | Partial | No | No | **Yes** |
| Geo-blocking | No | No | No | No | No | **Yes** |
| JWT for SaaS auth | No | No | No | No | No | **Yes** |
| Staging exemption | Basic | No | No | No | No | **Yes** |
| Remote kill-switch | Partial | No | No | No | No | **Yes** |
| Subscription billing | $209/yr | Yes | Yes | Yes ($49) | No | **Yes** |
| Multi-site license | Yes | Yes | Yes | No | No | **Yes** |
| Extends WooCommerce | No | No | No | Yes | Yes | **Yes** |

---

## 10. References

- Easy Digital Downloads: https://easydigitaldownloads.com
- SureCart: https://surecart.com/pricing
- FluentCart: https://fluentcart.com
- SUMO Subscriptions: https://codecanyon.net/item/sumo-subscriptions-woocommerce-subscription-system/16486054
- WC Recover Abandoned Cart: https://codecanyon.net/item/woocommerce-recover-abandoned-cart/7715167
- Cart Abandonment Recovery (Brainstorm Force): https://wordpress.org/plugins/woo-cart-abandonment-recovery/
- Abandoned Cart Lite: https://wordpress.org/plugins/woocommerce-abandoned-cart/
- CartBounty: https://wordpress.org/plugins/woo-save-abandoned-carts/
- SUMO Affiliates: https://codecanyon.net/item/sumo-affiliates-woocommerce-affiliate-system/18273930
- SUMO Affiliates Pro: https://codecanyon.net/item/sumo-affiliates-pro-wordpress-affiliate-plugin/22795996
- MWB HubSpot for WooCommerce: https://wordpress.org/plugins/makewebbetter-hubspot-for-woocommerce/
- Subscriptions for WooCommerce (WP Swings): https://wordpress.org/plugins/subscriptions-for-woocommerce/
- Subscription & Recurring Payment (Convers Lab): https://wordpress.org/plugins/subscription/
- Subscriptions by Sublium: https://wordpress.org/plugins/sublium-subscriptions-for-woocommerce/
- WC Serial Numbers: https://wordpress.org/plugins/wc-serial-numbers/
- WooCommerce PayPal Payments: https://wordpress.org/plugins/woocommerce-paypal-payments/
- WooCommerce Stripe Gateway: https://wordpress.org/plugins/woocommerce-gateway-stripe/
- JWT Auth (usefulteam): https://wordpress.org/plugins/jwt-auth/
- JWT Authentication for WP REST API: https://wordpress.org/plugins/jwt-authentication-for-wp-rest-api/
- firebase/php-jwt: https://github.com/firebase/php-jwt
- Action Scheduler: https://actionscheduler.org
- MaxMind GeoLite2: https://dev.maxmind.com/geoip/geolite2-free-geolocation-data
- Plugin Update Checker: https://github.com/YahnisElsts/plugin-update-checker
