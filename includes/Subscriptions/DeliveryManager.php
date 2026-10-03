<?php
declare( strict_types=1 );
/**
 * Dispatches provisioning across all registered subscription delivery types.
 *
 * @package PureCart\Subscriptions
 */

namespace PureCart\Subscriptions;

use PureCart\Subscriptions\Repository\SubscriptionRepository;

use PureCart\Licensing\LicenseGenerator;
use PureCart\SaaS\AccountProvisioner;
use PureCart\Settings\OptionKeys;
use PureCart\Settings\Settings;

defined( 'ABSPATH' ) || exit;

/**
 * Dispatches subscription activation, renewal, and deactivation across all
 * registered delivery types.
 *
 * The `software` and `saas` types are handled directly here because Licensing
 * and SaaS are sibling modules with their own tables and richer domain logic.
 * All other delivery types are delegated to DeliveryHandlerRegistry.
 *
 * Note: `software` activation creates a new license row via
 * `LicenseGenerator::create()`, not `LicenseActivator` — the latter handles
 * per-domain activate/deactivate for an existing license only.
 *
 * @since 1.0.0
 */
class DeliveryManager {

	/**
	 * Deactivation reason: non-payment suspension — access stops now, restorable.
	 *
	 * @since 1.0.0
	 * @var string
	 */
	public const REASON_SUSPENDED = 'suspended';

	/**
	 * Deactivation reason: cancellation — access runs to the end of the paid-for period.
	 *
	 * @since 1.0.0
	 * @var string
	 */
	public const REASON_CANCELLED = 'cancelled';

	/**
	 * Deactivation reason: fixed term reached its end.
	 *
	 * @since 1.0.0
	 * @var string
	 */
	public const REASON_EXPIRED = 'expired';

	/**
	 * First charge succeeds, or trial starts. Returns linked-entity IDs to
	 * persist on the subscription row (e.g. `license_id`, `saas_account_id`);
	 * empty array for registry-backed types, which store their own linked data.
	 *
	 * @since 1.0.0
	 * @param array<string, mixed> $subscription Subscription data (order_id, user_id, product_id, delivery_type, ...).
	 * @return array<string, mixed>
	 */
	public static function activate( array $subscription ): array {
		$type = $subscription['delivery_type'] ?? 'software';

		if ( 'software' === $type ) {
			$license = ( new LicenseGenerator() )->create(
				(int) ( $subscription['order_id'] ?? 0 ),
				(int) ( $subscription['user_id'] ?? 0 ),
				(int) ( $subscription['product_id'] ?? 0 )
			);
			return array( 'license_id' => $license->id ?? null );
		}

		if ( 'saas' === $type ) {
			$account = ( new AccountProvisioner() )->provision(
				(int) ( $subscription['order_id'] ?? 0 ),
				(int) ( $subscription['user_id'] ?? 0 ),
				(int) ( $subscription['product_id'] ?? 0 )
			);
			return array( 'saas_account_id' => $account->id ?? null );
		}

		$handler = DeliveryHandlerRegistry::get( $type );
		if ( $handler ) {
			$handler->activate( $subscription );
		}

		return array();
	}

	/**
	 * Re-activate an *existing* linked resource after a suspension/pause/
	 * resubscribe-within-window — deliberately separate from activate(),
	 * which provisions a brand-new resource (new license key, new SaaS
	 * account). Calling activate() here would silently double-provision:
	 * SubscriptionManager::resubscribe()'s same-record path already has a
	 * `license_id`/`saas_account_id` on the row from the original purchase.
	 *
	 * @since 1.0.0
	 * @param array<string, mixed> $subscription Subscription row.
	 * @return void
	 */
	public static function reactivate( array $subscription ): void {
		$type = $subscription['delivery_type'] ?? 'software';

		if ( 'saas' === $type ) {
			if ( ! empty( $subscription['saas_account_id'] ) ) {
				( new AccountProvisioner() )->activate( (int) $subscription['saas_account_id'] );
			}
			return;
		}

		if ( 'software' === $type ) {
			// Restore a license that a suspension put on hold. Only lifts
			// `suspended` — `revoked` is a deliberate admin action and `expired`
			// needs a date extension (which renew() handles), so neither is
			// silently flipped to active on payment alone.
			if ( ! empty( $subscription['license_id'] ) ) {
				$licenses = new LicenseGenerator();
				$license  = $licenses->get_by_id( (int) $subscription['license_id'] );

				if ( $license && 'suspended' === $license->status ) {
					$licenses->set_status( (int) $subscription['license_id'], 'active' );
				}
			}
			return;
		}

		// Registry-backed types have no "create vs. re-activate" distinction —
		// re-running activate() just re-syncs role/access, it doesn't create
		// a new resource, so it's safe to reuse here.
		$handler = DeliveryHandlerRegistry::get( $type );
		if ( $handler ) {
			$handler->activate( $subscription );
		}
	}

