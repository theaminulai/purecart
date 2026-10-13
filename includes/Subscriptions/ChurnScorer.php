<?php
declare( strict_types=1 );
/**
 * Computes and updates the churn risk score (0-100) and projected customer
 * LTV on subscription lifecycle/payment events.
 *
 * @package PureCart\Subscriptions
 */

namespace PureCart\Subscriptions;

use PureCart\Subscriptions\Repository\SubscriptionRepository;
use PureCart\Subscriptions\Repository\SubscriptionLogRepository;

use PureCart\Settings\OptionKeys;
use PureCart\Settings\Settings;

defined( 'ABSPATH' ) || exit;

/**
 * Churn risk score deltas and bands:
 *
 *   Increases: payment_failed (+20 first failure, +10/retry) ·
 *              cancellation (+30) · skip_next_cycle (+5) · pause (+10)
 *   Decreases: payment_success (-15, floor 0) · every 12 renewals (-5)
 *   Bands:     0-25 Low · 26-50 Medium · 51-75 High · 76-100 Critical
 *
 * LTV formula:
 *   monthly_equivalent = billing_amount normalized to a monthly rate
 *   ltv = monthly_equivalent × purecart_sub_avg_lifetime_months (default 24)
 *
 * Note: the +30 cancellation delta currently applies to any cancellation
 * regardless of who triggered it (customer vs. admin), because no hook in
 * this codebase yet carries actor context. A future refinement can split this
 * once cancellation actor is threaded through.
 *
 * @since 1.0.0
 */
class ChurnScorer {

	/**
	 * Upper boundary of the low churn risk band — checklist requires these exact numbers.
	 *
	 * @since 1.0.0
	 * @var int
	 */
	private const BAND_LOW    = 25;

	/**
	 * Upper boundary of the medium churn risk band.
	 *
	 * @since 1.0.0
	 * @var int
	 */
	private const BAND_MEDIUM = 50;

	/**
	 * Upper boundary of the high churn risk band.
	 *
	 * @since 1.0.0
	 * @var int
	 */
	private const BAND_HIGH   = 75;

	/**
	 * Subscription repository for reading and updating subscription rows.
	 *
	 * @since 1.0.0
	 * @var SubscriptionRepository
	 */
	private SubscriptionRepository $subscriptions;

	/**
	 * Log repository for recording churn score change entries.
	 *
	 * @since 1.0.0
	 * @var SubscriptionLogRepository
	 */
	private SubscriptionLogRepository $logs;

	/**
	 * @since 1.0.0
	 */
	public function __construct() {
		$this->subscriptions = new SubscriptionRepository();
		$this->logs          = new SubscriptionLogRepository();

		add_action( 'purecart_subscription_activated', array( $this, 'on_activated' ) );
		add_action( 'purecart_subscription_renewed', array( $this, 'on_payment_success' ) );
		add_action( 'purecart_subscription_payment_failed', array( $this, 'on_payment_failed' ) );
		add_action( 'purecart_subscription_status_changed', array( $this, 'on_status_changed' ), 10, 3 );
		add_action( 'purecart_subscription_skipped', array( $this, 'on_skipped' ) );

		// The purecart_subscription_plan_changed action is fired by PlanUpgrade
		// after updating recurring_amount. This listener is registered now so
		// LTV recalculates on plan change without requiring any future changes
		// to this class.
		add_action( 'purecart_subscription_plan_changed', array( $this, 'on_plan_changed' ) );
	}

	/* Event handlers */

	/**
	 * Seeds the initial LTV projection when a subscription first activates.
	 *
	 * Sets `customer_ltv` on the subscription record. Placed here rather than
	 * in SubscriptionManager because this is where the LTV formula lives.
	 *
	 * @since 1.0.0
	 * @param int $subscription_id Subscription row ID.
	 * @return void
	 */
	public function on_activated( int $subscription_id ): void {
		$subscription = $this->subscriptions->find( $subscription_id );
		if ( $subscription ) {
			$this->recalculate_ltv( $subscription );
		}
	}

	/**
	 * Decrements the churn score on a successful renewal and recalculates LTV.
	 *
	 * @since 1.0.0
	 * @param int $subscription_id Subscription row ID.
	 * @return void
	 */
	public function on_payment_success( int $subscription_id ): void {
		$subscription = $this->subscriptions->find( $subscription_id );
		if ( ! $subscription ) {
			return;
		}

		$delta = -15;

		// "every 12 renewals" — renewal_count was already incremented by
		// RenewalEngine::complete_renewal() before this hook fires, so a
		// fresh multiple of 12 here means the 12th/24th/36th/... renewal just happened.
		if ( (int) $subscription->renewal_count > 0 && 0 === (int) $subscription->renewal_count % 12 ) {
			$delta -= 5;
		}

		$this->adjust( $subscription, $delta, 'payment_success' );
		$this->recalculate_ltv( $subscription );
	}

	/**
	 * Increments the churn score on a failed payment, with a larger delta for first failures.
	 *
	 * @since 1.0.0
	 * @param int $subscription_id Subscription row ID.
	 * @return void
	 */
	public function on_payment_failed( int $subscription_id ): void {
		$subscription = $this->subscriptions->find( $subscription_id );
		if ( ! $subscription ) {
			return;
		}

		// retry_count was already incremented (by RenewalEngine::mark_failed())
		// before this hook fires: 1 means this was the first failure this
		// cycle, anything higher means it's a dunning retry that also failed.
		$delta = (int) $subscription->retry_count > 1 ? 10 : 20;

		$this->adjust( $subscription, $delta, 'payment_failed' );
	}

