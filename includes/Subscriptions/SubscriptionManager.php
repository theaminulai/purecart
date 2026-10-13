<?php
declare( strict_types=1 );
/**
 * Core subscription lifecycle: create-from-order, pause, resume, skip, cancel, expire, resubscribe.
 *
 * @package PureCart\Subscriptions
 */

namespace PureCart\Subscriptions;

use PureCart\Subscriptions\Repository\SubscriptionRepository;
use PureCart\Subscriptions\Repository\SubscriptionLogRepository;
use PureCart\Subscriptions\Billing\BillingClock;
use PureCart\Subscriptions\Product\SubscriptionProduct;

use PureCart\Settings\OptionKeys;
use PureCart\Settings\Settings;

defined( 'ABSPATH' ) || exit;

/**
 * Manages the full subscription lifecycle.
 *
 * Handles creation from a completed WooCommerce order, and every subsequent
 * state transition: pause, resume, skip, cancel (immediate or
 * pending_cancel), expiry, and resubscription. Each public method accepts
 * clean, validated arguments — security checks (nonce verification,
 * capability checks, ownership) are the responsibility of the calling
 * layer (REST controllers, customer portal), not this class.
 *
 * @since 1.0.0
 */
class SubscriptionManager {

	/**
	 * Subscription statuses from which a pause is permitted.
	 *
	 * @since 1.0.0
	 * @var string[]
	 */
	private const PAUSABLE_STATUSES = array( 'active', 'trialing' );

	/**
	 * Subscription statuses that represent a fully ended subscription.
	 *
	 * Cancel and resubscribe operations are no-ops for subscriptions already
	 * in one of these statuses without a fresh purchase.
	 *
	 * @since 1.0.0
	 * @var string[]
	 */
	private const ENDED_STATUSES = array( 'cancelled', 'expired' );

	/**
	 * Subscription repository for reading and writing subscription rows.
	 *
	 * @since 1.0.0
	 * @var SubscriptionRepository
	 */
	private SubscriptionRepository $subscriptions;

	/**
	 * Log repository for appending subscription event entries.
	 *
	 * @since 1.0.0
	 * @var SubscriptionLogRepository
	 */
	private SubscriptionLogRepository $logs;

	/**
	 * Instantiates the repositories and registers WordPress action hooks.
	 *
	 * @since 1.0.0
	 */
	public function __construct() {
		$this->subscriptions = new SubscriptionRepository();
		$this->logs          = new SubscriptionLogRepository();

		add_action( 'woocommerce_order_status_completed', array( $this, 'maybe_create_from_order' ) );
		add_action( 'purecart_finalize_pending_cancellation', array( $this, 'finalize_pending_cancellation' ) );
	}

	/**
	 * Creates a subscription record for every subscription-type line item on
	 * a completed order.
	 *
	 * Safe to call more than once for the same order — each item is guarded
	 * independently by find_by_order_and_product() to prevent duplicates.
	 *
	 * @since 1.0.0
	 * @param int $order_id WooCommerce order ID.
	 * @return void
	 */
	public function maybe_create_from_order( int $order_id ): void {
		$order = wc_get_order( $order_id );
		if ( ! $order ) {
			return;
		}

		foreach ( $order->get_items() as $item ) {
			/**
			 * @var \WC_Order_Item_Product $item
			 */
			$product = $item->get_product();
			if ( ! $product || SubscriptionProduct::TYPE !== $product->get_type() ) {
				continue;
			}

			$this->create_from_order_item( $order, $product );
		}
	}

