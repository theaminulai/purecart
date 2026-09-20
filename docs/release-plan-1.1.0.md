# PureCart v1.1.0 — Release Plan

**Status as of:** 2026-09-19
**Published version (WordPress.org / `main`):** 1.0.2
**Unreleased work (`development`):** 67 commits ahead of `main` — Subscriptions, SaaS, and Updates modules

This plan inventories everything sitting on `development` but not yet released, everything still visibly incomplete in the codebase, and lays out what needs to happen before the next version ships.

---

## 1. What's already done and QA-clean

These modules have complete backends, working REST APIs, and QA checklists that have been run (some bugs found and fixed along the way — see checklist docs for history):

| Module | Backend | Admin UI (React SPA) | QA checklist |
|---|---|---|---|
| Licensing (keys, activation, staging exemption, JWT) | ✅ `includes/Licensing/` | ❌ `LicensesPage.tsx` is `<ComingSoon />` | — |
| Secure Downloads (tokens, dispatch) | ✅ `includes/Downloads/` | ❌ `DownloadsPage.tsx` is `<ComingSoon />` | — |
| Plugin Updates (version mgmt, license gate, channels) | ✅ `includes/Updates/` (13 classes) | ✅ full `Updates/` component set, wired to `updates.api.ts` | [docs/UPDATES-QA-BN.md](UPDATES-QA-BN.md) — passed |
| Subscriptions (billing, dunning, retention, coupons, roles) | ✅ `includes/Subscriptions/` (23 classes) | ✅ full `Subscriptions/` component set, wired to `subscriptions.api.ts` | [docs/subscription-module/QA-CHECKLIST-BN.md](subscription-module/QA-CHECKLIST-BN.md) — checklist written, wiring landed after |
| SaaS Provisioning (accounts, API keys, JWT auth) | ✅ `includes/SaaS/` | ❌ `SaasAccountsPage.tsx` is `<ComingSoon />` | [docs/saas-module/QA-CHECKLIST-BN.md](saas-module/QA-CHECKLIST-BN.md) — passed |

**Note on the Subscriptions QA checklist:** it was written when the dashboard was still a mockup, but commits after it (`8719135` Wire subscription actions to real endpoints, `16bd65c` Wire retention/cancel flows to API, `0e46de1`/`3941a7c` lifecycle APIs) wired the SPA to real data. The checklist's "React dashboard can't be tested" caveat is now stale and the UI pass should be re-verified against real API calls, not re-read as still true.

---

## 2. What's pending

### 2.1 Blocking — should land before v1.1.0

- [ ] **Wire the Licenses admin page to real data.** `LicensesPage.tsx` is a placeholder even though the backend (license generation, activation, staging exemption) has been production-ready since v1.0.0. Merchants currently have no in-SPA way to view/manage licenses.
- [ ] **Wire the Downloads admin page to real data.** Same situation as Licenses — `DownloadsPage.tsx` is a placeholder over a finished backend.
- [ ] **Wire the SaaS Accounts admin page to real data.** Backend and QA are done; only `SaasAccountsPage.tsx` (`ComingSoon`) is missing. This is the most surprising gap since the SaaS module QA checklist otherwise reads as complete.
- [ ] **Run `composer phpcs` clean across the SaaS and Subscriptions changes.** The SaaS QA checklist explicitly flags this as skipped ("vendor/ wasn't installed this session — do before merge").
- [ ] **Re-verify the Subscriptions QA checklist against the now-wired React dashboard**, not just the DB/REST layer it was written against.
- [ ] **nginx deploy note for Updates module**: package folder (`wp-content/uploads/purecart-packages/`) needs a `location ~* ... { deny all; }` rule added to production nginx configs — the plugin's own `.htaccess` protection doesn't apply under nginx. Not a code change, but a deployment-checklist item that must not be missed at launch.

### 2.2 Non-blocking — explicitly deferred (already scoped as future phases)

