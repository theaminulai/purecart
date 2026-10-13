<?php
declare( strict_types=1 );
/**
 * WooCommerce email notifying the customer that their saved card is expiring soon.
 *
 * @package PureCart\Subscriptions\Emails
 * @since   1.0.0
 */

namespace PureCart\Subscriptions\Emails;

defined( 'ABSPATH' ) || exit;

/**
 * Fired by `SubscriptionEmail::send_card_expiry_warnings()`. The expiry scan
 * runs inside SubscriptionEmail rather than a dedicated health-check class
 * because no separate health-check class is scoped for this module.
 *
 * @since 1.0.0
 */
class CardExpiringSoonEmail extends AbstractSubscriptionEmail {

	/**
	 * Initializes the email ID, title, and description.
	 *
	 * @since 1.0.0
	 * @return void
	 */
	public function __construct() {
		$this->id          = 'purecart_card_expiring_soon';
		$this->title       = __( 'Card Expiring Soon', 'purecart' );
		$this->description = __( 'Sent when a subscription\'s saved card is close to its expiry date.', 'purecart' );

		parent::__construct();
	}

	/**
	 * Returns the action hooks that fire this email.
	 *
	 * @since 1.0.0
	 * @return string[]
	 */
	protected function trigger_hooks(): array {
		return array( 'purecart_card_expiring_soon' );
	}

	/**
	 * Returns the default email subject line.
	 *
	 * @since 1.0.0
	 * @return string
	 */
	public function get_default_subject() {
		return __( 'Your card on file for {product_name} is expiring soon', 'purecart' );
	}

	/**
	 * Returns the default email heading.
	 *
	 * @since 1.0.0
	 * @return string
	 */
	public function get_default_heading() {
		return __( 'Your card is expiring soon', 'purecart' );
	}

	/**
	 * Returns the email body message.
	 *
	 * @since 1.0.0
	 * @return string
	 */
	protected function get_body_message(): string {
		return __( 'Hi {first_name}, the card on file for your {product_name} subscription is expiring soon. Update your payment method to avoid a missed renewal.', 'purecart' );
	}
}
