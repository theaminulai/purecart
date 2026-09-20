<?php
/**
 * Test data for the SaaS Provisioning module: accounts + JWT login tokens.
 *
 * @package PureCart\Tests
 */

defined( 'ABSPATH' ) || exit;

/**
 * Seed purecart_saas_accounts / purecart_saas_tokens.
 *
 * @return array<string, int> scenario label => account id.
 */
function purecart_seed_saas(): array {
	global $wpdb;

	$accounts_table = $wpdb->prefix . 'purecart_saas_accounts';
	$tokens_table   = $wpdb->prefix . 'purecart_saas_tokens';

	$accounts = array(
		// Healthy account, logged in — both an access and a refresh token live.
		array(
			'label'    => 'active-pro',
			'user_id'  => PURECART_SEED_USER_DAVE,
			'order_id' => 92001,
			'plan'     => 'pro',
			'api_key'  => 'test_sk_' . hash( 'sha256', 'dave-pro-account' ),
			'status'   => 'active',
			'tokens'   => array(
				array(
					'type' => 'access',
					'ttl'  => '+10 minutes',
				),
				array(
					'type' => 'refresh',
					'ttl'  => '+30 days',
				),
			),
		),
		// Suspended for non-payment — subscription webhook flipped this.
		array(
			'label'    => 'suspended-nonpayment',
			'user_id'  => PURECART_SEED_USER_BOB,
			'order_id' => 92002,
			'plan'     => 'starter',
			'api_key'  => 'test_sk_' . hash( 'sha256', 'bob-suspended-account' ),
			'status'   => 'suspended',
			'tokens'   => array(),
		),
		// Cancelled — should no longer be able to obtain new tokens.
		array(
			'label'    => 'cancelled',
			'user_id'  => PURECART_SEED_USER_CAROL,
			'order_id' => 92003,
			'plan'     => 'starter',
			'api_key'  => 'test_sk_' . hash( 'sha256', 'carol-cancelled-account' ),
			'status'   => 'cancelled',
			'tokens'   => array(),
		),
	);

	$ids = array();

	foreach ( $accounts as $account ) {
		$wpdb->delete( $accounts_table, array( 'api_key' => $account['api_key'] ), array( '%s' ) );

		$wpdb->insert(
			$accounts_table,
			array(
				'user_id'        => $account['user_id'],
				'order_id'       => $account['order_id'],
				'product_id'     => PURECART_SEED_PRODUCT_SAAS,
				'plan'           => $account['plan'],
				'api_key'        => $account['api_key'],
				'status'         => $account['status'],
				'provisioned_at' => current_time( 'mysql' ),
			),
			array( '%d', '%d', '%d', '%s', '%s', '%s', '%s' )
		);

		$account_id               = (int) $wpdb->insert_id;
		$ids[ $account['label'] ] = $account_id;

		$wpdb->delete( $tokens_table, array( 'account_id' => $account_id ), array( '%d' ) );
		foreach ( $account['tokens'] as $token ) {
			$wpdb->insert(
				$tokens_table,
				array(
					'account_id' => $account_id,
					'jti'        => wp_generate_uuid4(),
					'token_type' => $token['type'],
					'expires_at' => gmdate( 'Y-m-d H:i:s', strtotime( $token['ttl'] ) ),
					'revoked'    => 0,
					'created_at' => current_time( 'mysql' ),
				),
				array( '%d', '%s', '%s', '%s', '%d', '%s' )
			);
		}
	}

	return $ids;
}
