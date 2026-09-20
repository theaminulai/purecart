<?php
/**
 * Standalone entry point for `composer test:demo`.
 *
 * Loads WordPress directly via wp-load.php so the seed data can run without
 * WP-CLI installed — this WAMP setup doesn't have `wp` on PATH. Prefer
 * `wp eval-file tests/seed-data/seed.php` instead wherever WP-CLI *is*
 * available (CI, staging, production); this file is the local fallback.
 *
 * @package PureCart\Tests
 */

// wp-content/plugins/woo-digital-downloads/tests/seed-data -> up 5 levels -> WP root.
$wp_load = dirname( __DIR__, 5 ) . '/wp-load.php';

if ( ! file_exists( $wp_load ) ) {
	// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_fwrite -- CLI-only entry point, runs before WordPress (and WP_Filesystem) has bootstrapped.
	fwrite( STDERR, "Could not find wp-load.php at: {$wp_load}\nThis assumes the plugin lives at wp-content/plugins/<slug>/tests/seed-data/ — edit the dirname() depth in run.php if your layout differs.\n" );
	exit( 1 );
}

require $wp_load;
require __DIR__ . '/seed.php';
