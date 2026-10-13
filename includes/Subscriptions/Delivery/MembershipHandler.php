<?php
declare( strict_types=1 );
/**
 * Membership delivery type — WP role assignment + content-access tier.
 *
 * @package PureCart\Subscriptions\Delivery
 */

namespace PureCart\Subscriptions\Delivery;

use PureCart\Subscriptions\DeliveryHandlerInterface;

defined( 'ABSPATH' ) || exit;

/**
 * Stub implementation of the Membership delivery type.
 *
 * Satisfies the registry contract so "Membership" is selectable as a delivery
 * type. Real WP role assignment and removal delegates to RoleManager.
 *
 * @since 1.0.0
 */
class MembershipHandler implements DeliveryHandlerInterface {

	/**
	 * @since 1.0.0
	 * @param array<string, mixed> $subscription Subscription row.
	 * @return void
	 */
	public function activate( array $subscription ): void {
		// TODO: assign the membership tier's WP role to $subscription['user_id'] via RoleManager.
	}

	/**
	 * @since 1.0.0
	 * @param array<string, mixed> $subscription Subscription row.
	 * @return void
	 */
	public function renew( array $subscription ): void {
		// TODO: re-sync role in case the membership tier changed since last cycle.
	}

	/**
	 * @since 1.0.0
	 * @param array<string, mixed> $subscription Subscription row.
	 * @return void
	 */
	public function deactivate( array $subscription ): void {
		// TODO: remove the role after purecart_sub_membership_grace_days elapses.
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
