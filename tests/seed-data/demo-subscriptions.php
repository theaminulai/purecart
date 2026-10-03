<?php
/**
 * Demo seed for the My Subscriptions My Account tab.
 *
 * Unlike the other *-seed.php files, this one also creates the WP users and
 * WooCommerce product it needs — so you can run `composer test:demo` on a
 * fresh site and immediately log in to test the tab without any manual setup.
 *
 * Marker: gateway_subscription_id LIKE 'sub_demo_%'
 * Users:  user_login LIKE 'demo_%'
 * Product: post_meta _purecart_demo_sub_product = 1
 *
 * All are removed by purecart_teardown_demo_subscriptions() which is called
 * automatically by `composer test:remove`.
 *
 * @package PureCart\Tests
 * @since   1.0.0
 */

defined( 'ABSPATH' ) || exit;

/**
 * Seeds demo WP users, a WooCommerce product, and 5 subscription rows —
 * one per lifecycle status — so the My Subscriptions tab can be tested
 * immediately after `composer test:demo`.
 *
 * @since 1.0.0
 * @return array<string, mixed> Summary of what was created.
 */
function purecart_seed_demo_subscriptions(): array {
	global $wpdb;

	// ── 1. Demo WP users ────────────────────────────────────────────────────

	$demo_users = array(
		'demo_alice' => array( 'name' => 'Alice Active',   'email' => 'alice@purecart.test', 'pass' => 'demo1234' ),
		'demo_bob'   => array( 'name' => 'Bob Pastdue',    'email' => 'bob@purecart.test',   'pass' => 'demo1234' ),
		'demo_carol' => array( 'name' => 'Carol Paused',   'email' => 'carol@purecart.test', 'pass' => 'demo1234' ),
		'demo_dave'  => array( 'name' => 'Dave Cancelled', 'email' => 'dave@purecart.test',  'pass' => 'demo1234' ),
		'demo_erin'  => array( 'name' => 'Erin Trial',     'email' => 'erin@purecart.test',  'pass' => 'demo1234' ),
	);

	$user_ids = array();
	foreach ( $demo_users as $login => $u ) {
		$existing = get_user_by( 'login', $login );
		if ( $existing ) {
			$user_ids[ $login ] = $existing->ID;
		} else {
			$uid = wp_insert_user( array(
				'user_login'   => $login,
				'user_email'   => $u['email'],
				'display_name' => $u['name'],
				'user_pass'    => $u['pass'],
				'role'         => 'customer',
			) );
			$user_ids[ $login ] = is_wp_error( $uid ) ? 0 : $uid;
		}
	}

	// ── 2. Demo WooCommerce product ──────────────────────────────────────────

	$product_id    = null;
	$existing_prod = get_posts( array(
		'post_type'      => 'product',
		'meta_key'       => '_purecart_demo_sub_product',
		'meta_value'     => '1',
		'posts_per_page' => 1,
		'fields'         => 'ids',
	) );

	if ( ! empty( $existing_prod ) ) {
		$product_id = (int) $existing_prod[0];
	} elseif ( class_exists( 'WC_Product_Simple' ) ) {
		$product = new WC_Product_Simple();
		$product->set_name( 'PureCart Demo Plugin — Professional Plan' );
		$product->set_status( 'publish' );
		$product->set_regular_price( '49.00' );
		$product->set_description( 'Demo subscription product for PureCart My Account testing.' );
		$product_id = $product->save();
		update_post_meta( $product_id, '_purecart_demo_sub_product', '1' );
	}

	if ( ! $product_id ) {
		return array( 'error' => 'WooCommerce not available — could not create demo product' );
	}

	// ── 2a. Product version rows for the demo product ──────────────────────────
	// Inserted with DEMO-PLACEHOLDER- paths so teardown can find them safely.

	$versions_table = $wpdb->prefix . 'purecart_product_versions';

	$demo_versions = array(
		array(
			'version'     => '1.0.0',
			'channel'     => 'stable',
			'is_active'   => 1,
			'is_rollback' => 0,
			'changelog'   => 'Initial release.',
			'released_at' => gmdate( 'Y-m-d H:i:s', strtotime( '-60 days' ) ),
		),
		array(
			'version'     => '1.1.0',
			'channel'     => 'stable',
			'is_active'   => 1,
			'is_rollback' => 0,
			'changelog'   => 'Bug fixes and performance improvements.',
			'released_at' => gmdate( 'Y-m-d H:i:s', strtotime( '-7 days' ) ),
		),
	);

	foreach ( $demo_versions as $ver ) {
		$wpdb->delete(
			$versions_table,
			array( 'product_id' => $product_id, 'version' => $ver['version'] ),
			array( '%d', '%s' )
		);
		$wpdb->insert(
			$versions_table,
			array(
				'product_id'      => $product_id,
				'version'         => $ver['version'],
				'platform'        => 'all',
				'channel'         => $ver['channel'],
				'file_path'       => WP_CONTENT_DIR . '/uploads/purecart-packages/DEMO-PLACEHOLDER-' . $ver['version'] . '.zip',
				'file_size'       => 51200,
				'checksum_sha256' => hash( 'sha256', 'purecart-demo-' . $ver['version'] ),
				'requires_wp'     => '6.0',
				'tested_wp'       => '6.8',
				'requires_php'    => '8.0',
				'changelog'       => $ver['changelog'],
				'release_notes'   => $ver['changelog'],
				'is_active'       => $ver['is_active'],
				'is_rollback'     => $ver['is_rollback'],
				'download_count'  => wp_rand( 0, 20 ),
				'released_at'     => $ver['released_at'],
				'created_by'      => 0,
			),
			array( '%d', '%s', '%s', '%s', '%s', '%d', '%s', '%s', '%s', '%s', '%s', '%s', '%d', '%d', '%d', '%s', '%d' )
		);
	}

	// ── 2b. Completed WC order for demo_alice (needed for Software Updates) ───
	// The Software Updates tab queries wc_get_orders() for the current user.
	// Without at least one completed order containing the demo product, the
	// "You do not have any update-enabled software products" message shows.

	$alice_uid     = $user_ids['demo_alice'] ?? 0;
	$demo_order_id = 0;

	if ( $alice_uid && function_exists( 'wc_create_order' ) ) {
		$existing = wc_get_orders(
			array(
				'customer'   => $alice_uid,
				'limit'      => 1,
				'return'     => 'ids',
				'meta_query' => array(
					array( 'key' => '_purecart_demo_order', 'value' => '1' ),
				),
			)
		);

		if ( ! empty( $existing ) ) {
			$demo_order_id = (int) $existing[0];
		} else {
			$order = wc_create_order( array( 'customer_id' => $alice_uid ) );
			if ( ! is_wp_error( $order ) ) {
				$product_obj = wc_get_product( $product_id );
				if ( $product_obj ) {
					$order->add_product( $product_obj, 1 );
				}
				$order->update_meta_data( '_purecart_demo_order', '1' );
				$order->set_status( 'completed' );
				$order->calculate_totals();
				$demo_order_id = $order->save();
			}
		}
	}

	// ── 2c. License for demo_alice ────────────────────────────────────────────

	$licenses_table  = $wpdb->prefix . 'purecart_licenses';
	$license_key     = 'DEMO1-AAAA11-BBBB22-CCCC33';
	$demo_license_id = 0;

	if ( $alice_uid ) {
		$wpdb->delete( $licenses_table, array( 'license_key' => $license_key ), array( '%s' ) );
		$wpdb->insert(
			$licenses_table,
			array(
				'order_id'         => $demo_order_id,
				'user_id'          => $alice_uid,
				'product_id'       => $product_id,
				'license_key'      => $license_key,
				'plan_type'        => 'single',
				'status'           => 'active',
				'activation_limit' => 1,
				'activated_count'  => 0,
				'expires_at'       => gmdate( 'Y-m-d H:i:s', strtotime( '+11 months' ) ),
				'created_at'       => current_time( 'mysql' ),
				'updated_at'       => current_time( 'mysql' ),
			),
			array( '%d', '%d', '%d', '%s', '%s', '%s', '%d', '%d', '%s', '%s', '%s' )
		);
		$demo_license_id = (int) $wpdb->insert_id;
	}

	// ── 2d. SaaS / API key account for demo_alice ────────────────────────────

	$saas_table   = $wpdb->prefix . 'purecart_saas_accounts';
	$demo_api_key = 'demo_sk_' . hash( 'sha256', 'alice-demo-saas-account' );
	$demo_saas_id = 0;

	if ( $alice_uid ) {
		$wpdb->delete( $saas_table, array( 'api_key' => $demo_api_key ), array( '%s' ) );
		$wpdb->insert(
			$saas_table,
			array(
				'user_id'        => $alice_uid,
				'order_id'       => $demo_order_id,
				'product_id'     => $product_id,
				'plan'           => 'pro',
				'api_key'        => $demo_api_key,
				'status'         => 'active',
				'provisioned_at' => current_time( 'mysql' ),
			),
			array( '%d', '%d', '%d', '%s', '%s', '%s', '%s' )
		);
		$demo_saas_id = (int) $wpdb->insert_id;
	}

	// ── 3. Subscription rows — one per lifecycle status ──────────────────────

	$subs_table     = $wpdb->prefix . 'purecart_subscriptions';
	$items_table    = $wpdb->prefix . 'purecart_subscription_items';
	$linked_table   = $wpdb->prefix . 'purecart_subscription_linked_entities';
	$logs_table     = $wpdb->prefix . 'purecart_subscription_logs';
	$payments_table = $wpdb->prefix . 'purecart_subscription_payments';
	$revenue_table  = $wpdb->prefix . 'purecart_subscription_revenue';
	$goals_table    = $wpdb->prefix . 'purecart_revenue_goals';

	$scenarios = array(
		'active' => array(
			'user_login'       => 'demo_alice',
			'status'           => 'active',
			'billing_interval' => 1,
			'billing_period'   => 'month',
			'recurring_amount' => 49.00,
			'next_payment_at'  => gmdate( 'Y-m-d H:i:s', strtotime( '+18 days' ) ),
			'last_payment_at'  => gmdate( 'Y-m-d H:i:s', strtotime( '-12 days' ) ),
			'gateway'          => 'stripe',
			'gateway_sub_id'   => 'sub_demo_active_alice',
			'starts_at'        => gmdate( 'Y-m-d H:i:s', strtotime( '-4 months' ) ),
			'payments'         => array(
				array( 'status' => 'completed', 'amount' => 49.00, 'days_ago' => 42 ),
				array( 'status' => 'completed', 'amount' => 49.00, 'days_ago' => 12 ),
			),
			'log_event'        => 'renewed',
		),
		'past_due' => array(
			'user_login'       => 'demo_bob',
			'status'           => 'past_due',
			'billing_interval' => 1,
			'billing_period'   => 'month',
			'recurring_amount' => 49.00,
			'retry_count'      => 2,
			'next_payment_at'  => gmdate( 'Y-m-d H:i:s', strtotime( '+2 days' ) ),
			'last_payment_at'  => gmdate( 'Y-m-d H:i:s', strtotime( '-33 days' ) ),
			'gateway'          => 'stripe',
			'gateway_sub_id'   => 'sub_demo_pastdue_bob',
			'starts_at'        => gmdate( 'Y-m-d H:i:s', strtotime( '-2 months' ) ),
			'payments'         => array(
				array( 'status' => 'completed', 'amount' => 49.00, 'days_ago' => 63 ),
				array( 'status' => 'failed',    'amount' => 49.00, 'days_ago' => 3 ),
			),
			'log_event'        => 'payment_failed',
		),
		'paused' => array(
			'user_login'       => 'demo_carol',
			'status'           => 'paused',
			'billing_interval' => 1,
			'billing_period'   => 'month',
			'recurring_amount' => 19.00,
			'paused_at'        => gmdate( 'Y-m-d H:i:s', strtotime( '-10 days' ) ),
			'pause_end_date'   => gmdate( 'Y-m-d H:i:s', strtotime( '+20 days' ) ),
			'gateway'          => 'paypal',
			'gateway_sub_id'   => 'sub_demo_paused_carol',
			'starts_at'        => gmdate( 'Y-m-d H:i:s', strtotime( '-3 months' ) ),
			'payments'         => array(
				array( 'status' => 'completed', 'amount' => 19.00, 'days_ago' => 40 ),
			),
			'log_event'        => 'paused',
		),
		'cancelled' => array(
			'user_login'        => 'demo_dave',
			'status'            => 'cancelled',
			'billing_interval'  => 1,
			'billing_period'    => 'year',
			'recurring_amount'  => 199.00,
			'cancelled_at'      => gmdate( 'Y-m-d H:i:s', strtotime( '-5 days' ) ),
			'cancellation_date' => gmdate( 'Y-m-d H:i:s', strtotime( '-5 days' ) ),
			'gateway'           => 'stripe',
			'gateway_sub_id'    => 'sub_demo_cancelled_dave',
			'starts_at'         => gmdate( 'Y-m-d H:i:s', strtotime( '-14 months' ) ),
			'payments'          => array(
				array( 'status' => 'completed', 'amount' => 199.00, 'days_ago' => 370 ),
			),
			'log_event'         => 'cancelled',
		),
		'trialing' => array(
			'user_login'       => 'demo_erin',
			'status'           => 'trialing',
			'billing_interval' => 1,
			'billing_period'   => 'month',
			'recurring_amount' => 29.00,
			'trial_ends_at'    => gmdate( 'Y-m-d H:i:s', strtotime( '+5 days' ) ),
			'next_payment_at'  => gmdate( 'Y-m-d H:i:s', strtotime( '+5 days' ) ),
			'gateway'          => 'stripe',
			'gateway_sub_id'   => 'sub_demo_trial_erin',
			'starts_at'        => gmdate( 'Y-m-d H:i:s', strtotime( '-9 days' ) ),
			'payments'         => array(),
			'log_event'        => 'trial_started',
		),
	);

	$ids = array();

	foreach ( $scenarios as $label => $s ) {
		$uid = $user_ids[ $s['user_login'] ] ?? 0;
		if ( ! $uid ) {
			continue;
		}

		$wpdb->delete( $subs_table, array( 'gateway_subscription_id' => $s['gateway_sub_id'] ), array( '%s' ) );

		$wpdb->insert(
			$subs_table,
			array(
				'user_id'                 => $uid,
				'product_id'              => $product_id,
				'order_id'                => 0,
				'delivery_type'           => 'software',
				'status'                  => $s['status'],
				'billing_interval'        => $s['billing_interval'],
				'billing_period'          => $s['billing_period'],
				'recurring_amount'        => $s['recurring_amount'],
				'currency'                => 'USD',
				'trial_ends_at'           => $s['trial_ends_at']      ?? null,
				'next_payment_at'         => $s['next_payment_at']    ?? null,
				'last_payment_at'         => $s['last_payment_at']    ?? null,
				'paused_at'               => $s['paused_at']          ?? null,
				'pause_end_date'          => $s['pause_end_date']     ?? null,
				'cancelled_at'            => $s['cancelled_at']       ?? null,
				'cancellation_date'       => $s['cancellation_date']  ?? null,
				'gateway'                 => $s['gateway'],
				'gateway_subscription_id' => $s['gateway_sub_id'],
				'retry_count'             => $s['retry_count']        ?? 0,
				'starts_at'               => $s['starts_at'],
				'created_at'              => $s['starts_at'],
				'updated_at'              => current_time( 'mysql' ),
			),
			array( '%d','%d','%d','%s','%s','%d','%s','%f','%s','%s','%s','%s','%s','%s','%s','%s','%s','%s','%d','%s','%s','%s' )
		);

		$sub_id = (int) $wpdb->insert_id;
		$ids[ $label ] = $sub_id;

		$wpdb->delete( $items_table, array( 'subscription_id' => $sub_id ), array( '%d' ) );
		$wpdb->insert(
			$items_table,
			array(
				'subscription_id' => $sub_id,
				'product_id'      => $product_id,
				'qty'             => 1,
				'line_subtotal'   => $s['recurring_amount'],
				'line_total'      => $s['recurring_amount'],
				'delivery_type'   => 'software',
			),
			array( '%d','%d','%d','%f','%f','%s' )
		);

		$wpdb->delete( $linked_table, array( 'subscription_id' => $sub_id ), array( '%d' ) );
		$wpdb->insert(
			$linked_table,
			array(
				'subscription_id'      => $sub_id,
				'delivery_type'        => 'software',
				'downloads_this_cycle' => wp_rand( 0, 5 ),
				'download_limit'       => 10,
				'created_at'           => current_time( 'mysql' ),
				'updated_at'           => current_time( 'mysql' ),
			),
			array( '%d','%s','%d','%d','%s','%s' )
		);

		$wpdb->delete( $logs_table, array( 'subscription_id' => $sub_id ), array( '%d' ) );
		$wpdb->insert(
			$logs_table,
			array(
				'subscription_id' => $sub_id,
				'event'           => $s['log_event'],
				'new_status'      => $s['status'],
				'actor_type'      => 'system',
				'actor_id'        => 0,
				'created_at'      => current_time( 'mysql' ),
			),
			array( '%d','%s','%s','%s','%d','%s' )
		);

		foreach ( $s['payments'] as $i => $payment ) {
			$txn_id = 'txn_demo_' . $label . '_' . $i;
			$wpdb->delete( $payments_table, array( 'transaction_id' => $txn_id ), array( '%s' ) );
			$wpdb->insert(
				$payments_table,
				array(
					'subscription_id' => $sub_id,
					'order_id'        => 0,
					'transaction_id'  => $txn_id,
					'amount'          => $payment['amount'],
					'currency'        => 'USD',
					'status'          => $payment['status'],
					'created_at'      => gmdate( 'Y-m-d H:i:s', strtotime( "-{$payment['days_ago']} days" ) ),
				),
				array( '%d','%d','%s','%f','%s','%s','%s' )
			);

			if ( 'completed' === $payment['status'] ) {
				$period_start = gmdate( 'Y-m-d', strtotime( "-{$payment['days_ago']} days" ) );
				$period_end   = gmdate( 'Y-m-d', strtotime( $period_start . ' +1 month' ) );
				$revenue_txn  = 'rev_demo_' . $label . '_' . $i;

				$wpdb->delete( $revenue_table, array( 'transaction_id' => $revenue_txn ), array( '%s' ) );
				$wpdb->insert(
					$revenue_table,
					array(
						'subscription_id' => $sub_id,
						'amount'          => $payment['amount'],
						'currency'        => 'USD',
						'billing_period'  => $s['billing_period'],
						'period_start'    => $period_start,
						'period_end'      => $period_end,
						'transaction_id'  => $revenue_txn,
						'gateway'         => $s['gateway'],
						'created_at'      => gmdate( 'Y-m-d H:i:s', strtotime( "-{$payment['days_ago']} days" ) ),
					),
					array( '%d','%f','%s','%s','%s','%s','%s','%s','%s' )
				);
			}
		}
	}

	// One active revenue goal — mirrors the test goal in subscriptions-seed.php.
	$wpdb->delete( $goals_table, array( 'name' => 'PureCart Demo — Q3 MRR target' ), array( '%s' ) );
	$wpdb->insert(
		$goals_table,
		array(
			'name'           => 'PureCart Demo — Q3 MRR target',
			'target_amount'  => 5000.00,
			'current_amount' => 1460.00,
			'start_date'     => gmdate( 'Y-m-d', strtotime( 'first day of this month' ) ),
			'end_date'       => gmdate( 'Y-m-d', strtotime( 'last day of +2 months' ) ),
			'status'         => 'active',
			'created_at'     => current_time( 'mysql' ),
			'updated_at'     => current_time( 'mysql' ),
		),
		array( '%s','%f','%f','%s','%s','%s','%s','%s' )
	);

	return array(
		'subscriptions' => $ids,
		'product_id'    => $product_id,
		'users'         => $user_ids,
		'versions'      => count( $demo_versions ),
		'demo_order_id' => $demo_order_id,
		'license_id'    => $demo_license_id,
		'saas_id'       => $demo_saas_id,
		'login_url'     => home_url( 'my-account/purecart-subscriptions/' ),
		'password'      => 'demo1234',
	);
}
