<?php
declare( strict_types=1 );
/**
 * WooCommerce email notifying the customer that their suspension grace period is nearly over.
 *
 * @package PureCart\Subscriptions\Emails
 * @since   1.0.0
 */

namespace PureCart\Subscriptions\Emails;

defined( 'ABSPATH' ) || exit;

/**
 * Fired by `SubscriptionEmail::send_grace_reminders()`, which scans for
 * suspended subscriptions approaching the end of `purecart_sub_suspended_grace_days`
 * before DunningManager hard-cancels the subscription.
 *
 * @since 1.0.0
 */
class SuspendedGraceEndingEmail extends AbstractSubscriptionEmail {

	/**
	 * Initializes the email ID, title, and description.
	 *
	 * @since 1.0.0
	 * @return void
	 */
	public function __construct() {
		$this->id          = 'purecart_suspended_grace_ending';
		$this->title       = __( 'Suspended Grace Ending', 'purecart' );
		$this->description = __( 'Sent a few days before a suspended subscription is permanently cancelled.', 'purecart' );

		parent::__construct();
	}

	/**
	 * Returns the action hooks that fire this email.
	 *
	 * @since 1.0.0
	 * @return string[]
	 */
	protected function trigger_hooks(): array {
		return array( 'purecart_suspended_grace_ending' );
	}

	/**
	 * Returns the default email subject line.
	 *
	 * @since 1.0.0
	 * @return string
	 */
	public function get_default_subject() {
		return __( 'Last chance to save your {product_name} subscription', 'purecart' );
	}

	/**
	 * Returns the default email heading.
	 *
	 * @since 1.0.0
	 * @return string
	 */
	public function get_default_heading() {
		return __( 'Your subscription will be cancelled soon', 'purecart' );
	}

	/**
	 * Returns the email body message.
	 *
	 * @since 1.0.0
	 * @return string
	 */
	protected function get_body_message(): string {
		return __( 'Hi {first_name}, your {product_name} subscription is still suspended due to a failed payment. If it stays unresolved a little longer, it will be cancelled permanently. Update your payment method now to restore it.', 'purecart' );
	}
}