	/**
	 * Create one subscription record from a single subscription-product line item.
	 *
	 * @since 1.0.0
	 * @param \WC_Order   $order   The completed order.
	 * @param \WC_Product $product The subscription product.
	 * @return object|null The created row, or null if it already existed / couldn't be created.
	 */
	private function create_from_order_item( \WC_Order $order, \WC_Product $product ): ?object {
		$order_id   = $order->get_id();
		$product_id = $product->get_id();

		// Idempotency — WooCommerce can fire the completed-status transition more
		// than once (manual admin re-save, a plugin re-triggering it, etc.).
		if ( $this->subscriptions->find_by_order_and_product( $order_id, $product_id ) ) {
			return null;
		}

		$user_id = (int) $order->get_customer_id();
		if ( $user_id <= 0 ) {
			// Guest checkout on a subscription product isn't supported yet — there's
			// no account to attach recurring billing/licenses/access to. Left an
			// order note rather than failing silently — this was previously a
			// silent no-op, which is exactly what made a real missing-customer
			// order look identical to a bug from the outside.
			$order->add_order_note(
				sprintf(
					/* translators: %s: product name */
					__( 'PureCart: no subscription was created for "%s" — this order has no registered customer account (guest checkout isn\'t supported for subscription products yet).', 'purecart' ),
					$product->get_name()
				)
			);
			return null;
		}

		$interval      = max( 1, (int) $product->get_meta( '_purecart_sub_interval' ) );
		$period        = $this->one_of( (string) $product->get_meta( '_purecart_sub_period' ), array( 'day', 'week', 'month', 'year' ), 'month' );
		$amount        = (float) wc_format_decimal( $product->get_meta( '_purecart_sub_price' ) );
		$signup_fee    = (float) wc_format_decimal( $product->get_meta( '_purecart_sub_signup_fee' ) );
		$length        = (int) $product->get_meta( '_purecart_sub_length' );
		$length_period = $this->one_of( (string) $product->get_meta( '_purecart_sub_length_period' ), array( 'month', 'year' ), 'month' );
		$delivery_type = (string) ( $product->get_meta( '_purecart_sub_delivery_type' ) ?: 'software' );

		$trial_length   = (int) $product->get_meta( '_purecart_sub_trial_length' );
		$trial_period   = $this->one_of( (string) $product->get_meta( '_purecart_sub_trial_period' ), array( 'day', 'week', 'month' ), 'day' );
		$trial_eligible = $trial_length > 0 && ! $this->has_used_trial( $user_id, $product_id );

		$now    = current_time( 'mysql' );
		$status = $trial_eligible ? 'trialing' : 'active';

		$trial_ends_at = $trial_eligible ? $this->add_interval( $now, $trial_length, $trial_period ) : null;

		$default_next_payment_at = $trial_eligible ? $trial_ends_at : $this->add_interval( $now, $interval, $period );

		/**
		 * Filters the subscription's first `next_payment_at` date.
		 *
		 * The default is the trial end date (when trialing) or now + one billing
		 * interval. RenewalSync hooks this filter to align the date to a fixed
		 * calendar day when the `purecart_sub_renewal_sync` setting is enabled.
		 *
		 * @since 1.0.0
		 * @param string $default_next_payment_at Trial end date, or now + one billing interval.
		 * @param int    $product_id              Subscription product ID.
		 * @param string $now                     MySQL datetime string at the moment of creation.
		 */
		$next_payment_at = apply_filters( 'purecart_initial_next_payment_at', $default_next_payment_at, $product_id, $now );
		$max_length_at   = $length > 0 ? $this->add_interval( $now, $length, $length_period ) : null;

		$subscription = $this->subscriptions->create(
			array(
				'user_id'          => $user_id,
				'product_id'       => $product_id,
				'order_id'         => $order_id,
				'delivery_type'    => $delivery_type,
				'status'           => $status,
				'billing_interval' => $interval,
				'billing_period'   => $period,
				'recurring_amount' => $amount,
				'currency'         => $order->get_currency(),
				'signup_fee'       => $signup_fee,
				'trial_ends_at'    => $trial_ends_at,
				'next_payment_at'  => $next_payment_at,
				'max_length_at'    => $max_length_at,
				'starts_at'        => $now,
			)
		);

		if ( ! $subscription ) {
			return null;
		}

		if ( $trial_eligible ) {
			update_user_meta( $user_id, '_purecart_trial_used_' . $product_id, 1 );
		}

		$activation_data = array(
			'order_id'      => $order_id,
			'user_id'       => $user_id,
			'product_id'    => $product_id,
			'delivery_type' => $delivery_type,
		);

		/**
		 * Filters whether to provision delivery access immediately on subscription creation.
		 *
		 * Defaults to true. SplitPaymentManager returns false when the product's
		 * `_purecart_access_timing` is set to `after_full_payment`, deferring
		 * access until the final installment is collected.
		 *
		 * @since 1.0.0
		 * @param bool                 $should_activate Whether to activate now. Default true.
		 * @param array<string, mixed> $activation_data Activation context passed to DeliveryManager::activate().
		 */
		if ( apply_filters( 'purecart_should_activate_delivery', true, $activation_data ) ) {
			$linked = DeliveryManager::activate( $activation_data );

			if ( ! empty( array_filter( $linked ) ) ) {
				$this->subscriptions->update( (int) $subscription->id, $linked );
			}
		}

		$this->logs->log(
			(int) $subscription->id,
			'created',
			array(
				'new_status' => $status,
				'order_id'   => $order_id,
			)
		);

		do_action( 'purecart_subscription_activated', (int) $subscription->id );

		return $this->subscriptions->find( (int) $subscription->id );
	}

