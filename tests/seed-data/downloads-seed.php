<?php
/**
 * Test data for the Secure Downloads module: download tokens + access logs.
 *
 * Covers: an unused token, one that's hit max_downloads (plus its rejected
 * 4th attempt), one that's expired without ever being used (plus its
 * rejected attempt), a partially-used one with access-log rows attached,
 * and an admin-revoked one with a rejected post-revoke attempt — for the
 * admin download-log view's status filter and KPI strip.
 *
 * @package PureCart\Tests
 */

defined( 'ABSPATH' ) || exit;

/**
 * Seed purecart_downloads / purecart_download_logs.
 *
 * @return array<string, int> token => download_id.
 */
function purecart_seed_downloads(): array {
	global $wpdb;

	$downloads_table = $wpdb->prefix . 'purecart_downloads';
	$logs_table      = $wpdb->prefix . 'purecart_download_logs';

	$downloads = array(
		// Fresh token, unused.
		array(
			'token'          => 'TEST2DL-UNUSED-AAAA1111BBBB2222',
			'order_id'       => 90001,
			'user_id'        => PURECART_SEED_USER_ALICE,
			'product_id'     => PURECART_SEED_PRODUCT_PLUGIN,
			'file_id'        => 1,
			'download_count' => 0,
			'max_downloads'  => 3,
			'expires_at'     => gmdate( 'Y-m-d H:i:s', strtotime( '+30 days' ) ),
			'logs'           => array(),
		),
		// Exhausted — download_count has already hit max_downloads.
		array(
			'token'          => 'TEST2DL-EXHAUSTED-CCCC3333DDDD4444',
			'order_id'       => 90002,
			'user_id'        => PURECART_SEED_USER_BOB,
			'product_id'     => PURECART_SEED_PRODUCT_PLUGIN,
			'file_id'        => 1,
			'download_count' => 3,
			'max_downloads'  => 3,
			'expires_at'     => gmdate( 'Y-m-d H:i:s', strtotime( '+10 days' ) ),
			'logs'           => array(
				array(
					'ip'      => '198.51.100.20',
					'ua'      => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
					'country' => 'US',
					'status'  => 'success',
				),
				array(
					'ip'      => '198.51.100.20',
					'ua'      => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
					'country' => 'US',
					'status'  => 'success',
				),
				array(
					'ip'      => '198.51.100.21',
					'ua'      => 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15)',
					'country' => 'US',
					'status'  => 'success',
				),
				array(
					'ip'      => '198.51.100.21',
					'ua'      => 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15)',
					'country' => 'US',
					'status'  => 'rejected_exhausted',
				),
			),
		),
		// Expired, never used — the expiry-rejection path.
		array(
			'token'          => 'TEST2DL-EXPIRED-EEEE5555FFFF6666',
			'order_id'       => 90003,
			'user_id'        => PURECART_SEED_USER_CAROL,
			'product_id'     => PURECART_SEED_PRODUCT_PLUGIN,
			'file_id'        => 1,
			'download_count' => 0,
			'max_downloads'  => 3,
			'expires_at'     => gmdate( 'Y-m-d H:i:s', strtotime( '-2 days' ) ),
			'logs'           => array(
				array(
					'ip'      => '198.51.100.30',
					'ua'      => 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)',
					'country' => 'CA',
					'status'  => 'rejected_expired',
				),
			),
		),
		// Partially used, from a different country — geo/log review.
		array(
			'token'          => 'TEST2DL-PARTIAL-GGGG7777HHHH8888',
			'order_id'       => 90004,
			'user_id'        => PURECART_SEED_USER_DAVE,
			'product_id'     => PURECART_SEED_PRODUCT_SOFTWARE,
			'file_id'        => 2,
			'download_count' => 1,
			'max_downloads'  => 5,
			'expires_at'     => gmdate( 'Y-m-d H:i:s', strtotime( '+15 days' ) ),
			'logs'           => array(
				array(
					'ip'      => '203.0.113.55',
					'ua'      => 'PureCartCLI/1.0',
					'country' => 'BD',
					'status'  => 'success',
				),
			),
		),
		// Revoked by an admin — admin token-management review.
		array(
			'token'          => 'TEST2DL-REVOKED-IIII9999JJJJ0000',
			'order_id'       => 90005,
			'user_id'        => PURECART_SEED_USER_ALICE,
			'product_id'     => PURECART_SEED_PRODUCT_SOFTWARE,
			'file_id'        => 2,
			'download_count' => 2,
			'max_downloads'  => 5,
			'expires_at'     => gmdate( 'Y-m-d H:i:s', strtotime( '+20 days' ) ),
			'status'         => 'revoked',
			'logs'           => array(
				array(
					'ip'      => '203.0.113.60',
					'ua'      => 'Mozilla/5.0 (X11; Linux x86_64)',
					'country' => 'US',
					'status'  => 'success',
				),
				array(
					'ip'      => '203.0.113.60',
					'ua'      => 'Mozilla/5.0 (X11; Linux x86_64)',
					'country' => 'US',
					'status'  => 'rejected_revoked',
				),
			),
		),
	);

	$ids = array();

	foreach ( $downloads as $download ) {
		// Look up any prior seed run's row for this token before replacing it —
		// its download_id changes on every AUTO_INCREMENT insert below, so its
		// old log rows must be cleared by the OLD id or they're orphaned forever.
		$previous_id = $wpdb->get_var(
			$wpdb->prepare( "SELECT id FROM {$downloads_table} WHERE token = %s", $download['token'] )
		);
		if ( $previous_id ) {
			$wpdb->delete( $logs_table, array( 'download_id' => $previous_id ), array( '%d' ) );
		}

		$wpdb->delete( $downloads_table, array( 'token' => $download['token'] ), array( '%s' ) );

		$wpdb->insert(
			$downloads_table,
			array(
				'order_id'       => $download['order_id'],
				'user_id'        => $download['user_id'],
				'product_id'     => $download['product_id'],
				'file_id'        => $download['file_id'],
				'token'          => $download['token'],
				'download_count' => $download['download_count'],
				'max_downloads'  => $download['max_downloads'],
				'expires_at'     => $download['expires_at'],
				'ip_address'     => '203.0.113.10',
				'country_code'   => 'US',
				'status'         => $download['status'] ?? 'active',
				'created_at'     => current_time( 'mysql' ),
			),
			array( '%d', '%d', '%d', '%d', '%s', '%d', '%d', '%s', '%s', '%s', '%s', '%s' )
		);

		$download_id               = (int) $wpdb->insert_id;
		$ids[ $download['token'] ] = $download_id;

		foreach ( $download['logs'] as $log ) {
			$wpdb->insert(
				$logs_table,
				array(
					'download_id'   => $download_id,
					'ip_address'    => $log['ip'],
					'user_agent'    => $log['ua'],
					'country_code'  => $log['country'],
					'status'        => $log['status'] ?? 'success',
					'downloaded_at' => current_time( 'mysql' ),
				),
				array( '%d', '%s', '%s', '%s', '%s', '%s' )
			);
		}
	}

	return $ids;
}
