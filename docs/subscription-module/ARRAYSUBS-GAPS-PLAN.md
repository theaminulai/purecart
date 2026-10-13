# PureCart — arraysubs Gap Features: End-to-End Implementation Plan

**Audit basis:** arraysubs plugin comparison (October 2026)  
**Reference architecture:** `src/DEVELOPMENT_GUIDELINES.md`, `docs/subscription-module/SUBSCRIPTION-GAPS-PLAN.md`  
**Branch convention:** one branch per feature, cut from `development`  
**Done criteria (PHP):** `composer cs` zero errors  
**Done criteria (src/):** `npx tsc --noEmit` + `npm run lint:js` + `npm run lint:css` + `npm run build`

---

## Admin SPA Architecture Quick Reference

| Concept | Convention |
|---|---|
| Router | `HashRouter` — `src/app/router/AppRouter.tsx` |
| Routes | `src/app/router/AppRoutes.tsx` + `paths.ts` + `nav-schema.ts` |
| Module folder | `src/app/modules/<name>/` |
| Module files | `index.ts`, `api.ts`, `types.ts`, `constants.ts`, `store/*.slice.ts`, `store/*.selectors.ts`, `components/`, `hooks/`, `utils/` |
| State | RTK `createSlice` + `createAsyncThunk` → registered in `src/app/store/store.ts` |
| Shared UI | `src/app/shared/ui/` — `KpiCard`, `StatCard`, `StatusBadge`, `ConfirmDialog`, `ActionDropdown`, `FilledButton`, `Skeleton`, `Toast` |
| Charts | `recharts` (already installed) |
| REST client | `purecartFetch<T>(path)` / `purecartFetchWithMeta<T>(path, params)` from `src/app/shared/api/client.ts` |
| REST namespace | `purecart/v1` |
| CSS | Tailwind CSS v4 via PostCSS |

---

## Features Covered

| # | Feature | Branch | Priority |
|---|---|---|---|
| 1 | Retention Analytics Dashboard | `feature/retention-analytics` | High |
| 2 | Content Gating with Drip | `feature/content-gating` | High |
| 3 | Member Discount Engine | `feature/member-discount` | High |
| 4 | Admin-Side Email Notifications | `feature/admin-emails` | Medium |
| 5 | Subscription Notes | `feature/subscription-notes` | Medium |
| 6 | Product Lifecycle Handler | `feature/product-lifecycle` | Medium |
| 7 | Login As User (Impersonation) | `feature/login-as-user` | Medium |
| 8 | Gutenberg Restricted Content Block | `feature/gutenberg-block` | Medium |
| 9 | Elementor Content Restriction | `feature/elementor-integration` | Low |
| 10 | Settings Import / Export | `feature/settings-io` | Low |
| 11 | Renewal Invoice Email | `feature/renewal-invoice` | Low |

---

## Feature 1 — Retention Analytics Dashboard

### What it is
An admin dashboard page showing MRR saved by retention offers, offer acceptance rate, churn breakdown by reason, dunning funnel, and a logs table. **Most of the backend already exists** — `SubscriptionReport`, `ChurnScorer`, `RetentionFlow`, and the `GET /reports/subscriptions/summary` endpoint all return this data.

### Backend — what already exists
- `GET /purecart/v1/reports/subscriptions/summary` → MRR, ARR, revenue_churn_rate, revenue_by_month, dunning_funnel, churn_by_reason
- `GET /purecart/v1/subscriptions/report/churn-risk` → per-subscriber churn score table
- `GET /purecart/v1/subscriptions/{id}/cancellation/reasons` → reasons breakdown
- `ChurnScorer` → 0–100 score with Low/Medium/High/Critical bands

### Backend — what to add

#### `GET /purecart/v1/reports/subscriptions/retention`
New endpoint in `includes/API/Subscriptions.php`:
```php
register_rest_route( PURECART_API_NAMESPACE, '/reports/subscriptions/retention', [
    'methods'             => 'GET',
    'callback'            => [ $this, 'get_retention_report' ],
    'permission_callback' => fn() => current_user_can( 'manage_woocommerce' ),
    'args'                => [
        'from' => [ 'type' => 'string', 'default' => gmdate( 'Y-m-01' ) ],
        'to'   => [ 'type' => 'string', 'default' => gmdate( 'Y-m-d' ) ],
    ],
] );
```

