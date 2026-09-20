<?php
/**
 * Removes every row the seed-data scripts (licensing-seed.php,
 * downloads-seed.php, updates-seed.php, subscriptions-seed.php,
 * saas-seed.php) create.
 *
 * Usage (WP-CLI, from the WordPress root):
 *
 *   wp eval-file wp-content/plugins/woo-digital-downloads/tests/seed-data/teardown.php
 *
 * Deletes purely by the same recognizable markers seed.php inserts under
 * (TEST1- license keys, TEST2DL- download tokens, sub_test_ gateway IDs,
 * test_sk_ API keys, TEST-PLACEHOLDER- file paths) — never a blanket
 * TRUNCATE, so real data in these tables is left alone.
 *
 * @package PureCart\Tests
 */

if ( ! defined( 'ABSPATH' ) ) {
	// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_fwrite -- CLI-only entry point; runs before WordPress (and WP_Filesystem) has bootstrapped.
	fwrite( STDERR, "Run this with WP-CLI, not php directly:\n  wp eval-file tests/seed-data/teardown.php\n" );
	exit( 1 );
}

/**
 * Safe, bounded "IN (...)" list from an array of row IDs already read back
 * from the DB — never from raw user input.
 *
 * @param int[] $ids Row IDs.
 * @return string Comma-separated list, or '0' (matches nothing) when empty.
 */
function purecart_seed_id_list( array $ids ): string {
	$ids = array_map( 'absint', $ids );
	return $ids ? implode( ',', $ids ) : '0';
}

/**
 * Delete every seeded Licensing-module row.
 *
 * @return array<string, int> table => rows deleted.
 */
function purecart_teardown_licensing(): array {
	global $wpdb;

	$licenses_table    = $wpdb->prefix . 'purecart_licenses';
	$activations_table = $wpdb->prefix . 'purecart_license_activations';
	$tokens_table      = $wpdb->prefix . 'purecart_license_tokens';

	// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- Fixed teardown query on a plugin-owned table, no variable input.
	$license_ids = $wpdb->get_col( "SELECT id FROM {$licenses_table} WHERE license_key LIKE 'TEST1-%'" );
	$id_list     = purecart_seed_id_list( array_map( 'intval', $license_ids ) );

	$counts = array();

	// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- $id_list is built from purecart_seed_id_list(), integers only.
	$counts[ $tokens_table ] = (int) $wpdb->query( "DELETE FROM {$tokens_table} WHERE license_id IN ({$id_list})" );
	// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- As above.
	$counts[ $activations_table ] = (int) $wpdb->query( "DELETE FROM {$activations_table} WHERE license_id IN ({$id_list})" );
	// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- As above.
	$counts[ $licenses_table ] = (int) $wpdb->query( "DELETE FROM {$licenses_table} WHERE license_key LIKE 'TEST1-%'" );

	return $counts;
}

/**
 * Delete every seeded Secure Downloads-module row.
 *
 * @return array<string, int> table => rows deleted.
 */
function purecart_teardown_downloads(): array {
	global $wpdb;

	$downloads_table = $wpdb->prefix . 'purecart_downloads';
	$logs_table      = $wpdb->prefix . 'purecart_download_logs';

	// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- Fixed teardown query on a plugin-owned table, no variable input.
	$download_ids = $wpdb->get_col( "SELECT id FROM {$downloads_table} WHERE token LIKE 'TEST2DL-%'" );
	$id_list      = purecart_seed_id_list( array_map( 'intval', $download_ids ) );

	$counts = array();

	// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- $id_list is built from purecart_seed_id_list(), integers only.
	$counts[ $logs_table ] = (int) $wpdb->query( "DELETE FROM {$logs_table} WHERE download_id IN ({$id_list})" );
	// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- As above.
	$counts[ $downloads_table ] = (int) $wpdb->query( "DELETE FROM {$downloads_table} WHERE token LIKE 'TEST2DL-%'" );

	return $counts;
}

/**
 * Delete every seeded Plugin Updates-module row.
 *
 * @return array<string, int> table => rows deleted.
 */
function purecart_teardown_updates(): array {
	global $wpdb;

	$table = $wpdb->prefix . 'purecart_product_versions';

	// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- Fixed teardown query on a plugin-owned table, no variable input.
	$deleted = (int) $wpdb->query( "DELETE FROM {$table} WHERE file_path LIKE '%TEST-PLACEHOLDER-%'" );

	return array( $table => $deleted );
}

