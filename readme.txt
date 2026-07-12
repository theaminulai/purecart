=== PureCart ===
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

Sell software, SaaS, and any digital file on WooCommerce — with secure delivery, license keys, auto-updates, and SaaS provisioning.

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

== External Services ==

PureCart does not send data to any third-party service. Everything runs entirely on your own WordPress installation. The sections below explain what data moves between your site and your customers.

= Update Server & License API (WordPress plugins, themes, and software) =

When you sell a WordPress plugin, theme, or any software product, your customers' WordPress sites connect to your own site's REST API to check for updates and validate license keys:

* **Endpoint:** `https://yoursite.com/wp-json/purecart/v1/update-check`
* **Data received from your customer's site:** plugin slug, currently installed version, and optionally a license key.
* **Data returned to your customer's site:** version number, changelog, compatibility metadata, and — only if a valid active license key was supplied — a one-time download URL.
* **No data is forwarded to any third party.** All processing happens on your server.

Your customers agree to this data exchange when they purchase a license from your store. You are responsible for documenting it in your own store's Privacy Policy.

= License Activation & Deactivation API =

When a customer activates or deactivates a license key on a domain, their WordPress site calls:

* **Endpoint:** `https://yoursite.com/wp-json/purecart/v1/license/activate` and `/deactivate`
* **Data received:** license key, domain name, environment type (production / staging / local), and the connecting IP address.
* **Data stored:** activation record in your own database. Nothing is sent to any third party.

= Secure File Downloads (digital files, ZIPs, PDFs, any format) =

When a customer downloads a purchased file — whether it is a plugin ZIP, a PDF, an ebook, a design asset, or any other digital product — the file is streamed directly from your server through a signed, expiring token URL. No direct file path is ever exposed, and no external service is involved.

* **Data logged per download:** download token ID, IP address, and timestamp. Stored in your own database only.

= SaaS Provisioning Webhook =

When you sell a SaaS product, PureCart fires a signed webhook to the URL you configure in **PureCart → Settings → SaaS Webhook URL**. This is your own endpoint (or a service you control, such as your application's provisioning API).

* **Data sent:** event name (`provision`, `suspend`, or `activate`), API key, plan name, and WordPress user ID.
* **Security:** every payload is signed with HMAC-SHA256 using the secret you set in Settings (`X-PureCart-Sig` header).
* **No data is sent to WordPress.org or any other third party.** You control the destination URL entirely.

Ensure that whatever endpoint receives this webhook has its own Privacy Policy covering the data it processes.

== Installation ==

1. Go to **Plugins → Add New** and search for **PureCart for WooCommerce**.
2. Click **Install Now**, then **Activate**.
3. Go to **PureCart → Settings** to configure.

== Changelog ==

= 1.0.0 =
* Initial release.