Response shape:
```json
{
  "mrr_saved":              1240.00,
  "offers_sent":            38,
  "offers_accepted":        14,
  "acceptance_rate":        36.8,
  "cancellations_prevented":14,
  "churn_rate_current":     3.2,
  "by_reason": [
    { "reason": "too_expensive", "count": 12, "saved": 6 },
    { "reason": "not_using",     "count": 9,  "saved": 5 }
  ],
  "by_offer": [
    { "offer": "discount_20",    "sent": 18, "accepted": 8, "mrr_saved": 680.00 },
    { "offer": "pause_1month",   "sent": 12, "accepted": 4, "mrr_saved": 320.00 }
  ],
  "logs": [
    { "subscription_id": 42, "customer": "Alice Active", "reason": "too_expensive",
      "offer": "discount_20", "outcome": "accepted", "mrr_saved": 49.00, "at": "2026-10-01" }
  ]
}
```

Add a `RetentionReportRepository` class in `includes/Subscriptions/Reports/RetentionReportRepository.php` that builds this from existing `purecart_subscription_logs` + `purecart_subscription_revenue` tables.

### Admin SPA — new module `src/app/modules/retention-analytics/`

#### Files to create
```
index.ts
api.ts
types.ts
constants.ts
components/
  RetentionAnalyticsPage.tsx        ← page root
  RetentionKpiStrip.tsx             ← MRR Saved / Offers Sent / Acceptance Rate / Cancellations Prevented
  RetentionByReasonChart.tsx        ← horizontal bar chart (recharts)
  RetentionByOfferTable.tsx         ← table: offer type / sent / accepted / MRR saved
  ChurnRiskTable.tsx                ← per-subscriber churn score table (reuses subscription list data)
  RetentionLogsTable.tsx            ← recent retention interactions log
  DateRangePicker.tsx               ← from/to filter (shared if not exists)
```

#### Routing
In `src/app/router/paths.ts`:
```ts
RETENTION_ANALYTICS: '/retention-analytics',
```
In `nav-schema.ts` — add under the Analytics section alongside `SubscriptionAnalyticsPage`.  
In `AppRoutes.tsx`:
```tsx
<Route path={PAGE_PATHS.RETENTION_ANALYTICS} element={<RetentionAnalyticsPage />} />
```

#### `RetentionAnalyticsPage.tsx` layout
```tsx
<RetentionKpiStrip data={report} />

<div className="grid grid-cols-2 gap-4">
  <RetentionByReasonChart data={report.by_reason} />
  <RetentionByOfferTable  data={report.by_offer} />
</div>

<ChurnRiskTable />      {/* reuses existing /subscriptions/report/churn-risk */}
<RetentionLogsTable data={report.logs} />
```

#### `api.ts`
```ts
export const fetchRetentionReport = ( from: string, to: string ) =>
  purecartFetch<RetentionReport>( `/reports/subscriptions/retention?from=${from}&to=${to}` );

export const fetchChurnRisk = () =>
  purecartFetch<ChurnRiskEntry[]>( `/subscriptions/report/churn-risk` );
```

---

## Feature 2 — Content Gating with Drip

### What it is
Restrict access to individual posts, pages, or CPTs by subscription plan. With optional drip: content unlocks N days after the subscription starts.

### Backend

#### DB table — `purecart_content_rules`
Add to `includes/Activator.php`:
```sql
CREATE TABLE {prefix}purecart_content_rules (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  post_id       BIGINT UNSIGNED NOT NULL,
  post_type     VARCHAR(50)     NOT NULL DEFAULT 'post',
  rule_type     ENUM('plan','product','role') NOT NULL DEFAULT 'plan',
  rule_value    VARCHAR(255)    NOT NULL,         -- plan slug / product_id / role slug
  drip_days     SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  drip_message  TEXT,
  redirect_url  VARCHAR(2083),
  created_at    DATETIME        NOT NULL,
  INDEX idx_post_id (post_id)
)
```

