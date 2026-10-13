<?php
declare( strict_types=1 );
/**
 * WooCommerce email notifying the customer that their subscription plan has changed.
 *
 * @package PureCart\Subscriptions\Emails
 * @since   1.0.0
 */

namespace PureCart\Subscriptions\Emails;

defined( 'ABSPATH' ) || exit;

/**
 * Fires on `purecart_subscription_plan_changed`, dispatched by RenewalEngine
 * (pending-switch applied), PlanUpgrade (no_proration/prorate_immediately),
 * and SplitPaymentManager's plan-change paths alike — one email covers all
 * of them since they all represent the same underlying event.
 *
 * @since 1.0.0
 */
class PlanChangedEmail extends AbstractSubscriptionEmail {

	/**
	 * Initializes the email ID, title, and description.
	 *
	 * @since 1.0.0
	 * @return void
	 */
	public function __construct() {
		$this->id          = 'purecart_plan_changed';
		$this->title       = __( 'Plan Changed', 'purecart' );
		$this->description = __( 'Sent when an upgrade or downgrade takes effect.', 'purecart' );

		parent::__construct();
	}

	/**
	 * Returns the action hooks that fire this email.
	 *
	 * @since 1.0.0
	 * @return string[]
	 */
	protected function trigger_hooks(): array {
		return array( 'purecart_subscription_plan_changed' );
	}

	/**
	 * Returns the default email subject line.
	 *
	 * @since 1.0.0
	 * @return string
	 */
	public function get_default_subject() {
		return __( 'Your plan has changed to {product_name}', 'purecart' );
	}

	/**
	 * Returns the default email heading.
	 *
	 * @since 1.0.0
	 * @return string
	 */
	public function get_default_heading() {
		return __( 'Your plan has changed', 'purecart' );
	}

	/**
	 * Returns the email body message.
	 *
	 * @since 1.0.0
	 * @return string
	 */
	protected function get_body_message(): string {
		return __( 'Hi {first_name}, your subscription is now on the {product_name} plan at {amount} per cycle. Your next payment is due on {next_payment_date}.', 'purecart' );
	}
}