	/**
	 * Whether this customer has already used their one trial for a product.
	 *
	 * @since 1.0.0
	 * @param int $user_id    WordPress user ID.
	 * @param int $product_id WooCommerce product ID.
	 * @return bool
	 */
	private function has_used_trial( int $user_id, int $product_id ): bool {
		if ( ! (bool) Settings::get( OptionKeys::SUB_ONE_TRIAL_PER_CUSTOMER, true ) ) {
			return false;
		}

		return (bool) get_user_meta( $user_id, '_purecart_trial_used_' . $product_id, true );
	}

	/**
	 * Pause billing while keeping access. `next_payment_at` is advanced by
	 * exactly the pause duration on resume(), so the customer never loses
	 * time they already paid for.
	 *
	 * @since 1.0.0
	 * @param int         $subscription_id Subscription row ID.
	 * @param string|null $resume_at       Optional scheduled auto-resume date (MySQL datetime); null = indefinite, manual resume only.
	 * @return bool
	 */
	public function pause( int $subscription_id, ?string $resume_at = null ): bool {
		$subscription = $this->subscriptions->find( $subscription_id );
		if ( ! $subscription || ! in_array( $subscription->status, self::PAUSABLE_STATUSES, true ) ) {
			return false;
		}

		$updated = $this->subscriptions->update(
			$subscription_id,
			array(
				'status'         => 'paused',
				'paused_at'      => current_time( 'mysql' ),
				'pause_end_date' => $resume_at,
			)
		);

		if ( $updated ) {
			$this->log_transition( $subscription_id, $subscription->status, 'paused', 'paused' );
		}

		return $updated;
	}

	/**
	 * Resume a paused subscription.
	 *
	 * @since 1.0.0
	 * @param int $subscription_id Subscription row ID.
	 * @return bool
	 */
	public function resume( int $subscription_id ): bool {
		$subscription = $this->subscriptions->find( $subscription_id );
		if ( ! $subscription || 'paused' !== $subscription->status ) {
			return false;
		}

		$now            = current_time( 'mysql' );
		$paused_seconds = $subscription->paused_at ? max( 0, $this->to_dt( $now )->getTimestamp() - $this->to_dt( $subscription->paused_at )->getTimestamp() ) : 0;

		$next_payment_at = $subscription->next_payment_at
			? $this->to_dt( $subscription->next_payment_at )->modify( "+{$paused_seconds} seconds" )->format( 'Y-m-d H:i:s' )
			: $now;

		$updated = $this->subscriptions->update(
			$subscription_id,
			array(
				'status'          => 'active',
				'paused_at'       => null,
				'pause_end_date'  => null,
				'next_payment_at' => $next_payment_at,
			)
		);

		if ( $updated ) {
			$this->log_transition( $subscription_id, 'paused', 'active', 'resumed' );
		}

		return $updated;
	}