#### `includes/ContentGating/` — new module
```
Module.php                    ← registers all hooks
ContentRuleRepository.php     ← CRUD for purecart_content_rules
AccessEvaluator.php           ← checks user's active subscriptions against rules
DripeScheduleEvaluator.php    ← checks (subscription_start + drip_days) <= today
ContentGateTemplate.php       ← outputs the "upgrade" or "drip" message
```

`Module.php` hooks:
```php
add_filter( 'the_content', [ $this, 'maybe_gate_content' ] );
add_filter( 'template_redirect', [ $this, 'maybe_redirect_locked_page' ] );
add_action( 'add_meta_boxes', [ $this, 'add_content_rule_meta_box' ] );
add_action( 'save_post', [ $this, 'save_content_rule_meta_box' ] );
```

`AccessEvaluator::can_access( int $user_id, int $post_id ): bool`:
1. Load rules for `$post_id` from `ContentRuleRepository`.
2. If no rules → return `true`.
3. For each rule: check user has an active subscription whose `product_id` or plan matches `rule_value`.
4. If a matching subscription exists: check `DripeScheduleEvaluator` (days since subscription start ≥ drip_days).
5. Return `true` if any rule passes.

#### REST API (`includes/API/ContentGating.php`)
```
GET    /purecart/v1/content-rules          list, filterable by post_type
POST   /purecart/v1/content-rules          create
GET    /purecart/v1/content-rules/{id}     get
PUT    /purecart/v1/content-rules/{id}     update
DELETE /purecart/v1/content-rules/{id}     delete
GET    /purecart/v1/content-rules/post/{post_id}  get rules for a specific post
```

### Admin SPA — new module `src/app/modules/content-gating/`

#### Key components
```
ContentGatingPage.tsx          ← searchable list of all gated content
ContentRuleDrawer.tsx          ← slide-over panel to add/edit a rule
  PostSearchField.tsx          ← async search WP posts by title/type
  PlanSelectField.tsx          ← dropdown of available subscription products
  DripDaysField.tsx            ← number input, 0 = immediate
  DripMessageField.tsx         ← textarea for the "not unlocked yet" message
  RedirectUrlField.tsx         ← optional redirect for non-members
ContentGatingEmptyState.tsx
```

#### Routing
```ts
CONTENT_GATING: '/content-gating',
```
Nav section: separate top-level item "Content Gating" or under "Memberships".

---

## Feature 3 — Member Discount Engine

### What it is
Active subscribers get automatic % or fixed discounts on WooCommerce shop prices, based on their subscription plan. Works on top of (or overrides) WC sale prices and coupons.

### Backend

#### DB table — `purecart_member_discounts`
Add to `includes/Activator.php`:
```sql
CREATE TABLE {prefix}purecart_member_discounts (
  id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name            VARCHAR(191)    NOT NULL,
  product_id      BIGINT UNSIGNED,               -- NULL = applies to all products
  category_id     BIGINT UNSIGNED,               -- NULL = applies to all categories
  rule_type       ENUM('plan','product','role') NOT NULL DEFAULT 'plan',
  rule_value      VARCHAR(255)    NOT NULL,
  discount_type   ENUM('percent','fixed')       NOT NULL DEFAULT 'percent',
  discount_amount DECIMAL(10,2)   NOT NULL,
  stacks_with_sale TINYINT(1)     NOT NULL DEFAULT 1,
  priority        SMALLINT        NOT NULL DEFAULT 10,
  active          TINYINT(1)      NOT NULL DEFAULT 1,
  created_at      DATETIME        NOT NULL
)
```

#### `includes/MemberDiscount/` — new module
```
Module.php                    ← registers WC price hooks
MemberDiscountRepository.php  ← CRUD for purecart_member_discounts
DiscountEngine.php            ← evaluates applicable discounts for current user + product
```

`DiscountEngine::get_discount( int $user_id, int $product_id ): ?array`:
1. Load all active rules from `MemberDiscountRepository` ordered by `priority ASC`.
2. For each rule: check user has matching active subscription.
3. Optionally check `product_id` / `category_id` scope.
4. Return the first matching rule `{ type, amount }` (first-wins by priority) or `null`.

