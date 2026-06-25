=== Woo Digital Downloads ===
Contributors: aminulislam
Tags: woocommerce, digital downloads, software licensing, subscriptions, ebooks, pdf downloads, license keys, affiliates, abandoned cart, saas
Requires at least: 6.0
Tested up to: 6.8
Stable tag: 1.0.0
Requires PHP: 8.1
WC requires at least: 8.0
WC tested up to: 9.8
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

The complete digital product platform for WooCommerce. Sell eBooks, PDFs, courses, plugins, SaaS, and any digital file — with secure delivery, licensing, subscriptions, affiliates, and more.

== Description ==

**Woo Digital Downloads** is the all-in-one digital product toolkit for WooCommerce. It covers every type of digital product and every type of digital business — from a single creator selling eBooks and PDFs to a software company delivering licensed plugins, themes, and SaaS subscriptions.

WooCommerce handles cart, checkout, and payments. Woo Digital Downloads handles everything that comes after the payment: secure file delivery, license keys, automatic updates, subscription billing, account provisioning, affiliate commissions, abandoned cart recovery, and revenue analytics — without replacing anything WooCommerce already does.

= Who Is This For? =

* **Content creators** selling eBooks, PDFs, guides, templates, presets, and audio files
* **Course creators** delivering digital course materials and member-only downloads
* **WordPress developers** selling plugins and themes with license keys and automatic updates
* **SaaS businesses** provisioning accounts and API keys directly from WooCommerce
* **Membership sites** offering subscription-gated digital content
* **Any business** selling any type of digital file with recurring billing

= Fully Modular — Enable Only What You Need =

Every feature is independent. Enable just the modules your business requires. Unused modules create zero overhead — no database tables, no REST routes, no performance cost.

* **Selling PDFs, eBooks, or any downloadable file?** Enable Secure Downloads.
* **Selling subscription-based digital content?** Enable Subscriptions.
* **Selling WordPress plugins or themes with license keys?** Enable Licensing + Plugin Updates.
* **Selling a SaaS product?** Enable SaaS Provisioning.
* **Want affiliates to promote your products?** Enable Affiliates.
* **Want to recover abandoned carts automatically?** Enable Abandoned Cart Recovery.
* **Need the full platform?** Enable everything.

= Core Features =

**🔐 Secure Downloads**
Replace WooCommerce's basic file delivery with signed, expiring, count-limited download tokens. Every file — whether a PDF, eBook, ZIP, MP3, MP4, or any other format — is streamed through PHP. No direct file URLs are ever exposed to customers or search engines. Every download event is logged with IP address, country, and timestamp. Optionally restrict downloads by country, set per-order expiry windows, and limit the number of times each file can be downloaded.

**💳 Subscription Billing**
Sell any digital product on a recurring basis — subscriptions to content libraries, annual software licenses, monthly SaaS plans, or recurring access to any downloadable file. Supports daily, weekly, monthly, and yearly billing intervals, optional free and paid trials, sign-up fees, and configurable maximum subscription lengths. Customers can pause, resume, upgrade, downgrade, and resubscribe from their My Account page. A configurable dunning sequence handles failed payments automatically.

**🔑 Software Licensing**
Generate cryptographically secure license keys on order completion and track domain-level activations. Ideal for WordPress plugins, themes, desktop applications, or any software product requiring activation. Configurable site limits (single-site, multi-site, unlimited, lifetime). Staging and local development environments are automatically exempted. Revoke any license instantly. Full REST API for runtime activation, deactivation, and validation from within your customer's software.

**🔄 Plugin Auto-Updates**
Host your own plugin update server directly on your WooCommerce store. Customers receive automatic plugin or theme updates exactly like WordPress.org, with no manual steps required. Upload new versions with changelogs, manage stable and beta release channels, and verify ZIP integrity with SHA-256 checksums. Optionally gate updates behind a valid license. Connect to GitHub or Bitbucket to import new releases automatically when you push a tag.

**☁️ SaaS Provisioning**
Automate SaaS account creation at checkout. When a customer purchases a SaaS product, a signed outbound webhook is fired to your platform's provisioning endpoint and a unique API key is generated and delivered. JWT tokens are issued for SaaS login flows. Account suspension and cancellation events fire webhook callbacks automatically, keeping your SaaS platform in sync with WooCommerce without manual intervention.

**👥 Affiliate Program**
A complete, built-in affiliate management system. Affiliates register via a shortcode-powered page, receive a unique referral link, and earn commissions on every qualifying order. Configure percentage or flat-rate commissions globally, per product, or per affiliate. Handle subscription renewal commissions, manage payout batches, export in PayPal Mass Pay format, and track click and conversion rates — all from the WooCommerce admin.