	/**
	 * Skips the next renewal by advancing `next_payment_at` one billing
	 * interval with no charge.
	 *
	 * Enforces the skip limit configured via the `purecart_sub_skip_limit`
	 * setting. Fires the `purecart_subscription_skipped` action on success.
	 *
	 * @since 1.0.0
	 * @param int $subscription_id Subscription row ID.
	 * @return bool True on success, false when the subscription is not skippable
	 *              or the skip limit has been reached.
	 */
	public function skip( int $subscription_id ): bool {
		$subscription = $this->subscriptions->find( $subscription_id );
		if ( ! $subscription || ! in_array( $subscription->status, array( 'active', 'trialing' ), true ) ) {
			return false;
		}

		// `purecart_sub_skip_limit` (default 1) is documented as a *per billing
		// year* cap — a true rolling 12-month window needs a dated log of past
		// skips to check against, which doesn't exist yet. Simplified here to a
		// lifetime cap on `skip_count` instead; noted rather than silently
		// built "wrong" — revisit if/when per-year enforcement is actually needed.
		$limit = (int) Settings::get( OptionKeys::SUB_SKIP_LIMIT, 1 );
		if ( $limit > 0 && (int) $subscription->skip_count >= $limit ) {
			return false;
		}

		$anchor          = $subscription->next_payment_at ?: current_time( 'mysql' );
		$next_payment_at = $this->add_interval( $anchor, (int) $subscription->billing_interval, $subscription->billing_period );

		$updated = $this->subscriptions->update(
			$subscription_id,
			array(
				'next_payment_at' => $next_payment_at,
				'skip_count'      => (int) $subscription->skip_count + 1,
			)
		);

		if ( $updated ) {
			$this->logs->log( $subscription_id, 'skipped', array( 'note' => 'next cycle skipped, no charge' ) );
			do_action( 'purecart_subscription_skipped', $subscription_id );
		}

		return $updated;
	}

	/**
	 * Cancel a subscription, either immediately or at the end of the period
	 * already paid for.
	 *
	 * @since 1.0.0
	 * @param int         $subscription_id Subscription row ID.
	 * @param bool        $immediately     True = cancel now; false = pending_cancel until the current period ends.
	 * @param string|null $reason          Optional customer-supplied cancellation reason, stored on the log entry.
	 * @return bool
	 */
	public function cancel( int $subscription_id, bool $immediately = true, ?string $reason = null ): bool {
		$subscription = $this->subscriptions->find( $subscription_id );
		if ( ! $subscription || in_array( $subscription->status, self::ENDED_STATUSES, true ) ) {
			return false;
		}

		if ( $immediately ) {
			$updated = $this->subscriptions->update(
				$subscription_id,
				array(
					'status'       => 'cancelled',
					'cancelled_at' => current_time( 'mysql' ),
				)
			);

			if ( $updated ) {
				DeliveryManager::deactivate( (array) $subscription, DeliveryManager::REASON_CANCELLED );
				$this->log_transition( $subscription_id, $subscription->status, 'cancelled', 'cancelled', $reason );
			}

			return $updated;
		}

		// Pending cancellation — access continues until the period already paid for ends.
		$cancellation_date = $subscription->next_payment_at ?: current_time( 'mysql' );

		$updated = $this->subscriptions->update(
			$subscription_id,
			array(
				'status'            => 'pending_cancel',
				'cancellation_date' => $cancellation_date,
			)
		);

		if ( $updated ) {
			as_schedule_single_action(
				$this->to_dt( $cancellation_date )->getTimestamp(),
				'purecart_finalize_pending_cancellation',
				array( $subscription_id ),
				'purecart'
			);

			$this->log_transition( $subscription_id, $subscription->status, 'pending_cancel', 'cancellation_scheduled', $reason );
		}

		return $updated;
	}