WC price hooks in `Module.php`:
```php
add_filter( 'woocommerce_product_get_price',
            [ $this, 'apply_member_price' ], 20, 2 );
add_filter( 'woocommerce_product_get_sale_price',
            [ $this, 'apply_member_price' ], 20, 2 );
add_filter( 'woocommerce_product_variation_get_price',
            [ $this, 'apply_member_price' ], 20, 2 );
```

`apply_member_price( $price, $product )`:
```php
$user_id  = get_current_user_id();
$discount = ( new DiscountEngine() )->get_discount( $user_id, $product->get_id() );
if ( ! $discount ) { return $price; }

return 'percent' === $discount['type']
    ? round( $price * ( 1 - $discount['amount'] / 100 ), 2 )
    : max( 0, $price - $discount['amount'] );
```

#### REST API (`includes/API/MemberDiscounts.php`)
```
GET    /purecart/v1/member-discounts
POST   /purecart/v1/member-discounts
PUT    /purecart/v1/member-discounts/{id}
DELETE /purecart/v1/member-discounts/{id}
```

### Admin SPA — new module `src/app/modules/member-discounts/`

#### Key components
```
MemberDiscountsPage.tsx         ← table of all discount rules (name / scope / type / amount / priority / active toggle)
MemberDiscountDrawer.tsx        ← slide-over to add/edit
  DiscountNameField.tsx
  RuleTypeField.tsx             ← plan / product / role
  RuleValueField.tsx            ← async search (plan picker / product picker / role select)
  ProductScopeField.tsx         ← optional product or category limiter
  DiscountTypeField.tsx         ← percent / fixed
  DiscountAmountField.tsx
  PriorityField.tsx
  StacksWithSaleToggle.tsx
MemberDiscountsEmptyState.tsx
```

---

## Feature 4 — Admin-Side Email Notifications

### What it is
The admin receives email notifications for key subscription events. PureCart has 17 customer emails but zero admin notification emails.

### Files to create (`includes/Subscriptions/Emails/`)

| Class | Trigger | Subject |
|---|---|---|
| `AdminNewSubscriptionEmail` | `purecart_subscription_created` | New subscription: {customer} — {product} |
| `AdminPaymentFailedEmail` | `purecart_subscription_payment_failed` | Payment failed: {customer} — ${amount} |
| `AdminSubscriptionCancelledEmail` | `purecart_subscription_cancelled` | Subscription cancelled: {customer} — {reason} |
| `AdminPendingCancelEmail` | `purecart_subscription_pending_cancel` | Pending cancellation: {customer} — {cancel_date} |

Each class extends `WC_Email`, sets `$this->recipient = get_option('admin_email')`, and uses a template in `templates/emails/admin-*.php`.

### Templates (`templates/emails/`)
```
admin-new-subscription.php
admin-payment-failed.php
admin-subscription-cancelled.php
admin-pending-cancel.php
```

Each template follows WC transactional email template conventions (`woocommerce_email_header`, `woocommerce_email_footer`, `woocommerce_email_styles`).

### Registration
In `includes/Subscriptions/Module.php` or `includes/Emails/Module.php`:
```php
add_filter( 'woocommerce_email_classes', function( array $emails ): array {
    $emails['PureCart_Admin_New_Subscription']  = new AdminNewSubscriptionEmail();
    $emails['PureCart_Admin_Payment_Failed']    = new AdminPaymentFailedEmail();
    $emails['PureCart_Admin_Cancelled']         = new AdminSubscriptionCancelledEmail();
    $emails['PureCart_Admin_Pending_Cancel']    = new AdminPendingCancelEmail();
    return $emails;
} );
```

Admin emails appear in WooCommerce → Settings → Emails, are toggleable, and support custom recipient override.

---

## Feature 5 — Subscription Notes

### What it is
Admin adds/reads internal notes on a subscription (like WC order notes). Notes are private to admins, never shown to customers.

### Backend

#### DB table — `purecart_subscription_notes`
Add to `includes/Activator.php`:
```sql
CREATE TABLE {prefix}purecart_subscription_notes (
  id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  subscription_id BIGINT UNSIGNED NOT NULL,
  author_id       BIGINT UNSIGNED NOT NULL DEFAULT 0,
  note            TEXT            NOT NULL,
  is_system       TINYINT(1)      NOT NULL DEFAULT 0,
  created_at      DATETIME        NOT NULL,
  INDEX idx_subscription_id (subscription_id)
)
```

