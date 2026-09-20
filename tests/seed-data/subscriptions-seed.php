<?php
/**
 * Test data for the Subscriptions module: subscriptions + line items +
 * linked delivery entities + event log + payment ledger + recognized
 * revenue ledger + one revenue goal.
 *
 * Five scenarios, one per lifecycle state that the admin SPA and the
 * dunning/retention logic branch on: trialing, healthy active, past_due
 * (mid-dunning retry), customer-paused, and cancelled (churn).
 *
 * @package PureCart\Tests
 */

defined( 'ABSPATH' ) || exit;

/**
 * Seed every Subscriptions-module table.
 *
 * @return array<string, int> scenario label => subscription id.
 */
function purecart_seed_subscriptions(): array {
	global $wpdb;

	$subs_table     = $wpdb->prefix . 'purecart_subscriptions';
	$items_table    = $wpdb->prefix . 'purecart_subscription_items';
	$linked_table   = $wpdb->prefix . 'purecart_subscription_linked_entities';
	$logs_table     = $wpdb->prefix . 'purecart_subscription_logs';
	$payments_table = $wpdb->prefix . 'purecart_subscription_payments';
	$revenue_table  = $wpdb->prefix . 'purecart_subscription_revenue';
	$goals_table    = $wpdb->prefix . 'purecart_revenue_goals';

	$scenarios = array(
		// Free-trial subscriber, trial ends in 5 days, nothing charged yet.
		'trialing'  => array(
			'user_id'          => PURECART_SEED_USER_ERIN,
			'order_id'         => 91001,
			'status'           => 'trialing',
			'billing_interval' => 1,
			'billing_period'   => 'month',
			'recurring_amount' => 29.00,
			'trial_ends_at'    => gmdate( 'Y-m-d H:i:s', strtotime( '+5 days' ) ),
			'next_payment_at'  => gmdate( 'Y-m-d H:i:s', strtotime( '+5 days' ) ),
			'gateway'          => 'stripe',
			'gateway_sub_id'   => 'sub_test_trial_erin',
			'starts_at'        => gmdate( 'Y-m-d H:i:s', strtotime( '-9 days' ) ),
			'payments'         => array(),
			'log_event'        => 'trial_started',
		),
		// Healthy, paying monthly, two completed renewals on record.
		'active'    => array(
			'user_id'          => PURECART_SEED_USER_ALICE,
			'order_id'         => 91002,
			'status'           => 'active',
			'billing_interval' => 1,
			'billing_period'   => 'month',
			'recurring_amount' => 49.00,
			'next_payment_at'  => gmdate( 'Y-m-d H:i:s', strtotime( '+18 days' ) ),
			'last_payment_at'  => gmdate( 'Y-m-d H:i:s', strtotime( '-12 days' ) ),
			'gateway'          => 'stripe',
			'gateway_sub_id'   => 'sub_test_active_alice',
			'starts_at'        => gmdate( 'Y-m-d H:i:s', strtotime( '-4 months' ) ),
			'payments'         => array(
				array(
					'status'   => 'completed',
					'amount'   => 49.00,
					'days_ago' => 42,
				),
				array(
					'status'   => 'completed',
					'amount'   => 49.00,
					'days_ago' => 12,
				),
			),
			'log_event'        => 'renewed',
		),
		// Failed payment, mid-dunning retry — the retention/dunning path.
		'past_due'  => array(
			'user_id'          => PURECART_SEED_USER_BOB,
			'order_id'         => 91003,
			'status'           => 'past_due',
			'billing_interval' => 1,
			'billing_period'   => 'month',
			'recurring_amount' => 49.00,
			'retry_count'      => 2,
			'next_payment_at'  => gmdate( 'Y-m-d H:i:s', strtotime( '+2 days' ) ),
			'last_payment_at'  => gmdate( 'Y-m-d H:i:s', strtotime( '-33 days' ) ),
			'gateway'          => 'stripe',
			'gateway_sub_id'   => 'sub_test_pastdue_bob',
			'starts_at'        => gmdate( 'Y-m-d H:i:s', strtotime( '-2 months' ) ),
			'payments'         => array(
				array(
					'status'   => 'completed',
					'amount'   => 49.00,
					'days_ago' => 63,
				),
				array(
					'status'   => 'failed',
					'amount'   => 49.00,
					'days_ago' => 3,
				),
			),
			'log_event'        => 'payment_failed',
		),
		// Customer-paused, resumes in 20 days.
		'paused'    => array(
			'user_id'          => PURECART_SEED_USER_CAROL,
			'order_id'         => 91004,
			'status'           => 'paused',
			'billing_interval' => 1,
			'billing_period'   => 'month',
			'recurring_amount' => 19.00,
			'paused_at'        => gmdate( 'Y-m-d H:i:s', strtotime( '-10 days' ) ),
			'pause_end_date'   => gmdate( 'Y-m-d H:i:s', strtotime( '+20 days' ) ),
			'gateway'          => 'paypal',
			'gateway_sub_id'   => 'sub_test_paused_carol',
			'starts_at'        => gmdate( 'Y-m-d H:i:s', strtotime( '-3 months' ) ),
			'payments'         => array(
				array(
					'status'   => 'completed',
					'amount'   => 19.00,
					'days_ago' => 40,
				),
			),
			'log_event'        => 'paused',
		),
		// Cancelled — churn/retention reporting.
		'cancelled' => array(
			'user_id'           => PURECART_SEED_USER_DAVE,
			'order_id'          => 91005,
			'status'            => 'cancelled',
			'billing_interval'  => 1,
			'billing_period'    => 'year',
			'recurring_amount'  => 199.00,
			'cancelled_at'      => gmdate( 'Y-m-d H:i:s', strtotime( '-5 days' ) ),
			'cancellation_date' => gmdate( 'Y-m-d H:i:s', strtotime( '-5 days' ) ),
			'gateway'           => 'stripe',
			'gateway_sub_id'    => 'sub_test_cancelled_dave',
			'starts_at'         => gmdate( 'Y-m-d H:i:s', strtotime( '-14 months' ) ),
			'payments'          => array(
				array(
					'status'   => 'completed',
					'amount'   => 199.00,
					'days_ago' => 370,
				),
			),
			'log_event'         => 'cancelled',
		),
	);

	$ids = array();

	foreach ( $scenarios as $label => $s ) {
		$wpdb->delete( $subs_table, array( 'gateway_subscription_id' => $s['gateway_sub_id'] ), array( '%s' ) );

		$wpdb->insert(
			$subs_table,
			array(
				'user_id'                 => $s['user_id'],
				'product_id'              => PURECART_SEED_PRODUCT_SUB,
				'order_id'                => $s['order_id'],
				'delivery_type'           => 'software',
				'status'                  => $s['status'],
				'billing_interval'        => $s['billing_interval'],
				'billing_period'          => $s['billing_period'],
				'recurring_amount'        => $s['recurring_amount'],
				'currency'                => 'USD',
				'trial_ends_at'           => $s['trial_ends_at'] ?? null,
				'next_payment_at'         => $s['next_payment_at'] ?? null,
				'last_payment_at'         => $s['last_payment_at'] ?? null,
				'paused_at'               => $s['paused_at'] ?? null,
				'pause_end_date'          => $s['pause_end_date'] ?? null,
				'cancelled_at'            => $s['cancelled_at'] ?? null,
				'cancellation_date'       => $s['cancellation_date'] ?? null,
				'gateway'                 => $s['gateway'],
				'gateway_subscription_id' => $s['gateway_sub_id'],
				'retry_count'             => $s['retry_count'] ?? 0,
				'starts_at'               => $s['starts_at'],
				'created_at'              => $s['starts_at'],
				'updated_at'              => current_time( 'mysql' ),
			),
			array(
				'%d',
				'%d',
				'%d',
				'%s',
				'%s',
				'%d',
				'%s',
				'%f',
				'%s',
				'%s',
				'%s',
				'%s',
				'%s',
				'%s',
				'%s',
				'%s',
				'%s',
				'%s',
				'%d',
				'%s',
				'%s',
				'%s',
			)
		);

		$subscription_id = (int) $wpdb->insert_id;
		$ids[ $label ]   = $subscription_id;

		$wpdb->delete( $items_table, array( 'subscription_id' => $subscription_id ), array( '%d' ) );
		$wpdb->insert(
			$items_table,
			array(
				'subscription_id' => $subscription_id,
				'product_id'      => PURECART_SEED_PRODUCT_SUB,
				'qty'             => 1,
				'line_subtotal'   => $s['recurring_amount'],
				'line_total'      => $s['recurring_amount'],
				'delivery_type'   => 'software',
			),
			array( '%d', '%d', '%d', '%f', '%f', '%s' )
		);

		$wpdb->delete( $linked_table, array( 'subscription_id' => $subscription_id ), array( '%d' ) );
		$wpdb->insert(
			$linked_table,
			array(
				'subscription_id'      => $subscription_id,
				'delivery_type'        => 'software',
				'downloads_this_cycle' => wp_rand( 0, 5 ),
				'download_limit'       => 10,
				'created_at'           => current_time( 'mysql' ),
				'updated_at'           => current_time( 'mysql' ),
			),
			array( '%d', '%s', '%d', '%d', '%s', '%s' )
		);

		$wpdb->delete( $logs_table, array( 'subscription_id' => $subscription_id ), array( '%d' ) );
		$wpdb->insert(
			$logs_table,
			array(
				'subscription_id' => $subscription_id,
				'event'           => $s['log_event'],
				'new_status'      => $s['status'],
				'actor_type'      => 'system',
				'actor_id'        => 0,
				'created_at'      => current_time( 'mysql' ),
			),
			array( '%d', '%s', '%s', '%s', '%d', '%s' )
		);

		foreach ( $s['payments'] as $i => $payment ) {
			$transaction_id = 'txn_test_' . $label . '_' . $i;
			$wpdb->delete( $payments_table, array( 'transaction_id' => $transaction_id ), array( '%s' ) );
			$wpdb->insert(
				$payments_table,
				array(
					'subscription_id' => $subscription_id,
					'order_id'        => $s['order_id'],
					'transaction_id'  => $transaction_id,
					'amount'          => $payment['amount'],
					'currency'        => 'USD',
					'status'          => $payment['status'],
					'created_at'      => gmdate( 'Y-m-d H:i:s', strtotime( "-{$payment['days_ago']} days" ) ),
				),
				array( '%d', '%d', '%s', '%f', '%s', '%s', '%s' )
			);

			if ( 'completed' === $payment['status'] ) {
				$period_start = gmdate( 'Y-m-d', strtotime( "-{$payment['days_ago']} days" ) );
				$period_end   = gmdate( 'Y-m-d', strtotime( $period_start . ' +1 month' ) );
				$revenue_txn  = 'rev_test_' . $label . '_' . $i;

				$wpdb->delete( $revenue_table, array( 'transaction_id' => $revenue_txn ), array( '%s' ) );
				$wpdb->insert(
					$revenue_table,
					array(
						'subscription_id' => $subscription_id,
						'amount'          => $payment['amount'],
						'currency'        => 'USD',
						'billing_period'  => $s['billing_period'],
						'period_start'    => $period_start,
						'period_end'      => $period_end,
						'transaction_id'  => $revenue_txn,
						'gateway'         => $s['gateway'],
						'created_at'      => gmdate( 'Y-m-d H:i:s', strtotime( "-{$payment['days_ago']} days" ) ),
					),
					array( '%d', '%f', '%s', '%s', '%s', '%s', '%s', '%s', '%s' )
				);
			}
		}
	}

	// One active revenue goal for the admin analytics page.
	$wpdb->delete( $goals_table, array( 'name' => 'PureCart Test — Q3 MRR target' ), array( '%s' ) );
	$wpdb->insert(
		$goals_table,
		array(
			'name'           => 'PureCart Test — Q3 MRR target',
			'target_amount'  => 5000.00,
			'current_amount' => 1460.00,
			'start_date'     => gmdate( 'Y-m-d', strtotime( 'first day of this month' ) ),
			'end_date'       => gmdate( 'Y-m-d', strtotime( 'last day of +2 months' ) ),
			'status'         => 'active',
			'created_at'     => current_time( 'mysql' ),
			'updated_at'     => current_time( 'mysql' ),
		),
		array( '%s', '%f', '%f', '%s', '%s', '%s', '%s', '%s' )
	);

	return $ids;
}
