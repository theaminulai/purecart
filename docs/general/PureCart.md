# PureCart for WooCommerce — Project Overview

**Version:** 1.0.0-dev
**Requires:** WordPress 6.0+, WooCommerce 8.0+, PHP 8.1+
**License:** GPL-2.0-or-later
**Author:** Aminul Islam / XpeedStudio

---

## What Is This Plugin?

`purecart` is a WooCommerce extension for selling WordPress plugins, themes, and SaaS products. It adds everything a software seller needs on top of WooCommerce — without replacing it.

WooCommerce handles what it does best: cart, checkout, payment gateways, coupons, customer accounts, and orders. This plugin handles everything that comes after a successful payment: license delivery, secure file download, plugin auto-updates, SaaS account provisioning, subscription tracking, and anti-piracy protection.

---

## Core Design Principle: Modular — Enable Only What You Need

Every feature is independently operable. You do not need to enable all features. The plugin ships with all modules but each can be toggled in Settings → PureCart → Modules.

| Your Use Case | Modules to Enable |
|---|---|
| Selling downloadable files (PDFs, assets, templates) | **Secure Downloads** only |
| Selling WordPress plugins with license keys | **Licensing** + **Plugin Updates** |
| Selling a SaaS product | **SaaS Provisioning** |
| Selling a plugin with annual renewal | **Licensing** + **Plugin Updates** + **Subscriptions** |
| Full software business (plugins + SaaS) | All modules |

Modules that are disabled create no DB tables, register no REST routes, and add zero overhead.

---

## Plugin Architecture

```
WooCommerce Order Completed
         │
         ├── purecart_plugin product type?
         │       ├── Licensing Module → generate license key
         │       ├── Downloads Module → create signed download token
         │       └── Updates Module   → customer can receive updates
         │
         ├── purecart_saas product type?
         │       └── SaaS Module → provision account, generate API key, send credentials
         │
         └── Either type with subscription?
                 └── Subscriptions Module → track renewal, link to license expiry
```

---

## Custom Product Types

| Type | Use For |
|---|---|
| `purecart_plugin` | WordPress plugins, themes, templates — delivers license key + download |
| `purecart_saas` | SaaS products — provisions account + API key via webhook |
| `purecart_bundle` | Bundle of plugins — one purchase, multiple licenses |

All PureCart product types are automatically set to virtual (no shipping). They integrate with WooCommerce's standard product management UI with additional meta boxes.

---

## Feature Modules Summary

### 1. Secure Downloads
Replaces WooCommerce's basic downloadable file system with signed, expiring, count-limited tokens. No direct file URLs ever exposed. Every download request goes through PHP, is logged with IP and timestamp, and can be geo-blocked.

**Standalone:** Yes — works with any WooCommerce downloadable product.
**RND:** See `docs/RND-secure-downloads.md`

---

### 2. License Key Management
Generates cryptographically random license keys on order completion. Tracks activations by domain with an activation limit. Supports staging/localhost exemption so dev environments don't consume license slots. Includes remote kill-switch (instant revocation).

**Standalone:** Yes — works with any WooCommerce product.
**RND:** See `docs/RND-licensing.md`

---

### 3. Plugin Auto-Updates
Serves as a self-hosted WordPress plugin update server. Your customers' WordPress sites check your store for updates automatically — exactly like WordPress.org but on your own server. Supports multiple release channels (stable/beta), SHA-256 checksums for ZIP integrity, and changelog delivery.

**Standalone:** Yes — can serve updates without license validation (free plugins) or with license gate (paid plugins).
**RND:** See `docs/RND-plugin-updates.md`

---

### 4. SaaS Provisioning
On order completion for a `purecart_saas` product, the plugin fires an outbound webhook to your SaaS platform's provisioning endpoint and records the new account. Generates a `purecart_` prefixed API key. Issues JWT tokens for SaaS login. On refund or subscription cancellation, fires a suspend webhook automatically.

**Standalone:** Yes — works without any other PureCart module.
**RND:** See `docs/RND-saas-provisioning.md`

---

### 5. Subscription Tracking
Does not replace your payment gateway's recurring billing. Instead, PureCart tracks subscription state as metadata and links it to license expiry and SaaS account status. When a renewal payment succeeds, the license is extended. When it fails, the dunning sequence begins. Works with WooCommerce Subscriptions, SUMO Subscriptions, or any subscription plugin that fires standard WooCommerce hooks.

**Standalone:** Yes — can track subscriptions without the Licensing module.
**RND:** See `docs/RND-subscriptions.md`

---

### 6. Security & Anti-Piracy
Rate limiting on the license activation endpoint, shared-license / multi-country abuse detection, IP logging on all downloads, geo-blocking (country-level allow/block list), and SHA-256 checksum verification on update ZIPs.

**Standalone:** Geo-blocking and rate limiting work standalone. Abuse detection requires the Licensing module.
**RND:** See `docs/RND-security.md`

---

### 7. Git Integration & Auto-Updates (Phase 4)
Receives GitHub or Bitbucket webhook on tag push, automatically imports the ZIP into the version manager, and bumps the version number. Eliminates the manual upload step for every new release.

**Standalone:** Requires Plugin Updates module.
**RND:** See `docs/RND-plugin-updates.md`

---

### 8. Abandoned Cart Recovery (Phase 5)
Fires `purecart_cart_abandoned` and `purecart_cart_recovered` action hooks. Any cart abandonment plugin (Cart Abandonment Recovery by Brainstorm Force is recommended — 300,000+ installs, free) can hook in. PureCart does not re-implement abandoned cart emailing.

**Standalone:** Yes — webhook bridge only.
**RND:** See `docs/RND-abandoned-cart.md`

