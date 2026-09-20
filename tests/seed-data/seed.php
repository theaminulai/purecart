<?php
/**
 * Seeds sample rows into every PureCart custom table so the 5 completed
 * backend modules (Licensing, Downloads, Updates, Subscriptions, SaaS) can
 * be exercised manually without placing real WooCommerce orders.
 *
 * Usage (WP-CLI, from the WordPress root):
 *
 *   wp eval-file wp-content/plugins/woo-digital-downloads/tests/seed-data/seed.php
 *
 * Safe to re-run: every insert deletes any previous row with the same
 * marker value first (license_key, token, gateway_subscription_id, api_key,
 * product_id+version), so running this twice updates the same rows instead
 * of duplicating them.
 *
 * @package PureCart\Tests
 */

if ( ! defined( 'ABSPATH' ) ) {
	// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_fwrite -- CLI-only entry point; WP_Filesystem isn't available before WordPress has bootstrapped.
	fwrite( STDERR, "Run this with WP-CLI, not php directly:\n  wp eval-file tests/seed-data/seed.php\n" );
	exit( 1 );
}

// ---------------------------------------------------------------------
// Adjust these to WooCommerce products / WP users that already exist on
// the site you're testing against — this script only writes PureCart's
// own rows, it does not create products or users.
// ---------------------------------------------------------------------
define( 'PURECART_SEED_PRODUCT_PLUGIN', 501 );   // WP plugin — licensed, has updates (Updates + Licensing).
define( 'PURECART_SEED_PRODUCT_THEME', 502 );    // WP theme — licensed (Licensing).
define( 'PURECART_SEED_PRODUCT_SOFTWARE', 503 ); // Non-WP desktop/CLI software (Downloads).
define( 'PURECART_SEED_PRODUCT_SAAS', 504 );     // SaaS plan product (SaaS).
define( 'PURECART_SEED_PRODUCT_SUB', 505 );      // Subscription product (Subscriptions).

define( 'PURECART_SEED_USER_ALICE', 101 ); // Active customer, good standing.
define( 'PURECART_SEED_USER_BOB', 102 );   // At activation limit / past_due / dunning scenario.
define( 'PURECART_SEED_USER_CAROL', 103 ); // Expired/revoked license, paused subscription.
define( 'PURECART_SEED_USER_DAVE', 104 );  // SaaS customer, cancelled-subscription scenario.
define( 'PURECART_SEED_USER_ERIN', 105 );  // Trialing subscription.

// Make sure every custom table (including columns added by later
// migrations, e.g. product_versions.is_rollback) is up to date before
// inserting into it.
if ( class_exists( '\PureCart\Activator' ) ) {
	\PureCart\Activator::maybe_upgrade();
}

require __DIR__ . '/licensing-seed.php';
require __DIR__ . '/downloads-seed.php';
require __DIR__ . '/updates-seed.php';
require __DIR__ . '/subscriptions-seed.php';
require __DIR__ . '/saas-seed.php';

$results = array(
	'licensing'     => purecart_seed_licensing(),
	'downloads'     => purecart_seed_downloads(),
	'updates'       => purecart_seed_updates(),
	'subscriptions' => purecart_seed_subscriptions(),
	'saas'          => purecart_seed_saas(),
);

foreach ( $results as $module => $summary ) {
	$line = sprintf( '%-14s %s', $module, wp_json_encode( $summary ) );
	// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Plain CLI text to STDOUT, not an HTTP response; nothing here is browser-rendered markup.
	class_exists( 'WP_CLI' ) ? WP_CLI::log( $line ) : print( $line . "\n" );
}

class_exists( 'WP_CLI' ) ? WP_CLI::success( 'PureCart test data seeded.' ) : print( "Done.\n" );