	/**
	 * Adjusts the churn score when a subscription is paused or cancelled.
	 *
	 * @since 1.0.0
	 * @param int         $subscription_id Subscription row ID.
	 * @param string|null $old_status      Status before the transition.
	 * @param string      $new_status      Status after the transition.
	 * @return void
	 */
	public function on_status_changed( int $subscription_id, ?string $old_status, string $new_status ): void {
		$subscription = $this->subscriptions->find( $subscription_id );
		if ( ! $subscription ) {
			return;
		}

		if ( 'paused' === $new_status ) {
			$this->adjust( $subscription, 10, 'paused' );
			return;
		}

		// pending_cancel -> cancelled is the scheduled *finalization* of an
		// already-scored cancellation intent (scored when it first went to
		// pending_cancel) — don't double-count it as a second cancellation.
		if ( 'pending_cancel' === $new_status || ( 'cancelled' === $new_status && 'pending_cancel' !== $old_status ) ) {
			$this->adjust( $subscription, 30, 'cancelled' );
		}
	}

	/**
	 * Increments the churn score slightly when a customer skips a billing cycle.
	 *
	 * @since 1.0.0
	 * @param int $subscription_id Subscription row ID.
	 * @return void
	 */
	public function on_skipped( int $subscription_id ): void {
		$subscription = $this->subscriptions->find( $subscription_id );
		if ( $subscription ) {
			$this->adjust( $subscription, 5, 'skip_next_cycle' );
		}
	}

	/**
	 * Recalculates the LTV projection when a subscription's plan changes.
	 *
	 * @since 1.0.0
	 * @param int $subscription_id Subscription row ID.
	 * @return void
	 */
	public function on_plan_changed( int $subscription_id ): void {
		$subscription = $this->subscriptions->find( $subscription_id );
		if ( $subscription ) {
			$this->recalculate_ltv( $subscription );
		}
	}

	/* Scoring */

	/**
	 * Apply a score delta, clamped to [0, 100], and log the change.
	 *
	 * @since 1.0.0
	 * @param object $subscription Subscription row.
	 * @param int    $delta        Signed score change.
	 * @param string $reason       Reason slug, stored on the log entry.
	 * @return void
	 */
	private function adjust( object $subscription, int $delta, string $reason ): void {
		$before = (int) $subscription->churn_risk_score;
		$after  = max( 0, min( 100, $before + $delta ) );

		if ( $after === $before ) {
			return;
		}

		$this->subscriptions->update( (int) $subscription->id, array( 'churn_risk_score' => $after ) );

		$this->logs->log(
			(int) $subscription->id,
			'churn_score_updated',
			array( 'note' => "{$reason}: {$before} -> {$after} ({$delta}, band: " . self::band( $after ) . ')' )
		);
	}

	/**
	 * Maps a churn risk score to its named band.
	 *
	 * Band boundaries (25 / 50 / 75) mirror the values used by the admin
	 * Subscriptions list to color-code the churn column.
	 *
	 * @since 1.0.0
	 * @param int $score Churn risk score, 0-100.
	 * @return string One of 'low', 'medium', 'high', 'critical'.
	 */
	public static function band( int $score ): string {
		if ( $score <= self::BAND_LOW ) {
			return 'low';
		}
		if ( $score <= self::BAND_MEDIUM ) {
			return 'medium';
		}
		if ( $score <= self::BAND_HIGH ) {
			return 'high';
		}
		return 'critical';
	}

	/* LTV */

	/**
	 * Recalculate and persist the projected customer LTV.
	 *
	 * @since 1.0.0
	 * @param object $subscription Subscription row.
	 * @return void
	 */
	private function recalculate_ltv( object $subscription ): void {
		$monthly_equivalent = self::to_monthly_equivalent(
			(float) $subscription->recurring_amount,
			(int) $subscription->billing_interval,
			(string) $subscription->billing_period
		);

		$avg_lifetime_months = (int) Settings::get( OptionKeys::SUB_AVG_LIFETIME_MONTHS, 24 );
		$ltv                 = $monthly_equivalent * $avg_lifetime_months;

		$this->subscriptions->update( (int) $subscription->id, array( 'customer_ltv' => round( $ltv, 2 ) ) );
	}

	/**
	 * Normalizes a recurring billing amount to its monthly-equivalent rate.
	 *
	 * Shared between LTV projection and MRR reporting so both figures use
	 * exactly the same normalization logic and can never drift apart.
	 *
	 * @since 1.0.0
	 * @param float  $amount   Recurring amount per billing_interval.
	 * @param int    $interval Billing interval count.
	 * @param string $period   One of 'day', 'week', 'month', 'year'.
	 * @return float
	 */
	public static function to_monthly_equivalent( float $amount, int $interval, string $period ): float {
		$interval = max( 1, $interval );

		switch ( $period ) {
			case 'day':
				return $amount / $interval * ( 365 / 12 );
			case 'week':
				return $amount / $interval * ( 52 / 12 );
			case 'year':
				return $amount / ( $interval * 12 );
			case 'month':
			default:
				return $amount / $interval;
		}
	}
}
