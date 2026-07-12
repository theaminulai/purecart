# PureCart for WooCommerce

## Product R&D Brief

**Working product name:** PureCart for WooCommerce  
**Tagline:** Secure digital selling, powered by WooCommerce.  
**Plugin slug:** `purecart`  
**PHP namespace:** `PureCart`  
**Product type:** WooCommerce extension for digital products  
**Document status:** Initial research and product definition  
**Date:** June 21, 2026

> **Plugin name confirmed:** PureCart for WooCommerce. Plugin slug: `purecart`. WordPress.org submission approved.

## 1. Product Summary

PureCart for WooCommerce turns an existing WooCommerce store into a focused platform for selling downloadable products, software, media, documents, and other licensed digital goods.

WooCommerce remains responsible for the catalog, cart, checkout, payment gateways, taxes, coupons, orders, refunds, customers, and base transactional emails. PureCart adds secure file delivery, a better customer download experience, product releases, access management, download analytics, and optional software licensing.

The product is an alternative to installing a separate digital-commerce system such as Easy Digital Downloads. It is not a replacement for WooCommerce.

## 2. Problem Statement

WooCommerce supports virtual and downloadable products, but a serious digital-product business commonly needs more:

- Stronger file protection and expiring links
- Multiple releases and product version history
- Better download permission management
- Detailed access and download logs
- A purpose-built customer download dashboard
- Software license generation and activation
- Cloud file storage
- Subscription-aware access
- Digital-product reporting

Merchants currently assemble several extensions or move to a separate commerce platform. PureCart should provide these capabilities through one coherent WooCommerce-native experience.

## 3. Target Customers

### Primary users

- WordPress plugin and theme vendors
- Subscriptions, Licensing eBook, PDF, template, and design-asset sellers
- Music, video, photography, and audio creators
- Course-material and document sellers
- Agencies delivering purchased files to clients
- SaaS and desktop-software vendors selling licenses
- Existing WooCommerce stores adding digital products

### Jobs to be done

- Sell a protected file through an existing WooCommerce checkout
- Deliver the correct files immediately after payment
- Let customers retrieve purchases without contacting support
- Publish updates to eligible customers
- Control who can download a product and for how long
- Identify abuse without blocking legitimate customers
- Sell and validate renewable software licenses

## 4. Product Positioning

### Positioning statement

For WooCommerce merchants selling digital goods, PureCart is a WooCommerce extension that provides secure delivery, product releases, customer downloads, licensing, and access analytics without introducing a second commerce system.

### Differentiators

- Native WooCommerce orders, products, payments, and refunds
- No duplicate customer or transaction database
- Digital-first onboarding and administration
- Modular licensing and cloud-storage features
- Compatibility with mixed physical and digital carts
- Developer APIs, hooks, webhooks, and WP-CLI support
- Performance-conscious logging and background processing

## 5. Product Boundaries

### Owned by WooCommerce

- Products and variations
- Cart and checkout
- Orders and refunds
- Customers and accounts
- Coupons and taxes
- Payment gateways
- Core inventory behavior
- Base transactional emails
- Base analytics

### Owned by PureCart
- Subscription-aware entitlements and access policies
- Secure file delivery and expiring links
- Protected file sources and delivery policies
- Signed download URLs
- Product releases and file versions
- Download entitlements and access logs
- Enhanced customer download library
- Administrative access controls
- Digital-product reports
- Cloud-storage adapters
- Software licenses and activations
- REST API for license validation and activation
- licensing and subscription bridges

## 6. MVP Feature Requirements

### 6.1 Digital product configuration

- Add a **PureCart** panel to WooCommerce product data
- Support simple and variable products
- Attach one or more files to a product or variation
- Store a display name, file source, version, file size, and checksum
- Configure download limit and expiration per product
- Inherit global defaults with product-level overrides
- Validate file configuration before publishing

### 6.2 Secure delivery

- Generate random, signed, time-limited download URLs
- Verify order status and customer entitlement on every request
- Prevent public exposure of protected local file paths
- Support forced download and streamed delivery
- Allow redirect delivery only for trusted signed storage URLs
- Prevent path traversal and unauthorized file selection
- Apply configurable link lifetime, attempt limit, and rate limit
- Log successful and denied download attempts

### 6.3 Entitlements

- Create access after an order reaches an allowed status
- Track product, variation, order, customer, file, limit, and expiration
- Revoke access after a full refund when configured
- Handle partial refunds without accidental global revocation
- Let administrators grant, revoke, extend, or reset access
- Preserve an audit trail for manual changes
- Remain idempotent when WooCommerce order hooks run more than once

### 6.4 Customer download library

- Add a PureCart endpoint under **My Account**
- Display products, files, versions, expiration, and remaining downloads
- Provide release notes and documentation links
- Group purchases by product rather than exposing a confusing order list
- Include accessible empty, expired, and revoked states
- Support responsive tables or cards
- Require authentication for account-based access

