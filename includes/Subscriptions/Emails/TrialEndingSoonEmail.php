<?php
declare( strict_types=1 );
/**
 * WooCommerce email notifying the customer that their trial period is ending soon.
 *
 * @package PureCart\Subscriptions\Emails
 * @since   1.0.0
 */

namespace PureCart\Subscriptions\Emails;

defined( 'ABSPATH' ) || exit;

/**
 * Fired by `SubscriptionEmail::send_reminders()`, which scans for trial
 * subscriptions approaching their end date. No lifecycle-transition hook
 * exists for a future-date threshold, so a scan is necessary.
 *
 * @since 1.0.0
 */
class TrialEndingSoonEmail extends AbstractSubscriptionEmail {

	/**
	 * Initializes the email ID, title, and description.
	 *
	 * @since 1.0.0
	 * @return void
	 */
	public function __construct() {
		$this->id          = 'purecart_trial_ending_soon';
		$this->title       = __( 'Trial Ending Soon', 'purecart' );
		$this->description = __( 'Sent a few days before a free trial ends.', 'purecart' );

		parent::__construct();
	}

	/**
	 * Returns the action hooks that fire this email.
	 *
	 * @since 1.0.0
	 * @return string[]
	 */
	protected function trigger_hooks(): array {
		return array( 'purecart_trial_ending_soon' );
	}

	/**
	 * Returns the default email subject line.
	 *
	 * @since 1.0.0
	 * @return string
	 */
	public function get_default_subject() {
		return __( 'Your {product_name} trial ends soon', 'purecart' );
	}

	/**
	 * Returns the default email heading.
	 *
	 * @since 1.0.0
	 * @return string
	 */
	public function get_default_heading() {
		return __( 'Your trial is ending soon', 'purecart' );
	}

	/**
	 * Returns the email body message.
	 *
	 * @since 1.0.0
	 * @return string
	 */
	protected function get_body_message(): string {
		return __( 'Hi {first_name}, your free trial of {product_name} ends on {trial_end_date}. After that, {amount} will be billed automatically to keep your access uninterrupted.', 'purecart' );
	}
}