	/**
	 * Every successful renewal.
	 *
	 * @since 1.0.0
	 * @param array<string, mixed> $subscription Subscription row.
	 * @return void
	 */
	public static function renew( array $subscription ): void {
		$type = $subscription['delivery_type'] ?? 'software';

		if ( 'software' === $type ) {
			if ( empty( $subscription['license_id'] ) ) {
				return;
			}

			$licenses   = new LicenseGenerator();
			$license_id = (int) $subscription['license_id'];

			// _purecart_renewal_behavior (product meta, RND-licensing.md
			// "Subscription Renewal Behavior") controls whether a renewal
			// extends the existing key or revokes it and issues a fresh one.
			$license  = $licenses->get_by_id( $license_id );
			$behavior = 'extend';
			if ( $license ) {
				$product = wc_get_product( (int) $license->product_id );
				if ( $product ) {
					$behavior = $product->get_meta( '_purecart_renewal_behavior' ) ?: 'extend';
				}
			}

			/**
			 * Filter the renewal behavior for a license, overriding product meta.
			 *
			 * @since 1.0.0
			 * @param string $behavior       'extend' or 'new_key'.
			 * @param int    $license_id     License being renewed.
			 * @param int    $subscription_id Subscription being renewed.
			 */
			$behavior = apply_filters( 'purecart_license_renewal_behavior', $behavior, $license_id, (int) ( $subscription['id'] ?? 0 ) );

			if ( 'new_key' === $behavior ) {
				$licenses->set_status( $license_id, 'revoked' );

				$new_license = $licenses->create(
					(int) ( $subscription['order_id'] ?? 0 ),
					(int) ( $subscription['user_id'] ?? 0 ),
					(int) ( $subscription['product_id'] ?? 0 )
				);

				if ( $new_license ) {
					( new SubscriptionRepository() )->update( (int) ( $subscription['id'] ?? 0 ), array( 'license_id' => $new_license->id ) );
				}
				return;
			}

			// Extend the license's expiry by exactly the billing period just
			// paid for, so the key keeps validating through the new cycle.
			$licenses->extend_expiry(
				$license_id,
				max( 1, (int) ( $subscription['billing_interval'] ?? 1 ) ),
				(string) ( $subscription['billing_period'] ?? 'month' )
			);
			return;
		}

		if ( 'saas' === $type ) {
			// A renewal after a failed-payment suspension must restore the SaaS
			// account. activate() is idempotent, so calling it for an
			// already-active account is harmless.
			if ( ! empty( $subscription['saas_account_id'] ) ) {
				( new AccountProvisioner() )->activate( (int) $subscription['saas_account_id'] );
			}
			return;
		}

		$handler = DeliveryHandlerRegistry::get( $type );
		if ( $handler ) {
			$handler->renew( $subscription );
		}
	}

	/**
	 * Deactivates delivery when a subscription is suspended, cancelled, or expired.
	 *
	 * The `$reason` parameter controls how strictly access is cut. For a
	 * suspension (non-payment), access stops immediately. For a cancellation,
	 * the license or SaaS account stays active until the paid-for period
	 * naturally ends. Defaults to `cancelled` — the more conservative behavior
	 * (access kept running) — to avoid accidental early cut-off.
	 *
	 * @since 1.0.0
	 * @param array<string, mixed> $subscription Subscription row.
	 * @param string               $reason       One of 'suspended', 'cancelled', 'expired'.
	 * @return void
	 */
	public static function deactivate( array $subscription, string $reason = self::REASON_CANCELLED ): void {
		$type = $subscription['delivery_type'] ?? 'software';

		if ( 'saas' === $type ) {
			if ( ! empty( $subscription['saas_account_id'] ) && self::should_revoke_saas_now( $reason ) ) {
				( new AccountProvisioner() )->suspend( (int) $subscription['saas_account_id'] );
			}
			return;
		}

		if ( 'software' === $type ) {
			if ( empty( $subscription['license_id'] ) ) {
				return;
			}

			$license_id = (int) $subscription['license_id'];

			if ( self::REASON_SUSPENDED === $reason ) {
				// Non-payment: stop the key working now, but keep it restorable
				// — reactivate() lifts exactly this state if the customer pays.
				( new LicenseGenerator() )->set_status( $license_id, 'suspended' );
				return;
			}

			if ( self::REASON_EXPIRED === $reason ) {
				( new LicenseGenerator() )->set_status( $license_id, 'expired' );
				return;
			}

			// REASON_CANCELLED: deliberately does nothing to the license. The
			// customer has already paid for the period the license runs to, so
			// it stays valid until its own `expires_at` passes; it simply stops
			// being extended, because no further renewal will occur. Revoking
			// here would take away time that was already paid for.
			return;
		}

		$handler = DeliveryHandlerRegistry::get( $type );
		if ( $handler ) {
			$handler->deactivate( $subscription );
		}
	}

	/**
	 * Returns true when a SaaS account should be suspended immediately for the
	 * given deactivation reason.
	 *
	 * A cancellation leaves the SaaS account running until the paid-for period
	 * ends (controlled by `purecart_sub_cancel_saas_immediately`). A suspension
	 * or expiry always cuts access immediately — no paid-for period remains.
	 *
	 * @since 1.0.0
	 * @param string $reason Deactivation reason.
	 * @return bool
	 */
	private static function should_revoke_saas_now( string $reason ): bool {
		if ( self::REASON_SUSPENDED === $reason || self::REASON_EXPIRED === $reason ) {
			return true;
		}

		return (bool) Settings::get( OptionKeys::SUB_CANCEL_SAAS_IMMEDIATELY, false );
	}
}
