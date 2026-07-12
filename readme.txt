=== PureCart for WooCommerce ===
Contributors: mostakimmim123, theaminuldev
Tags: woocommerce, digital downloads, software licensing, license keys, saas
Requires at least: 6.0
Tested up to: 7.0
Stable tag: 1.0.0
Requires PHP: 8.1
WC requires at least: 9.8
WC tested up to: 10.8.1 
License: GPLv3 or later
License URI: https://www.gnu.org/licenses/gpl-3.0.html

Sell plugins, SaaS, and any digital file on WooCommerce — with secure delivery, license keys, auto-updates, and SaaS provisioning.

== Description ==

**PureCart for WooCommerce** adds three purpose-built product types to WooCommerce and the infrastructure to sell them:

* **PureCart Plugin** — WordPress plugins and themes. Delivers a license key and a signed, expiring download token. Includes a self-hosted auto-update server so your customers receive plugin updates exactly like WordPress.org.
* **PureCart SaaS** — Hosted software and web applications. Triggers signed webhook provisioning and delivers a unique API key.
* **PureCart Bundle** — Product bundles. One purchase delivers multiple license keys and download files.

= Core Features =

**Secure Downloads** — Every file is streamed through PHP using signed, expiring tokens. No direct file URL is ever exposed.

**Software Licensing** — Cryptographically secure license keys with configurable site limits (single, multi, unlimited, lifetime). Full REST API for runtime activation and deactivation.

**Plugin Auto-Updates** — Self-hosted update server. Upload ZIPs with changelogs. Customers receive updates via the standard WordPress updater.

**SaaS Provisioning** — Webhook-based account creation at checkout. API key delivery. HMAC-SHA256 signed payloads. Suspend and reactivate accounts from WooCommerce orders.

**Subscription Billing** — Recurring billing via Action Scheduler. Dunning for failed payments.

**HPOS Compatible** — Full compatibility with WooCommerce High Performance Order Storage.

= For Developers =

* REST API under `/wp-json/purecart/v1/`
* PSR-4 namespace: `PureCart\`
* Action Scheduler for all background jobs — no raw WP-Cron
* HMAC-SHA256 signed webhooks (`X-PureCart-Webhook`, `X-PureCart-Sig` headers)

= Requirements =

* WordPress 6.0 or higher
* WooCommerce 9.8 or higher
* PHP 8.1 or higher

== Installation ==

1. Go to **Plugins → Add New** and search for **PureCart for WooCommerce**.
2. Click **Install Now**, then **Activate**.
3. Go to **PureCart → Settings** to configure.

== Changelog ==

= 1.0.0 =
* Initial release.
