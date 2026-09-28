<?php
/**
 * WooCommerce email notifying the customer when their subscription has expired.
 *
 * @package PureCart\Subscriptions\Emails
 * @since   1.0.0
 */

declare( strict_types=1 );

namespace PureCart\Subscriptions\Emails;

defined( 'ABSPATH' ) || exit;

/**
 * Notifies the customer when a fixed-length subscription reaches its end.
 *
 * @since 1.0.0
 */
class ExpirationNoticeEmail extends AbstractSubscriptionEmail {

	/**
	 * Initializes the email ID, title, and description.
	 *
	 * @since 1.0.0
	 * @return void
	 */
	public function __construct() {
		$this->id          = 'purecart_expiration_notice';
		$this->title       = __( 'Expiration Notice', 'purecart' );
		$this->description = __( 'Sent when a fixed-length subscription reaches its end.', 'purecart' );

		parent::__construct();
	}

	/**
	 * Returns the action hooks that fire this email.
	 *
	 * @since 1.0.0
	 * @return string[]
	 */
	protected function trigger_hooks(): array {
		return array( 'purecart_subscription_status_changed' );
	}

	/**
	 * Sends only when the subscription's new status is 'expired'.
	 *
	 * @since 1.0.0
	 * @param mixed $arg2 Previous subscription status.
	 * @param mixed $arg3 New subscription status.
	 * @param mixed $arg4 Unused.
	 * @return bool
	 */
	protected function should_send( $arg2 = null, $arg3 = null, $arg4 = null ): bool {
		return 'expired' === $arg3;
	}

	/**
	 * Returns the default email subject line.
	 *
	 * @since 1.0.0
	 * @return string
	 */
	public function get_default_subject() {
		return __( 'Your {product_name} subscription has expired', 'purecart' );
	}

	/**
	 * Returns the default email heading.
	 *
	 * @since 1.0.0
	 * @return string
	 */
	public function get_default_heading() {
		return __( 'Subscription expired', 'purecart' );
	}

	/**
	 * Returns the email body message.
	 *
	 * @since 1.0.0
	 * @return string
	 */
	protected function get_body_message(): string {
		return __( 'Hi {first_name}, your {product_name} subscription has reached the end of its term and is now expired. Resubscribe any time to continue.', 'purecart' );
	}
}
