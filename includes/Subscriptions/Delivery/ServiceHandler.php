<?php
/**
 * Service/Retainer delivery type — deliverable tracking + optional invoice.
 *
 * @package PureCart\Subscriptions\Delivery
 */

declare( strict_types=1 );

namespace PureCart\Subscriptions\Delivery;

use PureCart\Subscriptions\DeliveryHandlerInterface;

defined( 'ABSPATH' ) || exit;

/**
 * Stub implementation of the Service/Retainer delivery type.
 *
 * Satisfies the registry contract so "Service / Retainer" is selectable as a
 * delivery type. Real deliverable-due-date tracking and invoice dispatch require
 * linked-entity support to track the next deliverable date per subscription.
 *
 * @since 1.0.0
 */
class ServiceHandler implements DeliveryHandlerInterface {

	/**
	 * @since 1.0.0
	 * @param array<string, mixed> $subscription Subscription row.
	 * @return void
	 */
	public function activate( array $subscription ): void {
		// TODO: seed next_deliverable_due from the product's deliverable template.
	}

	/**
	 * @since 1.0.0
	 * @param array<string, mixed> $subscription Subscription row.
	 * @return void
	 */
	public function renew( array $subscription ): void {
		// TODO: advance next_deliverable_due; send invoice per purecart_sub_service_invoice_mode.
	}

	/**
	 * @since 1.0.0
	 * @param array<string, mixed> $subscription Subscription row.
	 * @return void
	 */
	public function deactivate( array $subscription ): void {
		// TODO: nothing to revoke by default — deliverables already sent stay sent.
	}

	/**
	 * @since 1.0.0
	 * @param array<string, mixed> $subscription Subscription row.
	 * @return array<string, mixed>
	 */
	public function get_linked_data( array $subscription ): array {
		return array();
	}

	/**
	 * @since 1.0.0
	 * @param array<string, mixed> $data Linked-entity data to validate.
	 * @return bool|\WP_Error
	 */
	public function validate_linked_data( array $data ): bool|\WP_Error {
		return true;
	}
}