### 6.5 Administration

- Search entitlements by customer, email, order, or product
- View download activity and denial reasons
- Resend a download-access email
- Regenerate permissions without changing the order
- Revoke compromised links
- Export filtered logs as CSV
- Apply appropriate WordPress capabilities and nonces

### 6.6 Checkout optimization

- Hide shipping requirements for digital-only carts
- Preserve normal checkout for mixed carts
- Show concise digital-delivery messaging
- Offer optional account creation for access to the download library
- Add a digital-specific order-confirmation section
- Avoid replacing WooCommerce checkout templates unnecessarily

### 6.7 Notifications

- Digital access granted
- Access revoked
- Access expiration reminder
- New product release available
- Administrative suspicious-download alert
- Customizable subjects and content using WooCommerce email conventions

### 6.8 Reporting

- Downloads by product and date
- Downloads by customer
- Successful versus denied attempts
- Most active files and releases
- Expiring entitlements
- CSV export
- Basic WooCommerce Analytics integration where practical

## 7. Post-MVP Modules

### Software Licensing Pro

- License-key generation
- Activation limits
- Domain or device activations
- Validation, activation, and deactivation REST endpoints
- Expiration, suspension, revocation, and renewal
- License upgrades and transfers
- WordPress plugin and theme update service
- Version and activation logs

### Cloud Storage Pro

- Amazon S3
- Cloudflare R2
- DigitalOcean Spaces
- Backblaze B2
- Signed provider URLs
- Storage-provider interface for third-party adapters

### Subscriptions Bridge

- WooCommerce Subscriptions integration
- Access synchronized with subscription status
- Renewable license periods
- Grace periods
- Upgrade, downgrade, cancellation, and failed-renewal handling

### Growth Toolkit

- Product bundles
- Upgrade paths
- Renewal offers
- Cross-sells and recommendations
- Lead magnets
- Email-marketing events
- Affiliate integration events

## 8. Proposed Architecture

### Components

- **Bootstrap:** dependency checks, activation, migrations, service container
- **Product:** product settings, file sources, releases, validation
- **Entitlement:** access lifecycle and WooCommerce order synchronization
- **Delivery:** token creation, authorization, rate limiting, streaming
- **Customer:** My Account endpoints and templates
- **Admin:** entitlement, release, and log screens
- **Reporting:** aggregation, queries, exports, retention
- **Email:** WooCommerce-compatible email classes
- **REST:** licensing and integration endpoints
- **Storage:** local and cloud-provider contracts
- **CLI:** maintenance, migration, and diagnostic commands

### Suggested database tables

Use dedicated tables for high-volume transactional data rather than post meta.

- `{prefix}purecart_files`
- `{prefix}purecart_releases`
- `{prefix}purecart_entitlements`
- `{prefix}purecart_download_logs`
- `{prefix}purecart_licenses` (Pro)
- `{prefix}purecart_activations` (Pro)

Tables should include appropriate composite indexes, UTC timestamps, schema versions, and explicit retention behavior. WooCommerce order and product IDs remain the canonical commerce references.

### Compatibility requirements

- Current WordPress-supported PHP versions
- WooCommerce HPOS
- WooCommerce Cart and Checkout Blocks
- Classic checkout
- WordPress multisite evaluation
- Object caching
- Action Scheduler
- Local and remote file storage
- Translation and RTL layouts
- GDPR export and erasure tools

## 9. Security Requirements

- Never expose permanent local storage paths
- Use cryptographically secure random tokens
- Sign tokens and compare signatures safely
- Bind access to an entitlement and file identifier
- Enforce expiration and download limits server-side
- Sanitize input and escape output at the correct boundary
- Use nonces for administrative mutations
- Check capabilities for every privileged action
- Protect REST endpoints with explicit permission callbacks
- Prevent directory traversal, URL injection, and insecure redirects
- Rate-limit repeated failures and license validation abuse
- Redact sensitive token data from logs
- Document web-server protection rules and failure modes
- Include security tests for authorization and refund transitions

## 10. Performance Requirements

- Do not load PureCart services on unrelated front-end requests
- Use indexed custom tables for logs and entitlements
- Process emails, release notifications, and aggregation asynchronously
- Paginate all administrative logs
- Stream large files without loading them fully into PHP memory
- Support HTTP range behavior only after a security and compatibility review
- Cache derived reports, not authorization decisions
- Provide configurable log retention and cleanup jobs

## 11. UX Requirements

### Merchant experience

- Guided setup after activation
- Sensible secure defaults
- Clear dependency and configuration diagnostics
- Product-level settings written in merchant language
- No requirement to understand WooCommerce permission internals
- Actionable failure messages

### Customer experience