#### `includes/Subscriptions/Notes/` — new sub-namespace
```
SubscriptionNotesRepository.php   ← find_by_subscription / insert / delete
```

#### REST endpoints (add to `includes/API/Subscriptions.php`)
```
GET    /purecart/v1/subscriptions/{id}/notes      list notes
POST   /purecart/v1/subscriptions/{id}/notes      add note
DELETE /purecart/v1/subscriptions/{id}/notes/{note_id}  delete note
```

### Admin SPA

Add a **Notes** tab to the subscription detail panel (`src/app/modules/subscriptions/detail-tabs/`):

**`NotesTab.tsx`**:
```tsx
// Textarea + "Add Note" button at top
// Chronological list of notes below:
// [ Avatar ] Author · Date
//   Note text
//   [Delete icon]
```

Add `NotesTab` to the tab array in `SubscriptionDetailPage.tsx`. Add `fetchNotes` / `addNote` / `deleteNote` to `src/app/modules/subscriptions/api.ts`.

---

## Feature 6 — Product Lifecycle Handler

### What it is
When a WooCommerce product linked to subscriptions is trashed or deleted, PureCart handles the attached subscriptions gracefully instead of leaving orphaned rows.

### Backend — `includes/Subscriptions/Product/ProductLifecycle.php`

```php
namespace PureCart\Subscriptions\Product;

class ProductLifecycle {

    public function register(): void {
        add_action( 'before_delete_post', [ $this, 'on_product_deleted' ] );
        add_action( 'wp_trash_post',      [ $this, 'on_product_trashed' ] );
        add_action( 'untrashed_post',     [ $this, 'on_product_restored' ] );
    }

    public function on_product_deleted( int $post_id ): void {
        if ( 'product' !== get_post_type( $post_id ) ) { return; }

        // Option: cancel, freeze, or migrate.
        $action = Settings::get( OptionKeys::SUBSCRIPTION_ON_PRODUCT_DELETE ); // 'cancel'|'pause'

        $subs = ( new SubscriptionRepository() )->find_active_by_product( $post_id );
        foreach ( $subs as $sub ) {
            if ( 'cancel' === $action ) {
                ( new SubscriptionManager() )->cancel( $sub->id, 'system', 'product_deleted' );
            } else {
                ( new SubscriptionManager() )->pause( $sub->id );
            }
            // Log it.
            ( new SubscriptionLogRepository() )->insert( [
                'subscription_id' => $sub->id,
                'event'           => 'product_deleted',
                'new_status'      => $sub->status,
                'actor_type'      => 'system',
                'actor_id'        => 0,
            ] );
        }
    }
}
```

Register in `includes/Subscriptions/Module.php`.

#### Settings
Add to `includes/Settings/OptionKeys.php`:
```php
const SUBSCRIPTION_ON_PRODUCT_DELETE = 'purecart_subscription_on_product_delete'; // 'cancel'|'pause'
```
Add radio field to Subscriptions settings tab: "When a subscription product is deleted: Cancel all subscriptions / Pause all subscriptions".

#### `SubscriptionRepository::find_active_by_product()`
New method — queries `purecart_subscriptions WHERE product_id = %d AND status IN ('active','trialing','past_due','paused')`.

---

## Feature 7 — Login As User (Admin Impersonation)

### What it is
An admin clicks "Login As" on a customer to temporarily act as that user — useful for debugging My Account views. A persistent frontend bar shows the active impersonation and a one-click "Return to Admin" button.

### Backend — `includes/Impersonation/`

```
Impersonation.php      ← REST handler + session management
FrontendBar.php        ← injects the impersonation bar via wp_footer
```

**`Impersonation.php`**:
```php
// Start impersonation
POST /purecart/v1/impersonate/{user_id}
// - permission: manage_woocommerce only
// - stores original admin ID in $_SESSION['purecart_impersonator_id'] (or transient keyed on session token)
// - calls wp_set_current_user($user_id) via wp_set_auth_cookie()
// - redirects to /my-account/

// End impersonation
POST /purecart/v1/impersonate/end
// - restores original admin session
// - redirects to /wp-admin/
```

