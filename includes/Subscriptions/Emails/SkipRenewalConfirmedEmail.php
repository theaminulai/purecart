<?php
/**
 * WooCommerce email confirming that the customer's next renewal cycle has been skipped.
 *
 * @package PureCart\Subscriptions\Emails
 * @since   1.0.0
 */

declare( strict_types=1 );

namespace PureCart\Subscriptions\Emails;

defined( 'ABSPATH' ) || exit;

/**
 * Confirms to the customer that their next billing cycle has been skipped.
 *
 * @since 1.0.0
 */
class SkipRenewalConfirmedEmail extends AbstractSubscriptionEmail {

	/**
	 * Initializes the email ID, title, and description.
	 *
	 * @since 1.0.0
	 * @return void
	 */
	public function __construct() {
		$this->id          = 'purecart_skip_renewal_confirmed';
		$this->title       = __( 'Skip Renewal Confirmed', 'purecart' );
		$this->description = __( 'Sent when a customer skips their next billing cycle.', 'purecart' );

		parent::__construct();
	}

	/**
	 * Returns the action hooks that fire this email.
	 *
	 * @since 1.0.0
	 * @return string[]
	 */
	protected function trigger_hooks(): array {
		return array( 'purecart_subscription_skipped' );
	}

	/**
	 * Returns the default email subject line.
	 *
	 * @since 1.0.0
	 * @return string
	 */
	public function get_default_subject() {
		return __( 'Your next {product_name} charge has been skipped', 'purecart' );
	}

	/**
	 * Returns the default email heading.
	 *
	 * @since 1.0.0
	 * @return string
	 */
	public function get_default_heading() {
		return __( 'Next renewal skipped', 'purecart' );
	}

	/**
	 * Returns the email body message.
	 *
	 * @since 1.0.0
	 * @return string
	 */
	protected function get_body_message(): string {
		return __( 'Hi {first_name}, your next billing cycle for {product_name} has been skipped as requested — no charge this time. Your next payment is now due on {next_payment_date}.', 'purecart' );
	}
}
