<?php
declare( strict_types=1 );
/**
 * WooCommerce email prompting the customer to reauthorize their payment method.
 *
 * @package PureCart\Subscriptions\Emails
 * @since   1.0.0
 */

namespace PureCart\Subscriptions\Emails;

defined( 'ABSPATH' ) || exit;

/**
 * Fires on `purecart_subscription_reauth_required`, dispatched by
 * WebhookHandler when a gateway reports `invoice.payment_action_required`
 * (an SCA/3DS challenge is required). Purely event-driven; no scan needed.
 *
 * @since 1.0.0
 */
class PaymentReauthorizationEmail extends AbstractSubscriptionEmail {

	/**
	 * Initializes the email ID, title, and description.
	 *
	 * @since 1.0.0
	 * @return void
	 */
	public function __construct() {
		$this->id          = 'purecart_payment_reauthorization';
		$this->title       = __( 'Payment Reauthorization', 'purecart' );
		$this->description = __( 'Sent when a renewal charge requires bank authentication (SCA/3DS).', 'purecart' );

		parent::__construct();
	}

	/**
	 * Returns the action hooks that fire this email.
	 *
	 * @since 1.0.0
	 * @return string[]
	 */
	protected function trigger_hooks(): array {
		return array( 'purecart_subscription_reauth_required' );
	}

	/**
	 * Returns the default email subject line.
	 *
	 * @since 1.0.0
	 * @return string
	 */
	public function get_default_subject() {
		return __( 'Action needed: confirm your {product_name} payment', 'purecart' );
	}

	/**
	 * Returns the default email heading.
	 *
	 * @since 1.0.0
	 * @return string
	 */
	public function get_default_heading() {
		return __( 'Please confirm your payment', 'purecart' );
	}

	/**
	 * Returns the email body message.
	 *
	 * @since 1.0.0
	 * @return string
	 */
	protected function get_body_message(): string {
		return __( 'Hi {first_name}, your bank requires additional confirmation before we can charge {amount} for {product_name}. Please contact us or check your account to complete this step.', 'purecart' );
	}
}
