<?php
/**
 * Central registry of every WP option key the plugin reads or writes.
 *
 * All option keys are defined here as class constants. No module may call
 * get_option() or update_option() with a raw string — use Settings::get()
 * and Settings::set() with a constant from this class instead. This ensures
 * every key is discoverable, refactorable, and impossible to mistype silently.
 *
 * @package PureCart\Settings
 */

declare( strict_types=1 );

namespace PureCart\Settings;

defined( 'ABSPATH' ) || exit;

/**
 * Option key constants.
 *
 * @since 1.0.0
 */
class OptionKeys {

	// Licensing module

	public const LICENSE_DELIVERY_STATUS = 'purecart_license_delivery_status';
	public const LICENSE_JWT_SECRET      = 'purecart_jwt_secret_key';

	// Downloads module

	public const DOWNLOAD_EXPIRY_SECONDS = 'purecart_download_expiry_seconds';
	public const DOWNLOAD_MAX_COUNT      = 'purecart_download_max_count';

	// SaaS Provisioning module

	public const SAAS_WEBHOOK_URL        = 'purecart_saas_webhook_url';
	public const SAAS_WEBHOOK_SECRET     = 'purecart_saas_webhook_secret';
	public const SAAS_JWT_SECRET         = 'purecart_saas_jwt_secret';
	public const SAAS_JWT_EXPIRY_SECONDS = 'purecart_saas_jwt_expiry_seconds';
	public const SAAS_JWT_REFRESH_SECONDS = 'purecart_saas_jwt_refresh_seconds';

	// Subscriptions — General

	public const SUB_ENABLED                  = 'purecart_sub_enabled';
	public const SUB_ONE_TRIAL_PER_CUSTOMER   = 'purecart_sub_one_trial_per_customer';
	public const SUB_ALLOW_MULTIPLE_SUBSCRIPTIONS = 'purecart_sub_allow_multiple_subscriptions';
	public const SUB_SKIP_LIMIT               = 'purecart_sub_skip_limit';
	public const SUB_RESUBSCRIBE_WINDOW_DAYS  = 'purecart_sub_resubscribe_window_days';
	public const SUB_PRORATION_MODE           = 'purecart_sub_proration_mode';
	public const SUB_AVG_LIFETIME_MONTHS      = 'purecart_sub_avg_lifetime_months';
	public const SUB_CANCEL_SAAS_IMMEDIATELY  = 'purecart_sub_cancel_saas_immediately';

	// Subscriptions — Roles

	public const SUB_TRIAL_ROLE     = 'purecart_sub_trial_role';
	public const SUB_ACTIVE_ROLE    = 'purecart_sub_active_role';
	public const SUB_CANCELLED_ROLE = 'purecart_sub_cancelled_role';

	// Subscriptions — Billing & Dunning

	public const SUB_RETRY_INTERVALS      = 'purecart_sub_retry_intervals';
	public const SUB_RETRY_ATTEMPTS       = 'purecart_sub_retry_attempts';
	public const SUB_ACTIVE_GRACE_DAYS    = 'purecart_sub_active_grace_days';
	public const SUB_SUSPENDED_GRACE_DAYS = 'purecart_sub_suspended_grace_days';
	public const SUB_RENEWAL_SYNC         = 'purecart_sub_renewal_sync';
	public const SUB_RENEWAL_SYNC_DATE    = 'purecart_sub_renewal_sync_date';

	// Subscriptions — Retention

	public const SUB_RETENTION_DISCOUNT_PERCENT = 'purecart_sub_retention_discount_percent';
	public const SUB_RETENTION_DISCOUNT_CYCLES  = 'purecart_sub_retention_discount_cycles';
	public const SUB_RETENTION_PAUSE_DAYS       = 'purecart_sub_retention_pause_days';
	public const SUB_RETENTION_CONTACT_URL      = 'purecart_sub_retention_contact_url';

	// Subscriptions — Notifications

	public const SUB_RENEWAL_REMINDER_DAYS  = 'purecart_sub_renewal_reminder_days';
	public const SUB_TRIAL_REMINDER_DAYS    = 'purecart_sub_trial_reminder_days';
	public const SUB_CARD_EXPIRY_WARNING_DAYS = 'purecart_sub_card_expiry_warning_days';

	// Subscriptions — Webhooks

	public const SUB_WEBHOOK_SECRET = 'purecart_webhook_secret';
}
