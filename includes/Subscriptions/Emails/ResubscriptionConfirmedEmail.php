<?php
/**
 * WooCommerce email confirming to the customer that their resubscription was successful.
 *
 * @package PureCart\Subscriptions\Emails
 * @since   1.0.0
 */

declare( strict_types=1 );

namespace PureCart\Subscriptions\Emails;

defined( 'ABSPATH' ) || exit;

/**
 * Confirms to the customer that their resubscription was successful.
 *
 * @since 1.0.0
 */
class ResubscriptionConfirmedEmail extends AbstractSubscriptionEmail {

	/**
	 * Initializes the email ID, title, and description.
	 *
	 * @since 1.0.0
	 * @return void
	 */
	public function __construct() {
		$this->id          = 'purecart_resubscription_confirmed';
		$this->title       = __( 'Resubscription Confirmed', 'purecart' );
		$this->description = __( 'Sent when a customer resubscribes to a cancelled/expired subscription.', 'purecart' );

		parent::__construct();
	}

	/**
	 * Returns the action hooks that fire this email.
	 *
	 * @since 1.0.0
	 * @return string[]
	 */
	protected function trigger_hooks(): array {
		return array( 'purecart_subscription_resubscribed' );
	}

	/**
	 * Returns the default email subject line.
	 *
	 * @since 1.0.0
	 * @return string
	 */
	public function get_default_subject() {
		return __( "You're resubscribed to {product_name}", 'purecart' );
	}

	/**
	 * Returns the default email heading.
	 *
	 * @since 1.0.0
	 * @return string
	 */
	public function get_default_heading() {
		return __( 'Resubscription confirmed', 'purecart' );
	}

	/**
	 * Returns the email body message.
	 *
	 * @since 1.0.0
	 * @return string
	 */
	protected function get_body_message(): string {
		return __( 'Hi {first_name}, welcome back! Your {product_name} subscription is active again at {amount} per cycle. Your next payment is due on {next_payment_date}.', 'purecart' );
	}
}
