<?php
/**
 * Test data for the Plugin Updates module: product_versions rows.
 *
 * Mirrors the manual QA fixtures in docs/UPDATES-QA-BN.md (same version
 * numbers, same "1.9.0 vs 1.10.0" string-vs-semver trap) but inserted
 * straight into the DB instead of requiring an actual ZIP upload through
 * the admin UI. file_path points at a placeholder path with no real file
 * behind it — these rows exercise update-check / version-list / rollback
 * logic, not the actual file download; use the real ZIPs from the QA doc
 * for that.
 *
 * @package PureCart\Tests
 */

defined( 'ABSPATH' ) || exit;

/**
 * Seed purecart_product_versions.
 *
 * @return array<string, int> scenario label => row id.
 */
function purecart_seed_updates(): array {
	global $wpdb;

	$table = $wpdb->prefix . 'purecart_product_versions';

	$versions = array(
		array(
			'label'       => '1.0.0',
			'version'     => '1.0.0',
			'channel'     => 'stable',
			'is_active'   => 1,
			'is_rollback' => 0,
			'released_at' => gmdate( 'Y-m-d H:i:s', strtotime( '-90 days' ) ),
			'changelog'   => '<ul><li>Initial release</li></ul>',
		),
		// Withdrawn — a bad release pulled via "Withdraw" in the admin tab.
		array(
			'label'       => '1.5.0-withdrawn',
			'version'     => '1.5.0',
			'channel'     => 'stable',
			'is_active'   => 0,
			'is_rollback' => 0,
			'released_at' => gmdate( 'Y-m-d H:i:s', strtotime( '-30 days' ) ),
			'changelog'   => '<ul><li>Regression — superseded, do not serve</li></ul>',
		),
		// Reactivated via Emergency Rollback — is_rollback = 1 exercises the
		// admin history badge that admin_rollback() now actually populates.
		array(
			'label'       => '1.9.0-rollback-target',
			'version'     => '1.9.0',
			'channel'     => 'stable',
			'is_active'   => 1,
			'is_rollback' => 1,
			'released_at' => gmdate( 'Y-m-d H:i:s', strtotime( '-45 days' ) ),
			'changelog'   => '<ul><li>Last known-good release before 1.10.0</li></ul>',
		),
		// The classic string-vs-semver trap: '1.9.0' > '1.10.0' if anything
		// ever sorts these as strings instead of via version_compare().
		array(
			'label'       => '1.10.0',
			'version'     => '1.10.0',
			'channel'     => 'stable',
			'is_active'   => 1,
			'is_rollback' => 0,
			'released_at' => gmdate( 'Y-m-d H:i:s', strtotime( '-2 days' ) ),
			'changelog'   => '<ul><li>Performance improvements</li><li>Bug fixes</li></ul>',
		),
		// Beta channel — must never reach a 'stable'-subscribed caller.
		array(
			'label'       => '1.11.0-beta',
			'version'     => '1.11.0',
			'channel'     => 'beta',
			'is_active'   => 1,
			'is_rollback' => 0,
			'released_at' => gmdate( 'Y-m-d H:i:s', strtotime( '-1 day' ) ),
			'changelog'   => '<ul><li>Early access — beta testers only</li></ul>',
		),
	);

	$ids = array();

	foreach ( $versions as $v ) {
		$wpdb->delete(
			$table,
			array(
				'product_id' => PURECART_SEED_PRODUCT_PLUGIN,
				'version'    => $v['version'],
				'platform'   => 'all',
			),
			array( '%d', '%s', '%s' )
		);

		$wpdb->insert(
			$table,
			array(
				'product_id'      => PURECART_SEED_PRODUCT_PLUGIN,
				'version'         => $v['version'],
				'platform'        => 'all',
				'channel'         => $v['channel'],
				'file_path'       => WP_CONTENT_DIR . '/uploads/purecart-packages/TEST-PLACEHOLDER-' . $v['version'] . '.zip',
				'file_size'       => 51200,
				'checksum_sha256' => hash( 'sha256', 'purecart-test-' . $v['version'] ),
				'requires_wp'     => '6.0',
				'tested_wp'       => '6.8',
				'requires_php'    => '8.0',
				'changelog'       => $v['changelog'],
				'release_notes'   => wp_strip_all_tags( $v['changelog'] ),
				'is_active'       => $v['is_active'],
				'is_rollback'     => $v['is_rollback'],
				'download_count'  => wp_rand( 0, 40 ),
				'released_at'     => $v['released_at'],
				'created_by'      => 0,
			),
			array( '%d', '%s', '%s', '%s', '%s', '%d', '%s', '%s', '%s', '%s', '%s', '%s', '%d', '%d', '%d', '%s', '%d' )
		);

		$ids[ $v['label'] ] = (int) $wpdb->insert_id;
	}

	return $ids;
}