- Reach a purchased file in two clicks or fewer after login
- Clearly show why a download is unavailable
- Avoid exposing security terminology
- Accessible keyboard navigation and status messaging
- Consistent presentation in email, order confirmation, and My Account

## 12. Business Model

### Free core

- Local protected delivery
- Multiple files
- Expiring links and limits
- Customer download library
- Entitlement administration
- Basic logs and reports
- Developer hooks

### Pro plan

- Product releases and update notifications
- Advanced reporting
- Cloud storage
- Software licensing
- Subscription bridge
- Priority support

### Optional standalone modules

- Licensing
- Cloud storage provider pack
- Subscriptions integration
- Growth and marketing tools

The free version must solve a complete digital-delivery problem. Pro should monetize operational scale and advanced business models rather than basic security.

## 13. Success Metrics

- Setup-to-first-protected-product completion rate
- Successful download rate
- Authorization-denial false-positive rate
- Support tickets per 1,000 orders
- Percentage of customers using My Account downloads
- Average response time for authorization
- Merchant activation and 30-day retention
- Free-to-Pro conversion
- Renewal rate
- Compatibility incidents by WooCommerce release

## 14. Delivery Roadmap

### Phase 0: Validation, 2 weeks

- Interview 10-15 WooCommerce digital sellers
- Audit WooCommerce downloadable-product hooks and data flows
- Prototype HPOS order synchronization
- Test protected delivery on Apache, Nginx, and common managed hosts
- Validate name, trademark, slug, and domain

### Phase 1: Technical foundation, 3 weeks

- Plugin bootstrap and dependency checks
- Database migrations
- Product file model
- Entitlement service
- Automated test foundation

### Phase 2: MVP delivery, 4 weeks

- Secure token authorization
- Local protected delivery
- Order and refund synchronization
- Administration screens
- Customer download library

### Phase 3: Product readiness, 3 weeks

- Emails and reports
- Checkout Blocks compatibility
- HPOS and multisite testing
- Accessibility and translation review
- Security review and load testing

### Phase 4: Beta, 2-4 weeks

- Private beta with real stores
- Telemetry based on explicit opt-in
- Compatibility fixes
- Documentation and onboarding
- WordPress.org submission preparation

## 15. Test Strategy

- Unit tests for token, expiration, limit, and state-transition rules
- Integration tests with WooCommerce orders and refunds
- HPOS enabled and disabled test matrix
- Simple, variable, guest, registered, and mixed-cart orders
- Full and partial refunds
- Duplicate webhook and hook execution
- Expired, revoked, exhausted, and malformed links
- Large-file streaming and interrupted downloads
- Checkout Blocks and classic checkout
- Multisite, object cache, and Action Scheduler
- Static analysis, coding standards, and dependency audit
- Browser tests for product setup and customer downloads

## 16. Key Risks

| Risk | Impact | Mitigation |
|---|---|---|
| File URLs leak through storage configuration | Critical | Protected storage checks, diagnostics, documentation |
| Order hooks run repeatedly | High | Idempotent entitlement operations and unique constraints |
| Refund behavior removes valid access | High | Explicit policies and line-item-aware tests |
| Large files exhaust PHP resources | High | Streaming, offload adapters, host diagnostics |
| WooCommerce updates change checkout behavior | High | Blocks-first compatibility tests and release matrix |
| Logging creates oversized tables | Medium | Indexed queries, retention settings, scheduled cleanup |
| Licensing API is abused | High | Rate limits, signed requests where appropriate, audit logs |
| Product name conflicts legally | High | Trademark and marketplace review before branding investment |

## 17. MVP Acceptance Criteria

The MVP is ready for beta when:

- A merchant can protect multiple files on a WooCommerce product
- A paid order creates the correct entitlement exactly once
- An authorized customer can download through an expiring URL
- An unauthorized, expired, revoked, or exhausted URL is rejected
- Refund behavior follows the configured policy
- An administrator can find and manage access
- A customer can retrieve all eligible purchases from My Account
- HPOS, classic checkout, and Checkout Blocks pass the test matrix
- Large-file delivery does not exceed the documented memory profile
- No critical issues remain after an independent security review

## 18. Immediate Research Tasks

1. Map WooCommerce download-permission APIs and order-status hooks.
2. Decide whether MVP entitlements wrap or replace WooCommerce download permissions.
3. Benchmark local streaming against server offload and signed cloud redirects.
4. Define partial-refund behavior for multi-item orders.
5. Prototype the My Account library with 1,000 purchases.
6. Test Checkout Blocks messaging and account-creation flows.
7. Interview merchants about releases versus simple file replacement.
8. Complete trademark, WordPress.org slug, domain, and social-handle checks.

## 19. Competitive Pricing Research

### EDD pricing snapshot

