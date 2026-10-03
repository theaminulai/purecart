<?php
declare( strict_types=1 );
/**
 * WooCommerce email notifying the customer of a successful subscription renewal payment.
 *
 * @package PureCart\Subscriptions\Emails
 * @since   1.0.0
 */

namespace PureCart\Subscriptions\Emails;

defined( 'ABSPATH' ) || exit;

/**
 * should_send() excludes the trial-conversion case (TrialConvertedEmail
 * covers that one) so a subscriber doesn't get both emails for one charge.
 *
 * @since 1.0.0
 */
class RenewalSuccessfulEmail extends AbstractSubscriptionEmail {

	/**
	 * Initializes the email ID, title, and description.
	 *
	 * @since 1.0.0
	 * @return void
	 */
	public function __construct() {
		$this->id          = 'purecart_renewal_successful';
		$this->title       = __( 'Renewal Successful', 'purecart' );
		$this->description = __( 'Sent when a recurring payment is captured successfully.', 'purecart' );

		parent::__construct();
	}

	/**
	 * Returns the action hooks that fire this email.
	 *
	 * @since 1.0.0
	 * @return string[]
	 */
	protected function trigger_hooks(): array {
		return array( 'purecart_subscription_renewed' );
	}

	/**
	 * Sends only when the renewal is not a trial-to-paid conversion.
	 *
	 * @since 1.0.0
	 * @param mixed $arg2 Unused.
	 * @param mixed $arg3 Unused.
	 * @param mixed $arg4 Unused.
	 * @return bool
	 */
	protected function should_send( $arg2 = null, $arg3 = null, $arg4 = null ): bool {
		$is_trial_conversion = $this->subscription
			&& 1 === (int) $this->subscription->renewal_count
			&& ! empty( $this->subscription->trial_ends_at );

		return $this->subscription && ! $is_trial_conversion;
	}

	/**
	 * Returns the default email subject line.
	 *
	 * @since 1.0.0
	 * @return string
	 */
	public function get_default_subject() {
		return __( 'Payment received for {product_name}', 'purecart' );
	}

	/**
	 * Returns the default email heading.
	 *
	 * @since 1.0.0
	 * @return string
	 */
	public function get_default_heading() {
		return __( 'Renewal successful', 'purecart' );
	}

	/**
	 * Returns the email body message.
	 *
	 * @since 1.0.0
	 * @return string
	 */
	protected function get_body_message(): string {
		return __( 'Hi {first_name}, {amount} was charged for your {product_name} subscription. Your next payment is due on {next_payment_date}.', 'purecart' );
	}
}
