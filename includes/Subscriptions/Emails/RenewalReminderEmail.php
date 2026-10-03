<?php
declare( strict_types=1 );
/**
 * WooCommerce email reminding the customer of an upcoming subscription renewal.
 *
 * @package PureCart\Subscriptions\Emails
 * @since   1.0.0
 */

namespace PureCart\Subscriptions\Emails;

defined( 'ABSPATH' ) || exit;

/**
 * Fired by `SubscriptionEmail::send_reminders()`, which scans for subscriptions
 * approaching their next payment date per the `purecart_sub_renewal_reminder_days`
 * setting (e.g., [7, 3, 1] days before due).
 *
 * @since 1.0.0
 */
class RenewalReminderEmail extends AbstractSubscriptionEmail {

	/**
	 * Initializes the email ID, title, and description.
	 *
	 * @since 1.0.0
	 * @return void
	 */
	public function __construct() {
		$this->id          = 'purecart_renewal_reminder';
		$this->title       = __( 'Renewal Reminder', 'purecart' );
		$this->description = __( 'Sent a few days before an upcoming renewal charge.', 'purecart' );

		parent::__construct();
	}

	/**
	 * Returns the action hooks that fire this email.
	 *
	 * @since 1.0.0
	 * @return string[]
	 */
	protected function trigger_hooks(): array {
		return array( 'purecart_renewal_reminder_due' );
	}

	/**
	 * Returns the default email subject line.
	 *
	 * @since 1.0.0
	 * @return string
	 */
	public function get_default_subject() {
		return __( 'Upcoming renewal for {product_name}', 'purecart' );
	}

	/**
	 * Returns the default email heading.
	 *
	 * @since 1.0.0
	 * @return string
	 */
	public function get_default_heading() {
		return __( 'Your subscription renews soon', 'purecart' );
	}

	/**
	 * Returns the email body message.
	 *
	 * @since 1.0.0
	 * @return string
	 */
	protected function get_body_message(): string {
		return __( 'Hi {first_name}, this is a reminder that {amount} will be charged for your {product_name} subscription on {next_payment_date}.', 'purecart' );
	}
}