From the Updates QA checklist ("যা এখনো নেই — Phase 2/3, ইচ্ছাকৃত"):
- Rollback flow, theme update support, GPG package signing, Electron/desktop update feed, S3/R2 delivery, WP-CLI commands, GitHub webhook auto-import.

From the SaaS QA checklist ("যা টেস্ট করা যাবে না — জানা সীমাবদ্ধতা"):
- `PlanSyncer` (plan-upgrade/downgrade webhook) — not built.
- Webhook retry/backoff — currently fire-and-forget, drops silently on failure.

From the master roadmap ([docs/RND.md](RND.md), Phase 3 onward) — **not started at all**, no `includes/` code exists yet:
- Security & Anti-Piracy (`RateLimiter`, `GeoBlocker`, `AbuseDetector`) — `SecurityPage.tsx` is a placeholder with nothing behind it.
- Analytics/Reporting module — `AnalyticsPage.tsx` is a placeholder (only `analytics.api.ts` exists, unwired).
- Affiliates — `AffiliatesPage.tsx` placeholder, no backend.
- Abandoned Cart recovery — `AbandonedCartPage.tsx` placeholder, no backend.
- Git/Bitbucket sync, enterprise/SSO features (Phase 4/7) — not started.

These are correctly out of scope for v1.1.0 and should stay on the roadmap rather than be rushed in.

### 2.3 Tech debt

- [ ] **Tailwind CSS removal** ([docs/tailwind-removal-plan.md](tailwind-removal-plan.md)) is still unexecuted — `tailwindcss` and `@tailwindcss/postcss` remain in `package.json`. The plan's line-number references to a 9,000-line `App.tsx` are stale (the app has since been split into `router/` + `components/`), so the plan needs a quick re-scan before executing, but the underlying goal (replace Tailwind with a small static stylesheet) is still valid and cheap.
- [ ] **Stale `readme` branch.** Contains an unmerged, much larger readme.txt rewrite (plugin renamed to "Woo Digital Downloads", different contributor, broader feature list) that diverged significantly from what `development`/`main` actually ship. Needs an explicit decision — merge, rebase down to just the intended change, or abandon — rather than being left dangling.
- [ ] Several stale local branches with no unmerged commits (`expand-subscriptions`, `org-for-plugin-rename-`, `pr/11`, `pr/13`, `pr/27`, `pr/31`, `Add-code-review-checklist`, `Build-React-admin-dashboard-with-Material-Design-3`, `Complete-licensing-module-staging-exemption,-JWT-tokens,-renewal-behavior`) can be deleted — their content is already merged into `development`.

---

## 3. Release sequence

1. **Finish blocking items (§2.1).** Priority order: SaaS Accounts page (backend fully QA'd, just needs wiring — lowest risk/highest payoff), then Licenses and Downloads pages, then the phpcs pass and Subscriptions UI re-verification.
2. **Merge `development` → `main`** once §2.1 is clear. This brings in Subscriptions, SaaS, and Updates as shipped features for the first time.
3. **Version bump.** Use the existing `release-new-version.yml` workflow (`workflow_dispatch`, choose `minor` since this adds three new modules) rather than hand-editing `readme.txt`/`purecart.php`.
4. **Changelog entry** for `PureCart/v1.1.0`, summarizing: Subscription billing engine, SaaS provisioning, Plugin Updates module, licensing completions (staging exemption, JWT, renewal behavior). Follow the terse `Added:` / `Fixed:` / `Refactor:` style already used in `readme.txt`.
5. **Apply the nginx deploy note (§2.1)** to any production/staging server docs before announcing.
6. **Post-release cleanup**: delete the stale merged branches listed in §2.3, and decide the fate of the `readme` branch.

---

## 4. Deferred to a later release

Everything in §2.2 (Phase 2/3 Updates gaps, SaaS PlanSyncer/webhook retry, and the entirely-unstarted Security/Analytics/Affiliates/Abandoned-Cart modules) belongs to v1.2.0 or later per the existing roadmap in [docs/RND.md](RND.md) §7. No action needed now beyond keeping the roadmap phases as the source of truth.