/**
 * Delete every seeded Subscriptions-module row.
 *
 * @return array<string, int> table => rows deleted.
 */
function purecart_teardown_subscriptions(): array {
	global $wpdb;

	$subs_table     = $wpdb->prefix . 'purecart_subscriptions';
	$items_table    = $wpdb->prefix . 'purecart_subscription_items';
	$linked_table   = $wpdb->prefix . 'purecart_subscription_linked_entities';
	$logs_table     = $wpdb->prefix . 'purecart_subscription_logs';
	$payments_table = $wpdb->prefix . 'purecart_subscription_payments';
	$revenue_table  = $wpdb->prefix . 'purecart_subscription_revenue';
	$goals_table    = $wpdb->prefix . 'purecart_revenue_goals';

	// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- Fixed teardown query on a plugin-owned table, no variable input.
	$sub_ids = $wpdb->get_col( "SELECT id FROM {$subs_table} WHERE gateway_subscription_id LIKE 'sub_test_%'" );
	$id_list = purecart_seed_id_list( array_map( 'intval', $sub_ids ) );

	$counts = array();

	// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- $id_list is built from purecart_seed_id_list(), integers only.
	$counts[ $revenue_table ] = (int) $wpdb->query( "DELETE FROM {$revenue_table} WHERE subscription_id IN ({$id_list})" );
	// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- As above.
	$counts[ $payments_table ] = (int) $wpdb->query( "DELETE FROM {$payments_table} WHERE subscription_id IN ({$id_list})" );
	// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- As above.
	$counts[ $logs_table ] = (int) $wpdb->query( "DELETE FROM {$logs_table} WHERE subscription_id IN ({$id_list})" );
	// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- As above.
	$counts[ $linked_table ] = (int) $wpdb->query( "DELETE FROM {$linked_table} WHERE subscription_id IN ({$id_list})" );
	// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- As above.
	$counts[ $items_table ] = (int) $wpdb->query( "DELETE FROM {$items_table} WHERE subscription_id IN ({$id_list})" );
	// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- As above.
	$counts[ $subs_table ] = (int) $wpdb->query( "DELETE FROM {$subs_table} WHERE gateway_subscription_id LIKE 'sub_test_%'" );

	$counts[ $goals_table ] = $wpdb->delete( $goals_table, array( 'name' => 'PureCart Test — Q3 MRR target' ), array( '%s' ) );

	return $counts;
}

/**
 * Delete every seeded SaaS Provisioning-module row.
 *
 * @return array<string, int> table => rows deleted.
 */
function purecart_teardown_saas(): array {
	global $wpdb;

	$accounts_table = $wpdb->prefix . 'purecart_saas_accounts';
	$tokens_table   = $wpdb->prefix . 'purecart_saas_tokens';

	// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- Fixed teardown query on a plugin-owned table, no variable input.
	$account_ids = $wpdb->get_col( "SELECT id FROM {$accounts_table} WHERE api_key LIKE 'test_sk_%'" );
	$id_list     = purecart_seed_id_list( array_map( 'intval', $account_ids ) );

	$counts = array();

	// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- $id_list is built from purecart_seed_id_list(), integers only.
	$counts[ $tokens_table ] = (int) $wpdb->query( "DELETE FROM {$tokens_table} WHERE account_id IN ({$id_list})" );
	// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- As above.
	$counts[ $accounts_table ] = (int) $wpdb->query( "DELETE FROM {$accounts_table} WHERE api_key LIKE 'test_sk_%'" );

	return $counts;
}

$results = array(
	'licensing'     => purecart_teardown_licensing(),
	'downloads'     => purecart_teardown_downloads(),
	'updates'       => purecart_teardown_updates(),
	'subscriptions' => purecart_teardown_subscriptions(),
	'saas'          => purecart_teardown_saas(),
);

foreach ( $results as $module => $counts ) {
	$line = sprintf( '%-14s %s', $module, wp_json_encode( $counts ) );
	// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Plain CLI text to STDOUT, not an HTTP response; nothing here is browser-rendered markup.
	class_exists( 'WP_CLI' ) ? WP_CLI::log( $line ) : print( $line . "\n" );
}

class_exists( 'WP_CLI' ) ? WP_CLI::success( 'PureCart test data removed.' ) : print( "Done.\n" );