**`FrontendBar.php`** (hooked on `wp_footer`):
```php
if ( isset( $_SESSION['purecart_impersonator_id'] ) ) {
    // Output a fixed-position bar: "Logged in as {display_name} — Return to Admin"
    // Return link POSTs to /purecart/v1/impersonate/end
}
```

### Admin SPA
In the subscription detail `OverviewTab.tsx` (or the customer section), add a **"Login As Customer"** button (admin-only, `manage_woocommerce`). On click: `POST /purecart/v1/impersonate/{user_id}` → browser follows redirect to `/my-account/`.

Also add to the Users section of WP Admin via a `user_row_actions` filter (PHP-only, no SPA needed).

---

## Feature 8 — Gutenberg Restricted Content Block

### What it is
A native Gutenberg block that wraps any content and shows it only to subscribers of a selected plan. Non-members see a configurable upgrade message instead.

### Files

#### `src/blocks/restricted-content/` (new Gutenberg block)
```
block.json
edit.tsx           ← editor UI: content area + plan picker in sidebar
save.tsx           ← save.tsx returns null (server-side render)
index.ts           ← registerBlockType
```

**`block.json`**:
```json
{
  "name": "purecart/restricted-content",
  "title": "Restricted Content",
  "category": "purecart",
  "icon": "lock",
  "supports": { "innerBlocks": true },
  "attributes": {
    "planId":        { "type": "string",  "default": "" },
    "dripDays":      { "type": "number",  "default": 0 },
    "upgradeMessage":{ "type": "string",  "default": "" },
    "redirectUrl":   { "type": "string",  "default": "" }
  }
}
```

**`edit.tsx`** — InspectorControls panel with:
- `PlanSelectControl` — async search subscription products
- `DripDaysControl` — number field
- `UpgradeMessageControl` — RichText for the fallback message
- Block body: `InnerBlocks` (the restricted content)

**PHP render callback** (`includes/Blocks/RestrictedContentBlock.php`):
```php
public function render( array $attrs, string $content ): string {
    $user_id = get_current_user_id();
    if ( ( new AccessEvaluator() )->can_access( $user_id, $attrs['planId'], $attrs['dripDays'] ) ) {
        return $content;
    }
    return $attrs['upgradeMessage']
        ? '<div class="purecart-restricted-message">' . wp_kses_post( $attrs['upgradeMessage'] ) . '</div>'
        : '';
}
```

Register in `includes/Blocks/Module.php`:
```php
register_block_type( PURECART_PATH . 'src/blocks/restricted-content/', [
    'render_callback' => [ new RestrictedContentBlock(), 'render' ],
] );
```

Add `blocks` entry to webpack/wp-scripts build in `package.json`.

---

## Feature 9 — Elementor Content Restriction

### What it is
Add a "PureCart Restriction" section to Elementor's section/container/widget advanced panel so editors can restrict any element by subscription plan without editing PHP.

### Backend — `includes/Elementor/ElementorIntegration.php`

```php
namespace PureCart\Elementor;

class ElementorIntegration {

    public function register(): void {
        add_action( 'elementor/element/section/section_advanced/after_section_end',
                    [ $this, 'add_restriction_controls' ], 10, 2 );
        add_action( 'elementor/element/container/section_layout/after_section_end',
                    [ $this, 'add_restriction_controls' ], 10, 2 );
        add_action( 'elementor/frontend/section/before_render',
                    [ $this, 'maybe_hide_element' ] );
        add_action( 'elementor/frontend/container/before_render',
                    [ $this, 'maybe_hide_element' ] );
    }

    public function add_restriction_controls( $element, $args ): void {
        $element->start_controls_section( 'purecart_restriction', [
            'label' => __( 'PureCart Restriction', 'purecart' ),
            'tab'   => \Elementor\Controls_Manager::TAB_ADVANCED,
        ] );

        $element->add_control( 'purecart_plan_id', [
            'label'       => __( 'Required Plan', 'purecart' ),
            'type'        => \Elementor\Controls_Manager::TEXT,
            'placeholder' => __( 'Product ID or leave empty', 'purecart' ),
        ] );

        $element->add_control( 'purecart_drip_days', [
            'label'   => __( 'Drip — unlock after (days)', 'purecart' ),
            'type'    => \Elementor\Controls_Manager::NUMBER,
            'default' => 0,
            'min'     => 0,
        ] );

        $element->end_controls_section();
    }

    public function maybe_hide_element( $element ): void {
        $plan_id = $element->get_settings( 'purecart_plan_id' );
        if ( ! $plan_id ) { return; }

        $drip    = (int) $element->get_settings( 'purecart_drip_days' );
        $user_id = get_current_user_id();

        if ( ! ( new AccessEvaluator() )->can_access( $user_id, $plan_id, $drip ) ) {
            $element->add_render_attribute( '_wrapper', 'style', 'display:none!important' );
        }
    }
}
```

