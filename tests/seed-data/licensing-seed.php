<?php
/**
 * Test data for the Licensing module: licenses, activations, JWT tokens.
 *
 * Covers the branches LicenseGate::validate() and domain_is_allowed() care
 * about: a healthy license, one sitting exactly at its activation limit, an
 * expired-but-still-"active" one, a revoked one, and an unlimited/lifetime
 * plan that bypasses the limit entirely.
 *
 * @package PureCart\Tests
 */

defined( 'ABSPATH' ) || exit;

/**
 * Seed purecart_licenses / purecart_license_activations / purecart_license_tokens.
 *
 * @return array<string, int> license_key => license_id.
 */
function purecart_seed_licensing(): array {
	global $wpdb;

	$licenses_table    = $wpdb->prefix . 'purecart_licenses';
	$activations_table = $wpdb->prefix . 'purecart_license_activations';
	$tokens_table      = $wpdb->prefix . 'purecart_license_tokens';

	$licenses = array(
		// Healthy single-site license, one activation, plenty of headroom.
		array(
			'key'              => 'TEST1-AAAA11-BBBB22-CCCC33',
			'order_id'         => 90001,
			'user_id'          => PURECART_SEED_USER_ALICE,
			'product_id'       => PURECART_SEED_PRODUCT_PLUGIN,
			'plan_type'        => 'single',
			'status'           => 'active',
			'activation_limit' => 1,
			'activated_count'  => 1,
			'expires_at'       => gmdate( 'Y-m-d H:i:s', strtotime( '+11 months' ) ),
			'activations'      => array(
				array(
					'domain'           => 'alice-shop.test',
					'environment'      => 'production',
					'reported_version' => '1.10.0',
				),
			),
			'tokens'           => array(
				array(
					'type'   => 'access',
					'domain' => 'alice-shop.test',
					'ttl'    => '+10 minutes',
				),
				array(
					'type'   => 'refresh',
					'domain' => 'alice-shop.test',
					'ttl'    => '+30 days',
				),
			),
		),
		// Multi-site license sitting exactly at its activation limit — the
		// "domain already activated" branch of domain_is_allowed().
		array(
			'key'              => 'TEST1-DDDD44-EEEE55-FFFF66',
			'order_id'         => 90002,
			'user_id'          => PURECART_SEED_USER_BOB,
			'product_id'       => PURECART_SEED_PRODUCT_PLUGIN,
			'plan_type'        => 'multi',
			'status'           => 'active',
			'activation_limit' => 3,
			'activated_count'  => 3,
			'expires_at'       => gmdate( 'Y-m-d H:i:s', strtotime( '+6 months' ) ),
			'activations'      => array(
				array(
					'domain'           => 'bob-site-one.test',
					'environment'      => 'production',
					'reported_version' => '1.9.0',
				),
				array(
					'domain'           => 'bob-site-two.test',
					'environment'      => 'production',
					'reported_version' => '1.9.0',
				),
				array(
					'domain'           => 'bob-staging.test',
					'environment'      => 'staging',
					'reported_version' => '1.10.0',
				),
			),
			'tokens'           => array(),
		),
		// Expired — LicenseGate::validate() must reject on the date check
		// even though status is still 'active' (nothing sweeps it).
		array(
			'key'              => 'TEST1-GGGG77-HHHH88-IIII99',
			'order_id'         => 90003,
			'user_id'          => PURECART_SEED_USER_CAROL,
			'product_id'       => PURECART_SEED_PRODUCT_PLUGIN,
			'plan_type'        => 'single',
			'status'           => 'active',
			'activation_limit' => 1,
			'activated_count'  => 1,
			'expires_at'       => gmdate( 'Y-m-d H:i:s', strtotime( '-3 days' ) ),
			'activations'      => array(
				array(
					'domain'           => 'carol-expired.test',
					'environment'      => 'production',
					'reported_version' => '1.8.0',
				),
			),
			'tokens'           => array(),
		),
		// Explicitly revoked — the status check.
		array(
			'key'              => 'TEST1-JJJJ00-KKKK11-LLLL22',
			'order_id'         => 90004,
			'user_id'          => PURECART_SEED_USER_CAROL,
			'product_id'       => PURECART_SEED_PRODUCT_PLUGIN,
			'plan_type'        => 'single',
			'status'           => 'revoked',
			'activation_limit' => 1,
			'activated_count'  => 1,
			'expires_at'       => null,
			'activations'      => array(
				array(
					'domain'           => 'carol-revoked.test',
					'environment'      => 'production',
					'reported_version' => '1.8.0',
				),
			),
			'tokens'           => array(),
		),
		// Lifetime plan on the theme product — domain_is_allowed() must
		// short-circuit true regardless of activated_count.
		array(
			'key'              => 'TEST1-MMMM33-NNNN44-OOOO55',
			'order_id'         => 90005,
			'user_id'          => PURECART_SEED_USER_ALICE,
			'product_id'       => PURECART_SEED_PRODUCT_THEME,
			'plan_type'        => 'lifetime',
			'status'           => 'active',
			'activation_limit' => 1,
			'activated_count'  => 9,
			'expires_at'       => null,
			'activations'      => array(
				array(
					'domain'           => 'alice-theme-demo.test',
					'environment'      => 'production',
					'reported_version' => '2.0.0',
				),
			),
			'tokens'           => array(),
		),
	);

	$ids = array();

	foreach ( $licenses as $license ) {
		// Delete first so re-running this script updates in place instead of
		// hitting the license_key UNIQUE constraint.
		$wpdb->delete( $licenses_table, array( 'license_key' => $license['key'] ), array( '%s' ) );

		$wpdb->insert(
			$licenses_table,
			array(
				'order_id'         => $license['order_id'],
				'user_id'          => $license['user_id'],
				'product_id'       => $license['product_id'],
				'license_key'      => $license['key'],
				'plan_type'        => $license['plan_type'],
				'status'           => $license['status'],
				'activation_limit' => $license['activation_limit'],
				'activated_count'  => $license['activated_count'],
				'expires_at'       => $license['expires_at'],
				'created_at'       => current_time( 'mysql' ),
				'updated_at'       => current_time( 'mysql' ),
			),
			array( '%d', '%d', '%d', '%s', '%s', '%s', '%d', '%d', '%s', '%s', '%s' )
		);

		$license_id             = (int) $wpdb->insert_id;
		$ids[ $license['key'] ] = $license_id;

		$wpdb->delete( $activations_table, array( 'license_id' => $license_id ), array( '%d' ) );
		foreach ( $license['activations'] as $activation ) {
			$wpdb->insert(
				$activations_table,
				array(
					'license_id'       => $license_id,
					'domain'           => $activation['domain'],
					'ip_address'       => '203.0.113.10',
					'environment'      => $activation['environment'],
					'reported_version' => $activation['reported_version'],
					'activated_at'     => current_time( 'mysql' ),
					'last_check'       => current_time( 'mysql' ),
				),
				array( '%d', '%s', '%s', '%s', '%s', '%s', '%s' )
			);
		}

		$wpdb->delete( $tokens_table, array( 'license_id' => $license_id ), array( '%d' ) );
		foreach ( $license['tokens'] as $token ) {
			$wpdb->insert(
				$tokens_table,
				array(
					'license_id' => $license_id,
					'jti'        => wp_generate_uuid4(),
					'token_type' => $token['type'],
					'domain'     => $token['domain'],
					'expires_at' => gmdate( 'Y-m-d H:i:s', strtotime( $token['ttl'] ) ),
					'revoked'    => 0,
					'created_at' => current_time( 'mysql' ),
				),
				array( '%d', '%s', '%s', '%s', '%s', '%d', '%s' )
			);
		}
	}

	return $ids;
}