**🛒 Abandoned Cart Recovery**
Automatically recover revenue from carts abandoned before checkout. A configurable email sequence of up to three emails is sent via Action Scheduler. Each email includes a one-click cart restore link, and optional auto-generated discount coupons can be attached to increase conversion. Full recovery rate and recovered revenue reporting is built in.

**📊 Analytics & Reporting**
A dedicated reporting dashboard for digital product businesses: Monthly Recurring Revenue (MRR), Annual Run Rate (ARR), churn rate, customer lifetime value, active subscription counts, download statistics per product and per file version, geographic download distribution, and version adoption rates. Export any report to CSV.

**🛡️ Security & Anti-Piracy**
Rate limiting on license activation endpoints, multi-country shared-license abuse detection, concurrent download detection, SHA-256 checksum verification on plugin ZIPs, and a remote license kill-switch. All outbound webhook payloads are signed with HMAC-SHA256.

= Supported Digital Product Types =

Woo Digital Downloads works with any WooCommerce downloadable product. It also adds three purpose-built product types:

* **WDD Plugin** — for WordPress plugins and themes. Delivers a license key and a signed download token.
* **WDD SaaS** — for hosted software and web applications. Triggers account provisioning and API key delivery via webhook.
* **WDD Bundle** — for product bundles. One purchase delivers multiple license keys and download files.

For all other digital products — eBooks, PDFs, templates, audio files, video files, course materials, presets, graphics, fonts, spreadsheets, or any other file type — use standard WooCommerce downloadable products. The Secure Downloads module intercepts and secures those downloads automatically without requiring a special product type.

= For Developers =