	/**
	 * Action Scheduler callback: turn a pending_cancel subscription into a
	 * hard cancellation once the paid-for period actually ends.
	 *
	 * @since 1.0.0
	 * @param int $subscription_id Subscription row ID.
	 * @return void
	 */
	public function finalize_pending_cancellation( int $subscription_id ): void {
		$subscription = $this->subscriptions->find( $subscription_id );
		if ( ! $subscription || 'pending_cancel' !== $subscription->status ) {
			return;
		}

		$updated = $this->subscriptions->update(
			$subscription_id,
			array(
				'status'       => 'cancelled',
				'cancelled_at' => current_time( 'mysql' ),
			)
		);

		if ( $updated ) {
			DeliveryManager::deactivate( (array) $subscription, DeliveryManager::REASON_CANCELLED );
			$this->log_transition( $subscription_id, 'pending_cancel', 'cancelled', 'cancelled' );
		}
	}

	/**
	 * Marks a fixed-length subscription as expired once it reaches its
	 * `max_length_at` date.
	 *
	 * Determines *when* to call this method is RenewalEngine's responsibility.
	 * This method performs only the status transition and deactivates delivery.
	 *
	 * @since 1.0.0
	 * @param int $subscription_id Subscription row ID.
	 * @return bool True on success, false when the subscription is already ended.
	 */
	public function expire( int $subscription_id ): bool {
		$subscription = $this->subscriptions->find( $subscription_id );
		if ( ! $subscription || in_array( $subscription->status, self::ENDED_STATUSES, true ) ) {
			return false;
		}

		$updated = $this->subscriptions->update( $subscription_id, array( 'status' => 'expired' ) );

		if ( $updated ) {
			DeliveryManager::deactivate( (array) $subscription, DeliveryManager::REASON_EXPIRED );
			$this->log_transition( $subscription_id, $subscription->status, 'expired', 'expired' );
		}

		return $updated;
	}

	/**
	 * Resubscribes a cancelled or expired subscription.
	 *
	 * Within the admin-configured reactivation window (`SUB_RESUBSCRIBE_WINDOW_DAYS`,
	 * default 30 days), the same record is reactivated so that payment history,
	 * event log, and lifetime value remain continuous. After the window, a new
	 * record is created and linked back via `previous_subscription_id`, with
	 * trial eligibility re-evaluated.
	 *
	 * @since 1.0.0
	 * @param int $subscription_id Subscription row ID.
	 * @return object|null The reactivated or newly created subscription row, or null on failure.
	 */
	public function resubscribe( int $subscription_id ): ?object {
		$subscription = $this->subscriptions->find( $subscription_id );
		if ( ! $subscription || ! in_array( $subscription->status, self::ENDED_STATUSES, true ) ) {
			return null;
		}

		$window_days = (int) Settings::get( OptionKeys::SUB_RESUBSCRIBE_WINDOW_DAYS, 30 );

		$now           = current_time( 'mysql' );
		$ended_at      = $subscription->cancelled_at ?: $subscription->updated_at;
		$within_window = $ended_at && ( $this->to_dt( $now )->getTimestamp() - $this->to_dt( $ended_at )->getTimestamp() ) <= $window_days * DAY_IN_SECONDS;

		$next_payment_at = $this->add_interval( $now, (int) $subscription->billing_interval, $subscription->billing_period );

		if ( $within_window ) {
			$updated = $this->subscriptions->update(
				$subscription_id,
				array(
					'status'            => 'active',
					'cancelled_at'      => null,
					'cancellation_date' => null,
					'next_payment_at'   => $next_payment_at,
				)
			);

			if ( ! $updated ) {
				return null;
			}

			DeliveryManager::reactivate( (array) $subscription );
			$this->log_transition( $subscription_id, $subscription->status, 'active', 'resubscribed', 'same_record' );
			do_action( 'purecart_subscription_resubscribed', $subscription_id );

			return $this->subscriptions->find( $subscription_id );
		}

		// After the window — new record, linked back, trial re-checked.
		$trial_eligible = ! $this->has_used_trial( (int) $subscription->user_id, (int) $subscription->product_id );

		$new = $this->subscriptions->create(
			array(
				'user_id'                  => $subscription->user_id,
				'product_id'               => $subscription->product_id,
				'order_id'                 => $subscription->order_id,
				'delivery_type'            => $subscription->delivery_type,
				'status'                   => $trial_eligible ? 'trialing' : 'active',
				'billing_interval'         => $subscription->billing_interval,
				'billing_period'           => $subscription->billing_period,
				'recurring_amount'         => $subscription->recurring_amount,
				'currency'                 => $subscription->currency,
				'next_payment_at'          => $next_payment_at,
				'starts_at'                => $now,
				'previous_subscription_id' => $subscription->id,
			)
		);

		if ( ! $new ) {
			return null;
		}

		// New record = new provisioning (new license key / new SaaS account),
		// same reasoning as create_from_order_item() — not reactivate().
		DeliveryManager::activate( (array) $new );
		$this->logs->log(
			(int) $new->id,
			'resubscribed',
			array( 'note' => 'New record linked via previous_subscription_id=' . $subscription->id )
		);
		do_action( 'purecart_subscription_activated', (int) $new->id );
		// Fires separately from purecart_subscription_activated so resubscription
		// emails are not also sent for every brand-new, never-cancelled subscription.
		do_action( 'purecart_subscription_resubscribed', (int) $new->id );

		return $this->subscriptions->find( (int) $new->id );
	}

