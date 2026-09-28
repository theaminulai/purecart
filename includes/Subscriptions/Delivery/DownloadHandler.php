<?php
/**
 * Digital Downloads delivery type — per-cycle download quota + drip schedule.
 *
 * @package PureCart\Subscriptions\Delivery
 */

declare( strict_types=1 );

namespace PureCart\Subscriptions\Delivery;

use PureCart\Subscriptions\DeliveryHandlerInterface;

defined( 'ABSPATH' ) || exit;

/**
 * Stub implementation of the Digital Downloads delivery type.
 *
 * Satisfies the registry contract so "Digital Downloads" is selectable as a
 * delivery type. Real quota reset and drip scheduling require Downloads module
 * integration and linked-entity support to track per-cycle download counts.
 *
 * @since 1.0.0
 */
class DownloadHandler implements DeliveryHandlerInterface {

	/**
	 * @since 1.0.0
	 * @param array<string, mixed> $subscription Subscription row.
	 * @return void
	 */
	public function activate( array $subscription ): void {
		// TODO: create the linked-entities row and seed downloads_this_cycle = 0.
	}

	/**
	 * @since 1.0.0
	 * @param array<string, mixed> $subscription Subscription row.
	 * @return void
	 */
	public function renew( array $subscription ): void {
		// TODO: reset downloads_this_cycle; advance next_drip_date if drip is configured.
	}

	/**
	 * @since 1.0.0
	 * @param array<string, mixed> $subscription Subscription row.
	 * @return void
	 */
	public function deactivate( array $subscription ): void {
		// TODO: revoke download access.
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
