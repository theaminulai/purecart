<?php
/**
 * WooCommerce email notifying the customer that a failed payment retry has been scheduled.
 *
 * @package PureCart\Subscriptions\Emails
 * @since   1.0.0
 */

declare( strict_types=1 );

namespace PureCart\Subscriptions\Emails;

defined( 'ABSPATH' ) || exit;

/**
 * Fires on `purecart_dunning_retry_scheduled`, dispatched by DunningManager
 * after scheduling the next automatic retry attempt.
 *
 * @since 1.0.0
 */
class PaymentRetryScheduledEmail extends AbstractSubscriptionEmail {

	/**
	 * Unix timestamp of the next retry, passed by the triggering hook.
	 *
	 * @since 1.0.0
	 * @var int
	 */
	private int $retry_timestamp = 0;

	/**
	 * Initializes the email ID, title, and description.
	 *
	 * @since 1.0.0
	 * @return void
	 */
	public function __construct() {
		$this->id          = 'purecart_payment_retry_scheduled';
		$this->title       = __( 'Payment Retry Scheduled', 'purecart' );
		$this->description = __( 'Sent when a failed payment retry is scheduled.', 'purecart' );

		parent::__construct();
	}

	/**
	 * Returns the action hooks that fire this email.
	 *
	 * @since 1.0.0
	 * @return string[]
	 */
	protected function trigger_hooks(): array {
		return array( 'purecart_dunning_retry_scheduled' );
	}

	/**
	 * Stores the retry timestamp from the hook and confirms the subscription exists.
	 *
	 * @since 1.0.0
	 * @param mixed $arg2 Unix timestamp of the scheduled retry attempt.
	 * @param mixed $arg3 Unused.
	 * @param mixed $arg4 Unused.
	 * @return bool
	 */
	protected function should_send( $arg2 = null, $arg3 = null, $arg4 = null ): bool {
		$this->retry_timestamp = (int) $arg2;
		return null !== $this->subscription;
	}

	/**
	 * Returns the default email subject line.
	 *
	 * @since 1.0.0
	 * @return string
	 */
	public function get_default_subject() {
		return __( "We'll retry your {product_name} payment soon", 'purecart' );
	}

	/**
	 * Returns the default email heading.
	 *
	 * @since 1.0.0
	 * @return string
	 */
	public function get_default_heading() {
		return __( 'Payment retry scheduled', 'purecart' );
	}

	/**
	 * Returns the email body message, including the formatted retry date.
	 *
	 * @since 1.0.0
	 * @return string
	 */
	protected function get_body_message(): string {
		$retry_date = $this->retry_timestamp ? date_i18n( get_option( 'date_format' ), $this->retry_timestamp ) : '';

		return sprintf(
			/* translators: %s: retry date */
			__( 'Hi {first_name}, your last payment for {product_name} did not go through. We will automatically retry on %s — no action needed if your card issue resolves itself before then.', 'purecart' ),
			esc_html( $retry_date )
		);
	}
}