Register in `includes/Subscriptions/Module.php` only if `did_action('elementor/loaded')`.

---

## Feature 10 — Settings Import / Export

### What it is
Export all PureCart settings to a JSON file. Import them on another site (e.g., staging → production migration).

### Backend — `includes/Settings/EasySetup.php`

```php
namespace PureCart\Settings;

class EasySetup {

    /** Returns all PureCart option values as an array. */
    public function export(): array {
        $all_keys = ( new \ReflectionClass( OptionKeys::class ) )->getConstants();
        $data     = [];
        foreach ( $all_keys as $key ) {
            $data[ $key ] = get_option( $key );
        }
        return $data;
    }

    /** Overwrites PureCart options from an imported array. */
    public function import( array $data ): int {
        $all_keys = array_values( ( new \ReflectionClass( OptionKeys::class ) )->getConstants() );
        $count    = 0;
        foreach ( $data as $key => $value ) {
            if ( in_array( $key, $all_keys, true ) ) {
                update_option( $key, $value );
                $count++;
            }
        }
        return $count;
    }
}
```

#### REST endpoints (`includes/API/Settings.php` — new or extend existing)
```
GET  /purecart/v1/settings/export  → JSON download (Content-Disposition: attachment)
POST /purecart/v1/settings/import  → multipart/form-data with JSON file, returns { imported: N }
```

Permission: `manage_options` only.

### Admin SPA — Settings page addition

In the existing Settings page (or a new "Tools" tab):
```tsx
<ExportSettingsCard>
  <p>Download all PureCart settings as a JSON file.</p>
  <FilledButton onClick={handleExport}>Export Settings</FilledButton>
</ExportSettingsCard>

<ImportSettingsCard>
  <p>Import settings from a previously exported JSON file.</p>
  <input type="file" accept=".json" onChange={handleFileSelect} />
  <FilledButton onClick={handleImport} disabled={!file}>Import</FilledButton>
</ImportSettingsCard>
```

---

## Feature 11 — Renewal Invoice Email

### What it is
A dedicated invoice-style email sent to the customer after every successful renewal charge, separate from the generic "renewal successful" notification. Includes itemised billing amount, billing period, next payment date, and a link to the customer's My Account.

### Files

#### `includes/Subscriptions/Emails/RenewalInvoiceEmail.php`
Extends `WC_Email`. Triggers on the existing `purecart_subscription_renewed` action (or `purecart_subscription_payment_completed`).

Key properties:
```php
$this->id             = 'purecart_renewal_invoice';
$this->title          = __( 'Renewal Invoice', 'purecart' );
$this->description    = __( 'Sent to the customer after each successful renewal charge.', 'purecart' );
$this->template_html  = 'emails/renewal-invoice.php';
$this->template_plain = 'emails/plain/renewal-invoice.php';
```

#### `templates/emails/renewal-invoice.php`
Sections:
1. WC email header
2. "Thank you — your subscription has been renewed." greeting
3. Invoice table: Product / Period / Amount / Tax / Total
4. Next payment date
5. Link to My Account → My Subscriptions
6. WC email footer

#### `templates/emails/plain/renewal-invoice.php`
Plain-text version of the same content.

Register in the `woocommerce_email_classes` filter alongside the admin emails (Feature 4).

---

## Implementation Order