The supplied Easy Digital Downloads pricing screenshot was reviewed on June 21, 2026. It shows promotional annual prices at approximately 50% below the displayed regular prices. Pricing is time-sensitive and must be rechecked before making launch decisions.

| EDD plan | Promotional price shown | Regular price shown | Sites | Main expansion point |
|---|---:|---:|---:|---|
| Personal | $99.50/year | $199/year | 1 | Entry-level selling and reporting |
| Extended | $199.50/year | $399/year | 1 | Bundles, reviews, content restriction, Zapier, multi-currency |
| Professional | $299.50/year | $599/year | 2 | Software licensing, marketplace, commissions, funnels |
| All Access | $499.50/year | $999/year | 3 | Fraud tools, advanced reports, loyalty, bulk discounts, comparisons |

### Feature ladder visible in the screenshot

**Personal:** unlimited products, checkout and cart, subscriptions and trials, Stripe, PayPal, Apple Pay, discounts, EU VAT, AI recommendations, abandoned-cart recovery, revenue reporting, and standard support.

**Extended:** adds Authorize.net and 2Checkout, multi-currency, content restriction, product bundles, customer reviews, Zapier, and related growth capabilities.

**Professional:** adds software licensing and API, multi-vendor marketplace, commissions and payouts, recommended products, wish lists, physical shipping, and post-purchase funnels.

**All Access:** adds loyalty and rewards, fraud prevention, advanced reports, bulk discount generation, product comparisons, direct customer messaging, and the broadest feature access.

### Important comparison rule

EDD is a commerce platform, while PureCart is a WooCommerce add-on. A raw checklist comparison would therefore be misleading. The following screenshot features are already substantially supplied by WooCommerce or its established ecosystem:

- Products, cart, checkout, orders, and refunds
- Stripe, PayPal, Apple Pay, and other payment gateways
- Coupons and discount codes
- Taxes and VAT integrations
- Physical-product shipping
- Revenue reporting
- Product reviews
- Related and recommended products
- Subscriptions, bundles, marketplace, loyalty, and wish-list extensions

PureCart should integrate with these WooCommerce capabilities. It should not duplicate them merely to match EDD's pricing table.

### Competitive feature focus for PureCart

| Capability | WooCommerce role | PureCart opportunity | Priority |
|---|---|---|---|
| Secure file delivery | Basic downloadable files | Signed links, protected sources, limits, audit trail | MVP |
| Customer download library | Basic account downloads | Product-centric library, releases, docs, access states | MVP |
| Entitlement management | Download permissions | Searchable access records, policies, manual controls | MVP |
| Product releases | File replacement | Versions, changelog, eligibility, update notifications | Pro |
| Software licensing | Requires another extension | Keys, activations, validation API, updates | Pro |
| Cloud storage | Limited/provider-dependent | S3-compatible adapters and signed redirects | Pro |
| Subscription access | Extension-dependent | Bridge subscription state to downloads and licenses | Pro |
| Download analytics | Limited | Success, denial, abuse, product, customer, retention | Plus/Pro |
| Marketplace integration | Established extensions exist | Compatibility with vendor ownership and commissions | Later |

### Recommended PureCart packaging hypothesis

These are starting hypotheses for customer interviews and pricing tests, not final prices.

| PureCart plan | Target annual price | Sites | Proposed scope |
|---|---:|---:|---|
| Free | $0 | 1 | Protected local delivery, limits, customer library, basic logs |
| Plus | $79 | 1 | Releases, update emails, advanced logs and reports |
| Pro | $149 | 3 | Software licensing, REST API, subscription bridge |
| Agency | $299 | 25 | Pro features, cloud adapters, priority support, client use |

### Pricing rationale

- PureCart can enter below EDD because the merchant already has WooCommerce handling commerce fundamentals.
- The free edition must demonstrate secure delivery and produce a complete customer journey.
- Software licensing is the clearest high-value upgrade trigger.
- Site limits should be simpler and more generous than the screenshot's one-to-three-site structure.
- Do not market "no platform fees" as a unique benefit; WooCommerce merchants already expect that.
- Avoid permanent 50%-off framing. Use transparent renewal pricing and limited launch offers.
- Validate willingness to pay separately for creators, software vendors, and agencies.

### Recommended comparison-page message

> Keep WooCommerce. Add the digital-product tools it is missing.

The comparison page should measure fewer, more relevant outcomes: secure delivery, access control, release management, licensing, cloud storage, customer self-service, and WooCommerce compatibility.

## 20. Recommended Product Decision

Build PureCart as a focused WooCommerce extension that owns **delivery and entitlement**, not commerce. Release a useful free core with secure local delivery and a customer library. Monetize licensing, cloud storage, subscriptions, and operational tooling through Pro modules.

This boundary gives the product a clear reason to exist while retaining the strongest part of WooCommerce: its checkout, payments, orders, and integration ecosystem.
