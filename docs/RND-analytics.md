# RND — Analytics & Reporting Module
**Plugin:** purecart
**Module:** Analytics & Reporting
**Phase:** 6
**Standalone:** Yes — reads PureCart tables and WooCommerce orders independently; richer when Licensing and Downloads modules are active

---

## Overview

The Analytics module provides a revenue and product health dashboard inside the WordPress admin. It surfaces metrics that WooCommerce's built-in reports don't cover for software/SaaS businesses: MRR, ARR, churn, active license counts, download activity, and version adoption.

All data is read from PureCart's own tables and WooCommerce orders. No external analytics service required.

---

## Standalone Usage

Enable the Analytics module in **Settings → Digital Downloads → Modules**.

**Works without other PureCart modules:** The module can report on WooCommerce order revenue alone if no other PureCart modules are active.

**Richer with other modules:**
- + Licensing module → license health, activation trends, churn
- + Downloads module → download counts, version adoption, geo distribution
- + Subscriptions module → MRR, ARR, renewal rate, dunning outcomes
- + SaaS module → active SaaS accounts, API key usage

---

## Dashboard Metrics

### Revenue Metrics (Subscriptions module required for MRR/ARR)

| Metric | Formula | Description |
|---|---|---|
| MRR | Sum of monthly subscription values | Monthly Recurring Revenue |
| ARR | MRR × 12 | Annual Run Rate |
| New MRR | MRR added this month | New subscriptions + upgrades |
| Churned MRR | MRR lost this month | Cancelled + expired |
| Net MRR Growth | New MRR − Churned MRR | Net change |
| Churn Rate | Cancelled / Active at start of period | Monthly percentage |
| LTV | ARPU / Churn Rate | Estimated customer lifetime value |

### License Metrics (Licensing module required)

| Metric | Description |
|---|---|
| Total active licenses | Count of `status = active` in `wp_purecart_licenses` |
| Total expired licenses | Count of `status = expired` |
| Licenses expiring in 30 days | Renewal opportunity report |
| Activation rate | Avg. activations per license |
| Licenses with multi-site (>1 site used) | Upsell indicator |
| Suspended / revoked | Anti-piracy enforcement count |

### Download Metrics (Downloads module required)

| Metric | Description |
|---|---|
| Total downloads this month | Sum of `purecart_download_logs` entries |
| Downloads by product | Per-product breakdown |
| Downloads by version | Version adoption heatmap |
| Top countries | Geographic distribution |
| Peak download hours | Time-of-day histogram |
| Failed token attempts | Security indicator |

### Product & Version Metrics (Plugin Updates module required)

| Metric | Description |
|---|---|
| Version adoption | % of licenses on latest vs. older versions |
| Update lag | Average days between release and customer update |
| Release frequency | Versions shipped per month |

---

## Admin Dashboard Layout

```
PureCart → Analytics

[Date range picker: 30 days | 90 days | 12 months | Custom]

┌─────────┬─────────┬─────────┬─────────┐
│   MRR   │   ARR   │  Churn  │  LTV    │
│ $12,400 │$148,800 │  2.1%   │ $476    │
└─────────┴─────────┴─────────┴─────────┘

[MRR trend chart — 12 months line graph]

┌─────────────────────┬─────────────────────┐
│  Active Licenses    │  Downloads (30d)    │
│  1,847              │  6,234              │
│  ▲ +124 this month  │  ▼ -3% vs prior mo  │
└─────────────────────┴─────────────────────┘

[Licenses by product — bar chart]
[Downloads by version — stacked bar]
[Top 10 countries — simple table]

[Export CSV button]
```

---

## Key Classes

### `RevenueReport`

```php
namespace PureCart\Analytics;

class RevenueReport {

    public function get_mrr( string $as_of_date = '' ): float {
        // Sum active subscription monthly values
        // Normalize yearly plans to monthly (yearly / 12)
    }

    public function get_arr(): float {
        return $this->get_mrr() * 12;
    }

    public function get_churn_rate( string $period_start, string $period_end ): float {
        // (Cancelled in period) / (Active at start of period)
    }

    public function get_new_mrr( string $period_start, string $period_end ): float {
        // Sum MRR from subscriptions created in period
    }

    public function get_mrr_trend( int $months = 12 ): array {
        // Array of [month => mrr_value] for chart rendering
    }
}
```

### `LicenseReport`

```php
namespace PureCart\Analytics;

class LicenseReport {

    public function get_active_count(): int { }

    public function get_expiring_soon( int $days = 30 ): array {
        // Licenses expiring within $days with customer contact info
    }

    public function get_activation_rate(): float {
        // Avg activations / license across active licenses
    }

    public function get_version_adoption(): array {
        // Group licenses by currently installed version
        // Requires update-check ping data
    }
}
```

### `DownloadReport`

```php
namespace PureCart\Analytics;

class DownloadReport {

    public function get_total_downloads( string $period_start, string $period_end ): int { }

    public function get_downloads_by_product(): array { }

    public function get_downloads_by_country(): array { }

    public function get_version_adoption(): array { }

    public function export_csv( array $filters = [] ): string {
        // Returns CSV string for download
    }
}
```

