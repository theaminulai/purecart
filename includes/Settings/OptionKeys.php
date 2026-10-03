<?php
declare( strict_types=1 );
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

namespace PureCart\Settings;

defined( 'ABSPATH' ) || exit;

/**
 * Option key constants.
 *
 * @since 1.0.0
 */
class OptionKeys {

	// Licensing module

	/**
	 * When to deliver license keys — on 'processing', 'completed', or 'both'.
	 *
	 * @since 1.0.0
	 * @var string
	 */
	public const LICENSE_DELIVERY_STATUS = 'purecart_license_delivery_status';

	/**
	 * HS256 signing secret for licensing JWTs.
	 *
	 * @since 1.0.0
	 * @var string
	 */
	public const LICENSE_JWT_SECRET = 'purecart_jwt_secret_key';

	// Downloads module

	/**
	 * How many seconds a signed download link remains valid.
	 *
	 * @since 1.0.0
	 * @var int
	 */
	public const DOWNLOAD_EXPIRY_SECONDS = 'purecart_download_expiry_seconds';

	/**
	 * Maximum number of times a download link may be used.
	 *
	 * @since 1.0.0
	 * @var int
	 */
	public const DOWNLOAD_MAX_COUNT = 'purecart_download_max_count';

	// SaaS Provisioning module

	/**
	 * URL to POST provisioning webhook events to.
	 *
	 * @since 1.0.0
	 * @var string
	 */
	public const SAAS_WEBHOOK_URL = 'purecart_saas_webhook_url';

	/**
	 * HMAC secret used to sign outgoing SaaS webhooks.
	 *
	 * @since 1.0.0
	 * @var string
	 */
	public const SAAS_WEBHOOK_SECRET = 'purecart_saas_webhook_secret';

	/**
	 * HS256 signing secret for SaaS login JWTs.
	 *
	 * @since 1.0.0
	 * @var string
	 */
	public const SAAS_JWT_SECRET = 'purecart_saas_jwt_secret';

	/**
	 * Lifetime in seconds for SaaS access tokens.
	 *
	 * @since 1.0.0
	 * @var int
	 */
	public const SAAS_JWT_EXPIRY_SECONDS = 'purecart_saas_jwt_expiry_seconds';

	/**
	 * Lifetime in seconds for SaaS refresh tokens.
	 *
	 * @since 1.0.0
	 * @var int
	 */
	public const SAAS_JWT_REFRESH_SECONDS = 'purecart_saas_jwt_refresh_seconds';

	// Subscriptions — General

	/**
	 * Whether the subscriptions module is enabled.
	 *
	 * @since 1.0.0
	 * @var bool
	 */
	public const SUB_ENABLED = 'purecart_sub_enabled';

	/**
	 * Whether each customer may use a free trial only once.
	 *
	 * @since 1.0.0
	 * @var bool
	 */
	public const SUB_ONE_TRIAL_PER_CUSTOMER = 'purecart_sub_one_trial_per_customer';

	/**
	 * Whether a customer may hold more than one active subscription at a time.
	 *
	 * @since 1.0.0
	 * @var bool
	 */
	public const SUB_ALLOW_MULTIPLE_SUBSCRIPTIONS = 'purecart_sub_allow_multiple_subscriptions';

	/**
	 * Maximum number of billing cycles a customer may skip.
	 *
	 * @since 1.0.0
	 * @var int
	 */
	public const SUB_SKIP_LIMIT = 'purecart_sub_skip_limit';

	/**
	 * Days after cancellation during which a customer may re-subscribe.
	 *
	 * @since 1.0.0
	 * @var int
	 */
	public const SUB_RESUBSCRIBE_WINDOW_DAYS = 'purecart_sub_resubscribe_window_days';

	/**
	 * How plan-change prorations are calculated ('full', 'partial', or 'none').
	 *
	 * @since 1.0.0
	 * @var string
	 */
	public const SUB_PRORATION_MODE = 'purecart_sub_proration_mode';

	/**
	 * Expected average subscription lifetime in months, used for LTV estimates.
	 *
	 * @since 1.0.0
	 * @var int
	 */
	public const SUB_AVG_LIFETIME_MONTHS = 'purecart_sub_avg_lifetime_months';

	/**
	 * Whether cancelling a subscription also suspends its linked SaaS account immediately.
	 *
	 * @since 1.0.0
	 * @var bool
	 */
	public const SUB_CANCEL_SAAS_IMMEDIATELY = 'purecart_sub_cancel_saas_immediately';

