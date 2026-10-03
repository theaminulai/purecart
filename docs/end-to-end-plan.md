# PureCart — End-to-End Build Plan

**Plugin:** `woo-digital-downloads` / namespace `PureCart\`  
**Date:** 2026-10-03  
**Scope:** Secure Downloads · Licensing · Updates · SaaS Provisioning · Subscriptions  
**Stack:** PHP 8.1+ · WooCommerce · React (WordPress Scripts) · Action Scheduler · firebase/php-jwt

---

## 1. Current State Summary

| Module | PHP Backend | REST API | React Admin UI | Emails | Customer Portal |
|---|---|---|---|---|---|
| Secure Downloads | ✅ Complete | ✅ Complete | ✅ Complete | — (no email needed) | ✅ WC native tab merged |
| Licensing | ✅ Complete | ✅ Complete | ✅ Complete | ✅ Just added | ✅ My Licenses tab |
| Updates | ✅ Complete | ✅ Complete | ✅ Complete | ✅ UpdateAvailableEmail | ✅ Software Updates tab |
| SaaS Provisioning | ✅ Complete | ✅ Complete | ✅ Complete | ✅ AccountProvisionedEmail | ✅ API Keys tab |
| Subscriptions | ✅ Complete | ✅ Complete | ✅ Complete | ✅ 20 emails | 🔲 Pending (Phase 6) |

**Overall assessment:** All five modules are feature-complete at the PHP and React layers. The only remaining gaps before production are environment hygiene (plugin conflicts), one missing payment gateway, and the Subscriptions customer portal (deferred to Phase 6 per the R&D plan).

---

## 2. Immediate Actions (Before Any Testing)

### 2.1 Deactivate All Research/Competitor Plugins

These plugins were installed for R&D reference. Every one of them hooks into the same WooCommerce actions PureCart uses (`woocommerce_order_status_completed`, `rest_authentication_errors`, Action Scheduler) and will cause double-processing, duplicate license rows, and 401 errors on PureCart REST endpoints while active.

**Deactivate now — keep installed for reference only:**

| Plugin | Conflict with |
|---|---|
| `software-license-manager` | Licensing — hooks order complete, issues own keys |
| `license-manager-for-woocommerce` | Licensing — same order hooks, own license meta |
| `digital-license-manager` | Licensing — same order hooks, own license meta |
| `wc-key-manager` | Licensing — same order hooks |
| `arraysubs` | Subscriptions — extensive shared hooks including Action Scheduler |
| `subscriptions-for-woocommerce` | Subscriptions — order status hooks |
| `sublium-subscriptions-for-woocommerce` | Subscriptions — order status hooks |
| `yith-woocommerce-subscription` | Subscriptions — order status hooks |
| `recurio` | Subscriptions — order status hooks |
| `milosubscriptions` | Subscriptions — order status hooks |
| `paid-member-subscriptions` | Subscriptions — membership/role hooks |
| `easy-digital-downloads` | Downloads + Updates — standalone eCommerce, conflicts with WC product types |
| `jwt-auth` | SaaS + Licensing — intercepts `Authorization: Bearer` before PureCart |
| `jwt-authentication-for-wp-rest-api` | SaaS + Licensing — same, different plugin |
| `cocart-jwt-authentication` | SaaS — intercepts Bearer tokens on WC REST |
| `invizo-cart` | Downloads — cart modification hooks |

**Keep active:**

| Plugin | Role |
|---|---|
| `woocommerce` | Required — core dependency |
| `woocommerce-gateway-stripe` | Required — subscription renewals + payment |
| `plugin-check` | Dev tool — run before WP.org submission |
| `akismet` | Unrelated — safe |
| `better-payment` | Unrelated — safe |
| `payoneer-checkout` | Unrelated — safe |
| `visa-acceptance-solutions` | Unrelated — safe |
| `lemon-squeezy` | Unrelated — safe |
| `soldx-for-woocommerce` | Unrelated — safe |
| `wrc-pricing-tables` | Unrelated — safe |
| `cart-rest-api-for-woocommerce` | CoCart — verify no Bearer header conflict (see §2.3) |
| `wp-rest-api-authentication` | Auth plugin — verify no conflict (see §2.3) |
| `oauth2-provider` | Auth plugin — verify no conflict (see §2.3) |

### 2.2 Install Missing Required Plugin

**WooCommerce PayPal Payments** is not installed. Only Stripe is present.  
PureCart's `RenewalEngine` needs a second gateway for PayPal customers. Without it, PayPal buyers have no auto-renewal path and every dunning retry will permanently fail.

→ Install from WordPress.org: `woocommerce-paypal-payments`

### 2.3 Verify Remaining Auth Plugins

`wp-rest-api-authentication`, `oauth2-provider`, and `cart-rest-api-for-woocommerce` all touch REST authentication. With the three JWT plugins deactivated (§2.1), verify these remaining plugins do not intercept `Authorization: Bearer` headers on `purecart/v1/*` routes.

**Test:** Call `POST /wp-json/purecart/v1/license/activate` with a valid license key while each is active. If you get a 401 that PureCart's own `LicenseActivator` never produced, one of these is intercepting. Resolve by adding a bypass filter in PureCart's `API/PureCartApi.php` or coordinate with that plugin's exclusion list.

---

## 3. Module-by-Module Completion Checklist

### 3.1 Secure Downloads

**PHP — `includes/Downloads/`**
- [x] `TokenManager.php` — signed expiring tokens, `create_token()`, `validate_token()`
- [x] `DownloadDispatcher.php` — PHP streaming, no direct file URLs, token validation gate
- [x] `DownloadLogRepository.php` — IP, user-agent, country, timestamp per download
- [x] `AccountDownloadsMerger.php` — merges PureCart downloads into WC native Downloads tab
- [x] `Module.php` — bootstraps all of the above

**REST API — `includes/API/Downloads.php`**
- [x] `GET /download/{token}` — serve file, decrement count, log
- [x] `POST /download/generate` — internal token generation

**React — `src/app/modules/downloads/`**
- [x] `DownloadsPage.tsx` — admin list with filter bar, KPI strip
- [x] `DownloadsTable.tsx` — sortable, bulk actions
- [x] `api.ts` + `downloads.slice.ts` — full Redux wiring
- [x] `types.ts`, `constants.ts`

**Customer portal**
- [x] WooCommerce native Downloads tab — PureCart tokens merged in via `AccountDownloadsMerger`

**Done when:** Token issued on `woocommerce_order_status_completed` → download link in order email → customer clicks → file streams → log row created → admin Downloads page shows the event.

---

### 3.2 Licensing

**PHP — `includes/Licensing/`**
- [x] `LicenseGenerator.php` — `random_bytes()` key generation, `create()`, `extend_expiry()`, `set_status()`
- [x] `LicenseActivator.php` — activate/deactivate by domain, staging/local exemption, activation counter
- [x] `JwtHooks.php`, `Jwt.php`, `JwtSecret.php` — license JWT token issuance, cleanup, hooks
- [x] `LicenseTokenIssuer.php`, `LicenseTokenValidator.php`, `LicenseTokenRefresher.php`, `LicenseTokenRevoker.php`, `LicenseTokenCleanup.php`
- [x] `Emails/LicensePurchasedEmail.php` — WC_Email, fires on `purecart_license_created`
- [x] `Module.php` — wires JwtHooks, registers email, boots API

**REST API — `includes/API/Licenses.php`**
- [x] `POST /license/activate`
- [x] `POST /license/deactivate`
- [x] `GET  /license/check`
- [x] `POST /license/revoke` (admin)
- [x] `GET  /license/ping`
- [x] `POST /license/token/refresh` (JWT)
- [x] `POST /license/token/revoke-all` (JWT)
- [x] `GET  /licenses` (admin list)
- [x] `GET  /licenses/{id}` (admin detail)
- [x] `POST /licenses/{id}/status` (admin: set status)
- [x] `POST /licenses/{id}/reset-activations` (admin)
- [x] `POST /licenses/{id}/duplicate` (admin)
- [x] `GET  /licenses/stats` (KPI strip)

**React — `src/app/modules/licenses/`**
- [x] `LicensesPage.tsx` — list, filter, bulk status change
- [x] `LicenseDetailPage.tsx` — activations table, status change, reset, revoke
- [x] `LicenseKeyReveal.tsx` — blur/reveal/copy component
- [x] `api.ts` + `licenses.slice.ts` + `licenses.selectors.ts`

**Customer portal — `includes/CustomerDashboard/Dashboard.php`**
- [x] My Licenses tab — blurred key reveal, activation form per license, sites used / limit, expiry

**Email**
- [x] `LicensePurchasedEmail.php` — license key, site limit, expiry, link to My Licenses tab

**Done when:** Order complete → license row created → "License Key Purchased" email delivered → customer sees key in My Account → activates a domain via the form → activation appears in admin LicenseDetailPage → admin can revoke from the same detail page.

---

### 3.3 Plugin Updates

**PHP — `includes/Updates/`**
- [x] `UpdateServer.php` — `/purecart/v1/plugin/update-check`, `update-info`, `download/{token}`
- [x] `UpdateDelivery.php` — token-gated ZIP streaming
- [x] `UpdatePackageManager.php` — upload, store, version management
- [x] `ChangelogManager.php` — per-version changelog storage
- [x] `PackageRepository.php` — DB queries for packages and versions
- [x] `UpdateChannelRouter.php` — stable / beta channel routing
- [x] `UpdateNotifier.php` — fires `purecart_update_available`
- [x] `ProductLocator.php` — maps license key → product → latest version
- [x] `AdoptionRepository.php` — tracks which version each site is running
- [x] `UpdateReport.php` — adoption metrics for admin UI
- [x] `ProductUpdatesTab.php` — WooCommerce product tab for version uploads
- [x] `UpdateInfo.php` — data object for update payloads
- [x] `LicenseGate.php` — validates license is active before serving a ZIP
- [x] `Emails/UpdateAvailableEmail.php` — WC_Email, fires on `purecart_update_available`
- [x] `Module.php`

**REST API — `includes/API/Updates.php`**
- [x] `GET /plugin/update-check` — version comparison + license gate
- [x] `GET /plugin/update-info/{slug}` — metadata for WP updater
- [x] `GET /plugin/download/{token}` — serve ZIP
- [x] `GET /plugin/changelog/{slug}` — changelog JSON
- [x] `GET /updates` (admin list)
- [x] `GET /updates/report` (adoption metrics)
- [x] `POST /updates/packages` (upload new version)

**React — `src/app/modules/updates/`**
- [x] `UpdatesPage.tsx` — version list, upload drawer, filter bar
- [x] `NewReleaseDrawer.tsx` — upload form
- [x] `ChangelogModal.tsx`
- [x] `UpdateAnalyticsPage.tsx` — adoption metrics
- [x] `UpdatesKpiStrip.tsx`, `VersionBadge.tsx`, `PlatformChip.tsx`
- [x] `api.ts` + `updates.slice.ts` + `updates.selectors.ts`

**Customer portal — `templates/myaccount/purecart-updates.php`**
- [x] Software Updates tab — per-product version list, changelog, download link

**Done when:** Admin uploads a ZIP to a product → site running an old version polls `/plugin/update-check` → gets `update_available: true` → downloads ZIP via token-gated endpoint → WP core applies the update → adoption report in admin reflects new version count.

---

### 3.4 SaaS Provisioning

**PHP — `includes/SaaS/`**
- [x] `AccountProvisioner.php` — `provision_for_order_item()`, `suspend()`, `activate()`, `get_by_user()`
- [x] `ApiKeyManager.php` — `generate()`, `rotate()`, `revoke()`
- [x] `JwtIssuer.php` — HS256 access token (10 min) + server-stored refresh token (30 days)
- [x] `JwtSecret.php` — rotating secret management
- [x] `Emails/AccountProvisionedEmail.php` — API key + account URL
- [x] `Module.php` — registers email, boots API

**REST API — `includes/API/SaaS.php`**
- [x] `GET  /saas/usage/{api_key}` — plan, status, provisioned_at
- [x] `POST /saas/provision` — internal/webhook account creation
- [x] `POST /saas/suspend`
- [x] `POST /saas/activate`
- [x] `POST /saas/rotate-key` — API key rotation
- [x] `POST /saas/jwt/issue` — issue access + refresh tokens
- [x] `POST /saas/jwt/refresh`
- [x] `GET  /saas-accounts` (admin list)
- [x] `GET  /saas-accounts/{id}` (admin detail)
- [x] `POST /saas-accounts/{id}/status` (suspend/activate)

**React — `src/app/modules/saas-accounts/`**
- [x] `SaasAccountsPage.tsx` — list, filter, KPI strip, pagination
- [x] `SaasAccountDetailPanel.tsx` — side panel: status, API key, plan, actions
- [x] `useSaasAccountActions.tsx` — suspend/activate/rotate key
- [x] `api.ts` + `saas-accounts.slice.ts`

**Customer portal — `includes/CustomerDashboard/Dashboard.php`**
- [x] API Keys tab — plan, API key display, status per product

**Done when:** Order complete for `purecart_saas` product → SaaS account row created → API key generated → "SaaS Account Ready" email sent with key → customer sees key in My Account API Keys tab → external service calls `/saas/usage/{api_key}` → gets plan + status → admin can suspend from SaaS Accounts page.

---

### 3.5 Subscriptions

**PHP — `includes/Subscriptions/`**
- [x] `SubscriptionManager.php` — pause, resume, cancel, skip, resubscribe
- [x] `RenewalEngine.php` — auto-renewal, early renewal, external renewal, `record_external_renewal()`
- [x] `DunningManager.php` — retry schedule, `run_retry()`, card update token generation
- [x] `PlanUpgrade.php` — upgrade/downgrade with proration modes
- [x] `WebhookHandler.php` — HMAC-verified gateway events, idempotency
- [x] `RetentionFlow.php` — cancellation reasons, eligible offers, `accept_offer()`
- [x] `ChurnScorer.php` — `score()`, `band()` (low/medium/high/critical)
- [x] `SubscriptionRepository.php` — `find()`, `find_all()`, `find_by_status()`
- [x] `SubscriptionLogRepository.php` — `find_by_subscription()`
- [x] `SubscriptionReport.php` — `summary()`, `export_rows()`, `to_csv()`
- [x] `RenewalSync.php`, `RoleManager.php`, `SplitPaymentManager.php`
- [x] `SubscriptionCoupon.php`, `SubscriptionExport.php`
- [x] `Emails/` — 20 WC_Email subclasses (see §5)
- [x] `Module.php` — boots all of the above, calls `SubscriptionsApi->register()`

**REST API — `includes/Api/Subscriptions.php`** (via `PureCartApi`)
- [x] `GET  /subscriptions` — admin list, filterable by status
- [x] `GET  /subscriptions/{id}`
- [x] `GET  /subscriptions/{id}/logs`
- [x] `POST /subscriptions/{id}/pause` (+ optional `resume_at`)
- [x] `POST /subscriptions/{id}/resume`
- [x] `POST /subscriptions/{id}/cancel`
- [x] `POST /subscriptions/{id}/skip`
- [x] `POST /subscriptions/{id}/early-renewal`
- [x] `POST /subscriptions/{id}/resubscribe`
- [x] `POST /subscriptions/{id}/upgrade`
- [x] `POST /subscriptions/{id}/renew` (admin-only)
- [x] `POST /subscriptions/{id}/retry-payment` (admin-only)
- [x] `POST /subscriptions/{id}/send-card-update` (admin-only)
- [x] `GET  /subscriptions/{id}/cancellation/reasons`
- [x] `GET  /subscriptions/{id}/cancellation/offers`
- [x] `POST /subscriptions/{id}/cancellation/accept-offer`
- [x] `POST /subscriptions/{id}/external-renewal` (HMAC)
- [x] `POST /subscriptions/{id}/webhook-event` (HMAC)
- [x] `GET  /reports/subscriptions/summary`
- [x] `GET  /reports/subscriptions/export` (CSV or JSON)

**React — `src/app/modules/subscriptions/` + analytics**
- [x] Full subscriptions admin UI (most complete module — reference implementation)
- [x] `SubscriptionAnalyticsPage.tsx`, `ChurnRiskTable.tsx`, `RevenueGoalsWidget.tsx`

**Customer portal**
- 🔲 Not yet built — deferred to Phase 6 (Customer Portal)
- Planned: WC My Account "My Subscriptions" tab — pause, cancel, skip, early renewal, card update

**Done when:** Customer purchases subscription product → subscription row created → `SubscriptionCreatedEmail` sent → `RenewalEngine` schedules renewal via Action Scheduler → renewal fires → `RenewalSuccessfulEmail` sent → payment fails → `PaymentFailedEmail` + dunning retry scheduled → admin sees subscription in Subscriptions admin page → admin can pause/cancel/retry from there.

---

## 4. Database Tables

All managed by `includes/Store/` via `PureCartStore` base class, created on `plugin_action_activate` and `Activator::maybe_upgrade()`.

| Table | Store class | Module |
|---|---|---|
| `purecart_licenses` | `Store/Licenses.php` | Licensing |
| `purecart_license_activations` | `Store/LicenseActivations.php` | Licensing |
| `purecart_downloads` | `Store/Downloads.php` | Secure Downloads |
| `purecart_download_logs` | `Store/DownloadLogs.php` | Secure Downloads |
| `purecart_product_versions` | `Store/ProductVersions.php` | Updates |
| `purecart_saas_accounts` | `Store/SaasAccounts.php` | SaaS |
| `purecart_subscriptions` | `Store/Subscriptions.php` | Subscriptions |
| `purecart_subscription_items` | `Store/SubscriptionItems.php` | Subscriptions |
| `purecart_subscription_payments` | `Store/SubscriptionPayments.php` | Subscriptions |
| `purecart_subscription_logs` | `Store/SubscriptionLogs.php` | Subscriptions |
| `purecart_subscription_linked_entities` | `Store/SubscriptionLinkedEntities.php` | Subscriptions |
| `purecart_subscription_revenue` | `Store/SubscriptionRevenue.php` | Subscriptions |
| `purecart_revenue_goals` | `Store/RevenueGoals.php` | Subscriptions |

---

## 5. Email Inventory

### Licensing
| Email ID | Trigger action | Class |
|---|---|---|
| `purecart_license_purchased` | `purecart_license_created` | `Licensing/Emails/LicensePurchasedEmail.php` |

### Updates
| Email ID | Trigger action | Class |
|---|---|---|
| `purecart_update_available` | `purecart_update_available` | `Updates/Emails/UpdateAvailableEmail.php` |

### SaaS
| Email ID | Trigger action | Class |
|---|---|---|
| `purecart_saas_account_provisioned` | `purecart_saas_provisioned` | `SaaS/Emails/AccountProvisionedEmail.php` |

### Subscriptions (20 emails)
| Email ID | Class |
|---|---|
| `purecart_subscription_created` | `SubscriptionCreatedEmail.php` |
| `purecart_renewal_successful` | `RenewalSuccessfulEmail.php` |
| `purecart_renewal_reminder` | `RenewalReminderEmail.php` |
| `purecart_payment_failed` | `PaymentFailedEmail.php` |
| `purecart_payment_retry_scheduled` | `PaymentRetryScheduledEmail.php` |
| `purecart_payment_reauthorization` | `PaymentReauthorizationEmail.php` |
| `purecart_overdue_notice` | `OverdueNoticeEmail.php` |
| `purecart_suspend_notice` | `SuspendNoticeEmail.php` |
| `purecart_suspended_grace_ending` | `SuspendedGraceEndingEmail.php` |
| `purecart_expiration_notice` | `ExpirationNoticeEmail.php` |
| `purecart_cancellation_notice` | `CancellationNoticeEmail.php` |
| `purecart_plan_changed` | `PlanChangedEmail.php` |
| `purecart_trial_started` | `TrialStartedEmail.php` |
| `purecart_trial_ending_soon` | `TrialEndingSoonEmail.php` |
| `purecart_trial_converted` | `TrialConvertedEmail.php` |
| `purecart_card_expiring_soon` | `CardExpiringSoonEmail.php` |
| `purecart_skip_renewal_confirmed` | `SkipRenewalConfirmedEmail.php` |
| `purecart_resubscription_confirmed` | `ResubscriptionConfirmedEmail.php` |

All emails appear under **WooCommerce → Settings → Emails** and can be toggled on/off and edited by the site admin.

---

## 6. Plugin Bootstrap Order

```
purecart.php
└── Plugin::instance()
    ├── Activator::maybe_upgrade()       -- schema check, dbDelta if version bumped
    ├── CommerceModule                   -- OrderHandler (license + token + SaaS on order complete)
    │                                       ProductTypes (purecart_plugin, purecart_saas, purecart_bundle)
    ├── Dashboard                        -- WC My Account: Licenses · Updates · API Keys tabs
    ├── DownloadsModule                  -- DownloadDispatcher REST, AccountDownloadsMerger
    ├── LicensingModule                  -- JwtHooks, LicensePurchasedEmail, Licenses API
    ├── SubscriptionsModule              -- All subscription classes + SubscriptionsApi->register()
    ├── UpdatesModule                    -- UpdateServer, UpdateNotifier, UpdateAvailableEmail
    ├── SaasModule                       -- AccountProvisionedEmail, SaaS API
    ├── Admin (is_admin() only)          -- React SPA shell, admin menus
    └── WP-CLI commands (WP_CLI only)   -- purecart license, purecart saas
```

---

## 7. Action Scheduler Jobs

All background jobs use group `'purecart'` and are scheduled via Action Scheduler (bundled with WooCommerce). No raw `wp_cron`.

| Action hook | Scheduled by | Purpose |
|---|---|---|
| `purecart_check_expired_licenses` | `JwtHooks` | Expire overdue licenses daily |
| `purecart_process_dunning` | `DunningManager` | Retry failed subscription payments |
| `purecart_cleanup_license_tokens` | `JwtHooks` | Purge expired JWT tokens |
| `purecart_send_renewal_reminder` | `RenewalEngine` | 7-day pre-renewal customer email |
| `purecart_send_trial_ending_notice` | `RenewalEngine` | Trial-ending-soon email |
| `purecart_send_expiration_notice` | `RenewalEngine` | Pre-expiry customer email |
| `purecart_auto_resume_subscription` | `SubscriptionManager` | Auto-resume after scheduled pause |
| `purecart_charge_renewal` | `RenewalEngine` | Fire renewal payment at next_payment_at |

---

## 8. Done Criteria

Run these before marking any module complete or opening a PR.

### PHP
```bash
composer cs          # zero PHPCS/WPCS errors
composer test        # PHPUnit (if tests exist)
```

### JavaScript
```bash
npx tsc --noEmit     # zero TypeScript errors
npm run lint:js      # zero ESLint errors
npm run lint:css     # zero Stylelint errors
npm run build        # clean production build, no warnings
```

### Manual smoke tests
- [ ] Fresh install: activate plugin → all 13 DB tables created → no PHP errors in debug log
- [ ] Order complete for `purecart_plugin` product → license row created → "License Key Purchased" email received → token row created in `purecart_downloads`
- [ ] Order complete for `purecart_saas` product → SaaS account row + API key created → "SaaS Account Ready" email received
- [ ] `POST /purecart/v1/license/activate` with valid key → `{ success: true }` → `activated_count` incremented
- [ ] Staging domain activation → `activated_count` NOT incremented
- [ ] `GET /purecart/v1/plugin/update-check?license_key=...&version=1.0.0` → returns update payload when newer version exists
- [ ] `GET /purecart/v1/saas/usage/{api_key}` → returns plan + status
- [ ] Subscription renewal via Action Scheduler → `purecart_subscriptions.status` stays `active` → `RenewalSuccessfulEmail` sent
- [ ] Payment failure → dunning retry scheduled → `PaymentFailedEmail` sent
- [ ] Admin Licenses page loads → KPI strip shows correct counts
- [ ] Admin Subscriptions page loads → churn band displayed on each row
- [ ] Customer My Account → "My Licenses" tab shows blurred key → Reveal/Copy works → domain activation form submits successfully

---

## 9. Phase Roadmap (Post-MVP)

| Phase | Scope | Status |
|---|---|---|
| 1 | Secure Downloads, Licensing, Updates | ✅ Complete |
| 2 | SaaS Provisioning, Subscriptions core | ✅ Complete |
| 3 | Security & Anti-Piracy (geo-blocking, rate limiting, abuse detection) | 🔲 Not started |
| 4 | Git Integration (GitHub webhook → auto ZIP import) | 🔲 Not started |
| 5 | Marketing (abandoned cart, affiliate bridge) | 🔲 Not started |
| 6 | Customer Portal — Subscriptions My Account tab (pause, cancel, skip, card update) | 🔲 Not started |
| 7 | Enterprise (white-label, SSO, audit logs, full WP-CLI) | 🔲 Not started |

---

## 10. Open Items Before Production

| # | Item | Priority | Owner |
|---|---|---|---|
| 1 | Deactivate all 16 research/competitor plugins | Critical | Manual |
| 2 | Install `woocommerce-paypal-payments` | High | Manual |
| 3 | Verify `wp-rest-api-authentication` + `oauth2-provider` don't intercept `purecart/v1/*` | High | Test |
| 4 | Run `composer cs` — fix any PHPCS errors | High | Dev |
| 5 | Run `npx tsc --noEmit` + `npm run lint:js` + `npm run build` | High | Dev |
| 6 | Run WP Plugin Check (`plugin-check`) and resolve all errors | High | Dev |
| 7 | Smoke test all module done criteria (§8) | High | QA |
| 8 | Subscriptions My Account customer portal (Phase 6) | Medium | Dev |
| 9 | PDF license certificate (Phase 3 roadmap) | Low | Dev |
| 10 | WP-CLI migration commands for DLM / LMFWC → PureCart | Low | Dev |