* PSR-4 Composer autoloader (`WooDigitalDownloads\` namespace)
* REST API under `/wp-json/wdd/v1/`
* Action Scheduler for all background jobs (no raw WP-Cron)
* HPOS (High Performance Order Storage) compatible
* Comprehensive action and filter hooks on every module event
* WP-CLI support (coming in a future release)

= Requirements =

* WordPress 6.0 or higher
* WooCommerce 8.0 or higher
* PHP 8.1 or higher
* Composer autoloader (included in the release ZIP)
* WooCommerce Stripe Gateway or WooCommerce PayPal Payments (required only for subscription auto-renewal)

== Installation ==

= Automatic Installation =

1. Log in to your WordPress dashboard.
2. Go to **Plugins → Add New**.
3. Search for **Woo Digital Downloads**.
4. Click **Install Now**, then **Activate**.
5. Go to **WooCommerce → Digital Downloads → Settings** to enable the modules you need.

= Manual Installation =

1. Download the plugin ZIP from the WordPress Plugin Directory.
2. Go to **Plugins → Add New → Upload Plugin**.
3. Upload the ZIP and click **Install Now**.
4. Activate the plugin.
5. Go to **WooCommerce → Digital Downloads → Settings**.

= After Activation =

1. Go to **Settings → Digital Downloads → Modules** and enable the features your store needs.
2. For **Secure Downloads**: all WooCommerce downloadable products are protected automatically once the module is on.
3. For **Subscriptions**: create a new product and select a subscription billing interval.
4. For **Licensing**: configure your default plan type and activation limit per product.
5. For **Plugin Updates**: upload your first plugin version under **Digital Downloads → Plugin Versions**.
6. For **SaaS Provisioning**: enter your webhook URL and secret under **Settings → SaaS**.
7. For **Affiliates**: publish a registration page using the `[wdd_affiliate_dashboard]` shortcode.

== Frequently Asked Questions ==

= What types of digital products can I sell with this plugin? =

Any type. Woo Digital Downloads works with every kind of digital file: eBooks, PDFs, guides, audio files, video files, templates, presets, fonts, graphics, spreadsheets, course materials, WordPress plugins, WordPress themes, software ZIPs, and more. The Secure Downloads module protects any file that WooCommerce can deliver. Purpose-built product types are available for software plugins and SaaS products.

= Does this replace WooCommerce? =

No. Woo Digital Downloads extends WooCommerce — it does not replace it. WooCommerce continues to handle your cart, checkout, payment gateways, coupons, and customer accounts exactly as before. This plugin adds the digital delivery and subscription layer on top.

= Can I sell subscriptions to an eBook library or content collection? =

Yes. The Subscriptions module lets you sell access to any product on a recurring basis. Create a subscription product, set the billing interval (daily, weekly, monthly, or yearly), and add files to it. When the subscription is active, the customer can download the associated files. When it expires or is cancelled, access is removed.

= Which payment gateways are supported? =

For one-time purchases, any WooCommerce-compatible payment gateway works automatically. For subscription auto-renewal, WooCommerce Stripe Gateway and WooCommerce PayPal Payments are supported. Manual renewal (where the customer pays a renewal invoice) works with any WooCommerce gateway.

= Can I sell both eBooks and software plugins from the same store? =

Yes. You can mix product types freely. An eBook can be a standard WooCommerce downloadable product (secured by the Downloads module), while a plugin is a WDD Plugin product with licensing and auto-updates — both in the same store and the same cart.

= Do I need to enable all modules? =

No. Every module is fully independent. If you only sell PDFs, enable just Secure Downloads. If you only need subscriptions, enable just Subscriptions. Disabled modules create no database tables, no REST routes, and zero performance overhead.

= How are download links secured? =

Instead of exposing the real file URL, each download is replaced with a signed token URL (`/wdd-download/{64-char-hex-token}`). The token is validated server-side on every request for expiry, download count limit, and (optionally) country. The actual file path is never visible to the customer. Files are streamed directly through PHP.

= How are license keys generated? =

License keys are generated using PHP's cryptographically secure `random_bytes()` function. Each key is 40 hexadecimal characters grouped as `XXXXXXXX-XXXXXXXX-XXXXXXXX-XXXXXXXX-XXXXXXXX`. They are generated at the moment of purchase — no pre-built key pool is required.

= Can my customers use a license on a local or staging site? =

Yes. Domains matching common local/staging patterns (localhost, .local, .test, .dev, .staging., 127.0.0.1) are automatically detected and exempted from site limit enforcement. Developers can work freely without consuming activation slots.

= How does the abandoned cart recovery work? =

When a cart with purchasable items is detected as abandoned (no activity for a configurable period, default 60 minutes), a recovery email sequence begins via Action Scheduler. Up to three emails are sent at configurable intervals. Each email contains a one-click link that restores the exact cart. Optional discount coupons are generated automatically and applied when the customer clicks the restore link.

= How are SaaS webhook payloads secured? =

Every outbound webhook is signed with HMAC-SHA256. The signature is sent in the `X-WDD-Sig` header. Your SaaS platform verifies this signature before processing any event, preventing spoofed or replayed requests.

= Is there a REST API? =

Yes. A full REST API is available under `/wp-json/wdd/v1/`. Endpoints cover secure download token validation, license activation and deactivation, plugin update checks, SaaS account management, subscription management, affiliate data, and analytics exports.

= Is the plugin compatible with HPOS? =

Yes. Woo Digital Downloads declares full compatibility with WooCommerce's High Performance Order Storage (HPOS) and Custom Order Tables.

= Where are the downloaded files stored? =

Files are stored in a directory of your choosing (typically `wp-content/uploads/wdd-files/`), which is protected from direct web access by an `.htaccess` rule. Files are never served directly by the web server — all delivery goes through PHP.

== Screenshots ==

1. **Overview Dashboard** — MRR trend, active subscriptions, download activity, and expiring licenses at a glance.
2. **Licenses List** — Sortable table with status badges, activation counts, and bulk revoke actions.
3. **License Detail** — Domain activations, event log, and one-click revocation.
4. **Secure Downloads** — Token list with expiry, download count, and geo-blocking status.
5. **Plugin Versions** — Upload and manage plugin ZIPs with changelogs and SHA-256 checksums.
6. **Subscriptions** — Full lifecycle management: active, paused, past due, and cancelled.
7. **Abandoned Cart Recovery** — Recovery rate stats, email sequence tracker, and coupon management.
8. **Affiliates** — Commission approvals, payout generation, and referral link performance.
9. **Analytics** — MRR/ARR, churn rate, version adoption, and geographic download distribution.
10. **Settings — Modules** — Toggle each feature module on or off with a single switch.
11. **Customer My Account** — Licenses tab, Downloads tab, and API Keys tab.

== Changelog ==

= 1.0.0 =
* Initial release.
* Secure Downloads: signed expiring tokens, IP and country logging, geo-blocking, file streaming for all digital file types.
* Subscriptions: full recurring billing lifecycle, configurable dunning, proration, pause/resume, upgrade/downgrade.
* Licensing: cryptographic key generation, domain activation tracking, staging exemption, remote kill-switch, REST API.
* Plugin Updates: self-hosted update server, SHA-256 checksums, stable/beta channels, GitHub/Bitbucket import.
* SaaS Provisioning: webhook-based account provisioning, API key management, JWT issuance.
* Affiliates: complete affiliate program, commission engine, payout management, PayPal Mass Pay export.
* Abandoned Cart Recovery: automatic email sequence, one-click restore, auto-generated coupons, recovery reporting.
* Security: rate limiting, abuse detection, geo-blocking, checksum verification, HMAC-SHA256 webhook signatures.
* Analytics: MRR/ARR/churn dashboard, license health, download statistics, CSV export.
* Custom product types: wdd_plugin, wdd_saas, wdd_bundle.
* Customer My Account tabs: Licenses, Downloads, API Keys.
* Full REST API under /wp-json/wdd/v1/.
* HPOS compatible.
* Action Scheduler for all background jobs.

== Upgrade Notice ==

= 1.0.0 =
Initial release. No upgrade steps required.