---

### 9. Affiliate Connector (Phase 5)
Fires webhook events on `license_activated`, `order_completed`, and `subscription_renewed` so affiliate plugins (SUMO Affiliates Pro, AffiliateWP) can record commissions without PureCart managing the affiliate system.

**Standalone:** Yes — webhook bridge only.
**RND:** See `docs/RND-affiliates.md`

---

### 10. Analytics & Reporting (Phase 6)
Admin dashboard with MRR, ARR, churn rate, LTV, and active license count. Per-product download statistics. License health report (active/expired/abused/revoked). CSV/Excel export.

**Standalone:** Yes — but more useful when Licensing and Downloads modules are active.
**RND:** See `docs/RND-analytics.md`

---

## Database Tables

| Table | Module | Purpose |
|---|---|---|
| `wp_purecart_licenses` | Licensing | License keys and plan metadata |
| `wp_purecart_license_activations` | Licensing | Domain activation records |
| `wp_purecart_downloads` | Secure Downloads | Download tokens per order item |
| `wp_purecart_download_logs` | Secure Downloads | Per-download event log |
| `wp_purecart_product_versions` | Plugin Updates | ZIP versions, checksums, changelogs |
| `wp_purecart_subscriptions` | Subscriptions | Subscription state and renewal dates |
| `wp_purecart_saas_accounts` | SaaS Provisioning | Provisioned accounts and API keys |

Tables are created only if the corresponding module is enabled. Deactivation clears scheduled crons but does not drop tables (data preserved on deactivation, removed only on uninstall with the "Delete data on uninstall" option checked).

---

## REST API Namespace

All endpoints: `/wp-json/purecart/v1/`

Authentication: License endpoints use license key + domain. SaaS usage endpoint uses API key. Admin endpoints (revoke, provision) require `manage_woocommerce` capability.

---

## Customer Dashboard (My Account)

Three tabs added to WooCommerce My Account:
- **My Licenses** — view license keys, status, sites used / limit, expiry
- **Downloads** — view download tokens, count used / limit, expiry, download button
- **API Keys** — view SaaS API keys, plan, status

---

## Developer Hooks

```php
// Fired after license is generated
do_action( 'purecart_license_created', $license_id, $order_id, $product_id );

// Fired after license is activated on a domain
do_action( 'purecart_license_activated', $license_id, $domain, $environment );

// Fired after license is deactivated
do_action( 'purecart_license_deactivated', $license_id, $domain );

// Fired after license is revoked
do_action( 'purecart_license_revoked', $license_id );

// Fired after download token is generated
do_action( 'purecart_download_token_created', $token_id, $order_id );

// Fired when a file is downloaded
do_action( 'purecart_file_downloaded', $token_id, $ip, $country_code );

// Fired when a SaaS account is provisioned
do_action( 'purecart_saas_account_provisioned', $account_id, $user_id, $product_id );

// Fired when subscription renewal extends a license
do_action( 'purecart_license_renewed', $license_id, $new_expiry );

// Abandoned cart hooks (Phase 5)
do_action( 'purecart_cart_abandoned', $user_id, $cart_contents );
do_action( 'purecart_cart_recovered', $user_id, $order_id );

// Affiliate bridge hooks (Phase 5)
do_action( 'purecart_affiliate_event', $event_type, $data );
```

---

## Constants

```php
PURECART_VERSION        // Plugin version string
PURECART_FILE           // Absolute path to main plugin file
PURECART_PATH           // Plugin directory path (trailing slash)
PURECART_URL            // Plugin directory URL (trailing slash)
PURECART_BASENAME       // Plugin basename (woo-digital-downloads/purecart.php)
PURECART_API_NAMESPACE  // REST namespace: 'purecart/v1'
```

---

## Setup Requirements

1. WordPress 6.0+
2. WooCommerce 8.0+ (HPOS-compatible)
3. PHP 8.1+
4. Composer autoloader: `composer install` inside the plugin directory
5. At least one of: WooCommerce Stripe Gateway or WooCommerce PayPal Payments (for subscription auto-renewal)

---

## Quick Start by Use Case

**Use Case A — Sell a WordPress plugin:**
1. Enable: Licensing + Plugin Updates + Secure Downloads
2. Create a product, set type to `purecart_plugin`
3. Upload your plugin ZIP in the "Plugin Versions" admin panel
4. Set license type (single/multi/unlimited/lifetime), activation limit, duration
5. Customer buys → license key generated → download link sent → update API active

**Use Case B — Sell a SaaS product:**
1. Enable: SaaS Provisioning
2. Create a product, set type to `purecart_saas`
3. Configure webhook URL and secret in Settings → PureCart → SaaS
4. Customer buys → webhook fired → API key sent to customer

**Use Case C — Sell downloadable files only:**
1. Enable: Secure Downloads only
2. Create standard WooCommerce downloadable products
3. PureCart intercepts download URLs and replaces with signed tokens
4. Customer buys → expiring download link sent

---

## File Structure Reference

```
docs/
├── RND.md                       ← Master R&D document
├── purecart.md                  ← This file (project overview)
├── RND-secure-downloads.md      ← Downloads module R&D
├── RND-licensing.md             ← Licensing module R&D
├── RND-plugin-updates.md        ← Plugin Updates module R&D
├── RND-subscriptions.md         ← Subscriptions module R&D
├── RND-saas-provisioning.md     ← SaaS Provisioning module R&D
├── RND-security.md              ← Security & Anti-Piracy R&D
├── RND-abandoned-cart.md        ← Abandoned Cart R&D
├── RND-affiliates.md            ← Affiliates Connector R&D
└── RND-analytics.md             ← Analytics & Reporting R&D
```