| Step | Feature | Builds on |
|---|---|---|
| 1 | Retention Analytics Dashboard | Existing REST endpoints — mostly frontend work |
| 2 | Subscription Notes | Small backend + one new detail tab |
| 3 | Admin-Side Emails | Email classes only, no SPA |
| 4 | Renewal Invoice Email | Email class only, no SPA |
| 5 | Product Lifecycle Handler | PHP only, settings addition |
| 6 | Member Discount Engine | New PHP module + new SPA module |
| 7 | Content Gating with Drip | New PHP module + new SPA module |
| 8 | Gutenberg Block | New block + shared `AccessEvaluator` from Content Gating |
| 9 | Elementor Integration | Reuses `AccessEvaluator` from Content Gating |
| 10 | Login As User | PHP + one SPA button |
| 11 | Settings Import / Export | PHP + small SPA addition |

---

## Files Touched Summary

### New PHP modules
```
includes/ContentGating/Module.php
includes/ContentGating/ContentRuleRepository.php
includes/ContentGating/AccessEvaluator.php
includes/ContentGating/DripScheduleEvaluator.php
includes/ContentGating/ContentGateTemplate.php
includes/MemberDiscount/Module.php
includes/MemberDiscount/MemberDiscountRepository.php
includes/MemberDiscount/DiscountEngine.php
includes/Subscriptions/Notes/SubscriptionNotesRepository.php
includes/Subscriptions/Product/ProductLifecycle.php
includes/Subscriptions/Reports/RetentionReportRepository.php
includes/Impersonation/Impersonation.php
includes/Impersonation/FrontendBar.php
includes/Elementor/ElementorIntegration.php
includes/Blocks/RestrictedContentBlock.php
includes/Blocks/Module.php
includes/Settings/EasySetup.php
```

### New PHP REST controllers
```
includes/API/ContentGating.php
includes/API/MemberDiscounts.php
includes/API/Settings.php        (or extend existing)
```

### Modified PHP
```
includes/Activator.php           (3 new tables: content_rules, member_discounts, subscription_notes)
includes/Settings/OptionKeys.php (SUBSCRIPTION_ON_PRODUCT_DELETE)
includes/Subscriptions/Module.php (register Lifecycle, Elementor, Admin emails)
includes/API/Subscriptions.php   (retention report endpoint, notes endpoints)
```

### New email templates
```
templates/emails/admin-new-subscription.php
templates/emails/admin-payment-failed.php
templates/emails/admin-subscription-cancelled.php
templates/emails/admin-pending-cancel.php
templates/emails/renewal-invoice.php
templates/emails/plain/renewal-invoice.php
```

### New Admin SPA modules
```
src/app/modules/retention-analytics/
src/app/modules/content-gating/
src/app/modules/member-discounts/
```

### Modified Admin SPA
```
src/app/router/paths.ts               (3 new paths)
src/app/router/AppRoutes.tsx           (3 new routes)
src/app/shared/layout/nav-schema.ts    (3 new nav entries)
src/app/store/store.ts                 (2 new slices)
src/app/modules/subscriptions/detail-tabs/NotesTab.tsx  (new)
src/app/modules/subscriptions/api.ts   (notes + retention endpoints)
```

### New Gutenberg block
```
src/blocks/restricted-content/block.json
src/blocks/restricted-content/edit.tsx
src/blocks/restricted-content/save.tsx
src/blocks/restricted-content/index.ts
```

---

## Done Criteria

After each feature:
```bash
composer cs
npx tsc --noEmit
npm run lint:js
npm run lint:css
npm run build
```

Manual smoke test:
- **Retention Analytics:** WP Admin → PureCart → Retention — KPI cards, charts, logs table render
- **Content Gating:** Create a rule on a post; log in as non-subscriber → see upgrade message; log in as demo_alice → see content
- **Member Discount:** Add 20% rule for demo_alice's plan; visit shop as demo_alice → prices show 20% discount
- **Admin Emails:** Trigger a test subscription event → admin inbox receives notification
- **Notes:** Open subscription detail → Notes tab → add note → note appears → delete note
- **Product Lifecycle:** Trash a subscription product → active subscriptions auto-cancelled or paused per setting
- **Login As User:** Admin clicks "Login As" on demo_alice → lands on My Account as Alice → bar visible → Return to Admin
- **Gutenberg Block:** Insert block, set plan, view as non-subscriber → gated; view as demo_alice → content visible
- **Settings Export/Import:** Export JSON → delete an option → import → option restored
