<?php
/**
 * WooCommerce email notifying the customer that their free trial has started.
 *
 * @package PureCart\Subscriptions\Emails
 * @since   1.0.0
 */

declare( strict_types=1 );

namespace PureCart\Subscriptions\Emails;

defined( 'ABSPATH' ) || exit;

/**
 * Notifies the customer when their free trial begins.
 *
 * @since 1.0.0
 */
class TrialStartedEmail extends AbstractSubscriptionEmail {

	/**
	 * Initializes the email ID, title, and description.
	 *
	 * @since 1.0.0
	 * @return void
	 */
	public function __construct() {
		$this->id          = 'purecart_trial_started';
		$this->title       = __( 'Trial Started', 'purecart' );
		$this->description = __( 'Sent to the customer when their free trial begins.', 'purecart' );

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
	 * Sends only when the subscription is in a trialing status at activation.
	 *
	 * @since 1.0.0
	 * @param mixed $arg2 Unused.
	 * @param mixed $arg3 Unused.
	 * @param mixed $arg4 Unused.
	 * @return bool
	 */
	protected function should_send( $arg2 = null, $arg3 = null, $arg4 = null ): bool {
		return $this->subscription && 'trialing' === $this->subscription->status;
	}

	/**
	 * Returns the default email subject line.
	 *
	 * @since 1.0.0
	 * @return string
	 */
	public function get_default_subject() {
		return __( 'Your {product_name} free trial has started', 'purecart' );
	}

	/**
	 * Returns the default email heading.
	 *
	 * @since 1.0.0
	 * @return string
	 */
	public function get_default_heading() {
		return __( 'Your free trial has started', 'purecart' );
	}

	/**
	 * Returns the email body message.
	 *
	 * @since 1.0.0
	 * @return string
	 */
	protected function get_body_message(): string {
		return __( 'Hi {first_name}, your free trial of {product_name} is active until {trial_end_date}. After that, {amount} will be billed automatically unless you cancel first.', 'purecart' );
	}
}
