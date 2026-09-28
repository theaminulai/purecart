<?php
/**
 * WooCommerce email confirming to the customer that a new subscription has been created.
 *
 * @package PureCart\Subscriptions\Emails
 * @since   1.0.0
 */

declare( strict_types=1 );

namespace PureCart\Subscriptions\Emails;

defined( 'ABSPATH' ) || exit;

/**
 * Fires on the same `purecart_subscription_activated` hook as
 * TrialStartedEmail — should_send() splits on whether a trial applied, so
 * exactly one of the two ever sends for a given activation.
 *
 * @since 1.0.0
 */
class SubscriptionCreatedEmail extends AbstractSubscriptionEmail {

	/**
	 * Initializes the email ID, title, and description.
	 *
	 * @since 1.0.0
	 * @return void
	 */
	public function __construct() {
		$this->id          = 'purecart_subscription_created';
		$this->title       = __( 'Subscription Created', 'purecart' );
		$this->description = __( 'Sent to the customer when a new subscription (no trial) is activated.', 'purecart' );

		parent::__construct();
	}

	/**
	 * Returns the action hooks that fire this email.
	 *
	 * @since 1.0.0
	 * @return string[]
	 */
	protected function trigger_hooks(): array {
		return array( 'purecart_subscription_activated' );
	}

	/**
	 * Sends only when the subscription is not in a trialing status at activation.
	 *
	 * @since 1.0.0
	 * @param mixed $arg2 Unused.
	 * @param mixed $arg3 Unused.
	 * @param mixed $arg4 Unused.
	 * @return bool
	 */
	protected function should_send( $arg2 = null, $arg3 = null, $arg4 = null ): bool {
		return $this->subscription && 'trialing' !== $this->subscription->status;
	}

	/**
	 * Returns the default email subject line.
	 *
	 * @since 1.0.0
	 * @return string
	 */
	public function get_default_subject() {
		return __( 'Your {product_name} subscription is active', 'purecart' );
	}

	/**
	 * Returns the default email heading.
	 *
	 * @since 1.0.0
	 * @return string
	 */
	public function get_default_heading() {
		return __( 'Welcome aboard!', 'purecart' );
	}

	/**
	 * Returns the email body message.
	 *
	 * @since 1.0.0
	 * @return string
	 */
	protected function get_body_message(): string {
		return __( 'Hi {first_name}, thanks for subscribing to {product_name}. Your subscription is now active at {amount} per billing cycle. Your next payment is due on {next_payment_date}.', 'purecart' );
	}
}
