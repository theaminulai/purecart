<?php
declare( strict_types=1 );
/**
 * WooCommerce email notifying the customer of an overdue subscription balance.
 *
 * @package PureCart\Subscriptions\Emails
 * @since   1.0.0
 */

namespace PureCart\Subscriptions\Emails;

defined( 'ABSPATH' ) || exit;

/**
 * Fires on `purecart_dunning_retry_failed` after all configured retry attempts
 * have been exhausted. Sends a final overdue notice to the customer.
 *
 * @since 1.0.0
 */
class OverdueNoticeEmail extends AbstractSubscriptionEmail {

	/**
	 * Initializes the email ID, title, and description.
	 *
	 * @since 1.0.0
	 * @return void
	 */
	public function __construct() {
		$this->id          = 'purecart_overdue_notice';
		$this->title       = __( 'Overdue Notice', 'purecart' );
		$this->description = __( 'Sent after a scheduled payment retry also fails.', 'purecart' );

		parent::__construct();
	}

	/**
	 * Returns the action hooks that fire this email.
	 *
	 * @since 1.0.0
	 * @return string[]
	 */
	protected function trigger_hooks(): array {
		return array( 'purecart_dunning_retry_failed' );
	}

	/**
	 * Returns the default email subject line.
	 *
	 * @since 1.0.0
	 * @return string
	 */
	public function get_default_subject() {
		return __( 'Your {product_name} payment is still overdue', 'purecart' );
	}

	/**
	 * Returns the default email heading.
	 *
	 * @since 1.0.0
	 * @return string
	 */
	public function get_default_heading() {
		return __( 'Payment still overdue', 'purecart' );
	}

	/**
	 * Returns the email body message.
	 *
	 * @since 1.0.0
	 * @return string
	 */
	protected function get_body_message(): string {
		return __( 'Hi {first_name}, we tried again to charge {amount} for {product_name} and it still failed. Please update your payment method soon to avoid losing access.', 'purecart' );
	}
}