	// Subscriptions — Roles

	/**
	 * WordPress role assigned to customers on a trial subscription.
	 *
	 * @since 1.0.0
	 * @var string
	 */
	public const SUB_TRIAL_ROLE = 'purecart_sub_trial_role';

	/**
	 * WordPress role assigned to active subscribers.
	 *
	 * @since 1.0.0
	 * @var string
	 */
	public const SUB_ACTIVE_ROLE = 'purecart_sub_active_role';

	/**
	 * WordPress role assigned to cancelled subscribers.
	 *
	 * @since 1.0.0
	 * @var string
	 */
	public const SUB_CANCELLED_ROLE = 'purecart_sub_cancelled_role';

	// Subscriptions — Billing & Dunning

	/**
	 * Comma-separated day offsets for dunning retry attempts after a failed payment.
	 *
	 * @since 1.0.0
	 * @var string
	 */
	public const SUB_RETRY_INTERVALS = 'purecart_sub_retry_intervals';

	/**
	 * Maximum number of automatic payment retry attempts.
	 *
	 * @since 1.0.0
	 * @var int
	 */
	public const SUB_RETRY_ATTEMPTS = 'purecart_sub_retry_attempts';

	/**
	 * Days a subscription stays active after a failed payment before being suspended.
	 *
	 * @since 1.0.0
	 * @var int
	 */
	public const SUB_ACTIVE_GRACE_DAYS = 'purecart_sub_active_grace_days';

	/**
	 * Days a suspended subscription can remain before being cancelled.
	 *
	 * @since 1.0.0
	 * @var int
	 */
	public const SUB_SUSPENDED_GRACE_DAYS = 'purecart_sub_suspended_grace_days';

	/**
	 * Whether renewal dates are synchronized to a fixed calendar date.
	 *
	 * @since 1.0.0
	 * @var bool
	 */
	public const SUB_RENEWAL_SYNC = 'purecart_sub_renewal_sync';

	/**
	 * The fixed calendar date renewals are synchronized to when sync is enabled.
	 *
	 * @since 1.0.0
	 * @var string
	 */
	public const SUB_RENEWAL_SYNC_DATE = 'purecart_sub_renewal_sync_date';

	// Subscriptions — Retention

	/**
	 * Discount percentage offered in the cancellation retention flow.
	 *
	 * @since 1.0.0
	 * @var int
	 */
	public const SUB_RETENTION_DISCOUNT_PERCENT = 'purecart_sub_retention_discount_percent';

	/**
	 * Number of billing cycles the retention discount applies.
	 *
	 * @since 1.0.0
	 * @var int
	 */
	public const SUB_RETENTION_DISCOUNT_CYCLES = 'purecart_sub_retention_discount_cycles';

	/**
	 * Number of days a subscription can be paused via the retention flow.
	 *
	 * @since 1.0.0
	 * @var int
	 */
	public const SUB_RETENTION_PAUSE_DAYS = 'purecart_sub_retention_pause_days';

	/**
	 * URL to the store's support contact page, shown in the retention flow.
	 *
	 * @since 1.0.0
	 * @var string
	 */
	public const SUB_RETENTION_CONTACT_URL = 'purecart_sub_retention_contact_url';

	// Subscriptions — Notifications

	/**
	 * Days before renewal to send the upcoming-renewal reminder email.
	 *
	 * @since 1.0.0
	 * @var int
	 */
	public const SUB_RENEWAL_REMINDER_DAYS = 'purecart_sub_renewal_reminder_days';

	/**
	 * Days before trial end to send the trial-ending reminder email.
	 *
	 * @since 1.0.0
	 * @var int
	 */
	public const SUB_TRIAL_REMINDER_DAYS = 'purecart_sub_trial_reminder_days';

	/**
	 * Days before card expiry to send the payment-method warning email.
	 *
	 * @since 1.0.0
	 * @var int
	 */
	public const SUB_CARD_EXPIRY_WARNING_DAYS = 'purecart_sub_card_expiry_warning_days';

	// Subscriptions — Webhooks

	/**
	 * HMAC secret used to sign outgoing subscription webhook events.
	 *
	 * @since 1.0.0
	 * @var string
	 */
	public const SUB_WEBHOOK_SECRET = 'purecart_webhook_secret';
}