---

## CSV Export Format

**Revenue Export:**
```
Date,MRR,ARR,New Subscriptions,Cancellations,Churn Rate
2026-01-01,12100,145200,23,5,1.8%
2026-02-01,12400,148800,18,3,2.1%
```

**License Export:**
```
License Key,Product,User Email,Status,Sites Used,Site Limit,Expires At,Created At
XXXXXXXX-XXXXXXXX-...,My Plugin,user@example.com,active,1,3,2027-06-24,2026-06-24
```

**Download Export:**
```
Date,Product,Version,IP Address,Country,User Agent
2026-06-24,My Plugin,2.1.0,198.51.100.10,US,WordPress/6.5
```

---

## Data Sources

| Report | Primary Table | Joins |
|---|---|---|
| Revenue / MRR | `wp_purecart_subscriptions` | `posts` (orders) |
| Churn | `wp_purecart_subscriptions` | — |
| License counts | `wp_purecart_licenses` | `wc_orders` |
| Activation trends | `wp_purecart_license_activations` | `wp_purecart_licenses` |
| Download totals | `wp_purecart_download_logs` | `wp_purecart_downloads` |
| Version adoption | `wp_purecart_product_versions` | `wp_purecart_download_logs` |

All queries use `$wpdb->prepare()`. Heavy aggregations are cached in WP transients with a 1-hour TTL (`purecart_analytics_{report}_{hash}`).

---

## Caching Strategy

```php
// Cache key includes date range hash to bust on range change
$cache_key = 'purecart_mrr_' . md5( $period_start . $period_end );
$cached = get_transient( $cache_key );
if ( $cached !== false ) return $cached;

$result = $this->compute_mrr( $period_start, $period_end );
set_transient( $cache_key, $result, HOUR_IN_SECONDS );
return $result;
```

Admin can force-clear analytics cache via **Settings → Digital Downloads → Analytics → Clear Cache**.

---

## Admin Settings

**Settings → Digital Downloads → Analytics**

| Setting | Default | Description |
|---|---|---|
| Enable analytics | Off | Master toggle |
| Cache TTL (minutes) | 60 | How long aggregated data is cached |
| Default date range | 30 days | Default view on dashboard load |
| Show revenue data | On | Show MRR/ARR panels (hide if subscriptions not used) |
| Show license data | On | Show license panels |
| Show download data | On | Show download panels |
| CSV export: include PII | Off | Whether IP addresses appear in exports |

---

## Phase 6 Implementation Plan

1. `RevenueReport`, `LicenseReport`, `DownloadReport` in `includes/Analytics/`
2. Admin dashboard page: **PureCart → Analytics**
3. React-based charts (using WordPress Scripts + Chart.js or Recharts)
4. WP REST API endpoint for chart data: `/purecart/v1/analytics/{report}`
5. CSV export endpoint: `/purecart/v1/analytics/{report}/export`
6. Transient-based caching layer
7. Date range picker (30d / 90d / 12m / custom)
8. "Licenses Expiring Soon" actionable report with bulk email option

---

## Competitor Comparison

| Feature | WooCommerce Analytics | EDD Reports | SureCart Analytics | purecart |
|---|---|---|---|---|
| MRR / ARR | ❌ | ❌ | ✅ (SaaS-side) | **✅ From PureCart subscription table** |
| Churn rate | ❌ | ❌ | ✅ (SaaS-side) | **✅ Cancellations / active at period start** |
| Active license count | ❌ | ✅ (EDD only) | ❌ | **✅ Real-time from wp_purecart_licenses** |
| License expiry forecast | ❌ | ❌ | ❌ | **✅ Expiring in 30/60/90 days** |
| Download stats by product | ❌ | ✅ | ❌ | **✅ Per product, per version** |
| Version adoption heatmap | ❌ | ❌ | ❌ | **✅ % of customers on each version** |
| Geo distribution of downloads | ❌ | ❌ | ❌ | **✅ Country breakdown** |
| CSV export | ✅ (orders only) | ✅ | Partial | **✅ Revenue, licenses, downloads** |
| WooCommerce native | ✅ | ❌ | ❌ | **✅** |
| Self-hosted (no SaaS backend) | ✅ | ✅ | ❌ | **✅** |
| Transient-cached queries | ❌ | Partial | ❌ | **✅ 1-hour TTL, admin-clearable** |

---

## Future Extensions (Post-Phase 6)

- **Cohort analysis:** Revenue retention by signup month
- **A/B test tracking:** Conversion rate by pricing experiment
- **Dunning outcome report:** Which dunning email recovered the most failed payments
- **Affiliate performance:** Revenue per affiliate (when Affiliates module active)
- **WP-CLI commands:** `wp purecart analytics mrr`, `wp purecart analytics export`

---

## References

- WooCommerce Analytics (core): https://woocommerce.com/document/woocommerce-analytics/
- Action Scheduler: https://actionscheduler.org
- WordPress Scripts (React build tools): https://developer.wordpress.org/block-editor/reference-guides/packages/packages-scripts/
- Chart.js: https://www.chartjs.org