	/**
	 * Logs a status transition and fires the `purecart_subscription_status_changed` hook.
	 *
	 * Dispatches the subscription ID only, so listeners always load fresh
	 * state rather than relying on a snapshot that may already be stale.
	 *
	 * @since 1.0.0
	 * @param int         $subscription_id Subscription row ID.
	 * @param string      $old_status      Status before the transition.
	 * @param string      $new_status      Status after the transition.
	 * @param string      $event           Log event slug.
	 * @param string|null $note            Optional note (e.g. a cancellation reason).
	 * @return void
	 */
	private function log_transition( int $subscription_id, string $old_status, string $new_status, string $event, ?string $note = null ): void {
		$this->logs->log(
			$subscription_id,
			$event,
			array(
				'old_status' => $old_status,
				'new_status' => $new_status,
				'note'       => $note,
			)
		);

		do_action( 'purecart_subscription_status_changed', $subscription_id, $old_status, $new_status );
	}

	/**
	 * Returns `$value` if it is in `$allowed`, otherwise returns `$default`.
	 *
	 * Used to validate product-meta period/unit strings before they reach
	 * date arithmetic or database queries.
	 *
	 * @since 1.0.0
	 * @param string   $value   Candidate value.
	 * @param string[] $allowed Accepted values.
	 * @param string   $default Fallback returned when `$value` is not in `$allowed`.
	 * @return string
	 */
	private function one_of( string $value, array $allowed, string $default ): string {
		return in_array( $value, $allowed, true ) ? $value : $default;
	}

	/**
	 * Parses a MySQL datetime string into a timezone-safe DateTimeImmutable.
	 *
	 * Delegates to BillingClock::to_dt(), which handles WordPress timezone
	 * offsets that plain `strtotime()` would misinterpret.
	 *
	 * @since 1.0.0
	 * @see   BillingClock::to_dt()
	 * @param string $mysql_datetime A `current_time('mysql')`-style datetime string.
	 * @return \DateTimeImmutable
	 */
	private function to_dt( string $mysql_datetime ): \DateTimeImmutable {
		return BillingClock::to_dt( $mysql_datetime );
	}

	/**
	 * Adds a billing interval to a MySQL datetime string.
	 *
	 * Delegates to BillingClock::add_interval(), which applies month-overflow
	 * clamping so dates like February 30 resolve correctly.
	 *
	 * @since 1.0.0
	 * @see   BillingClock::add_interval()
	 * @param string $datetime A `current_time('mysql')`-style datetime string.
	 * @param int    $count    Number of periods to add.
	 * @param string $unit     One of 'day', 'week', 'month', or 'year'.
	 * @return string MySQL datetime string with the interval applied.
	 */
	private function add_interval( string $datetime, int $count, string $unit ): string {
		return BillingClock::add_interval( $datetime, $count, $unit );
	}
}
