<?php
/**
 * Plugin Name:       PureCart for WooCommerce
 * Description:       The complete digital product suite for WooCommerce. Sell plugins, SaaS, and any digital file with secure delivery, licensing, and subscriptions.
 * Version:           1.0.0
 * Requires at least: 6.0
 * Requires PHP:      8.1
 * Author:            PureCart team
 * License:           GPL-3.0+
 * License URI:       https://www.gnu.org/licenses/gpl-3.0.html
 * Text Domain:       purecart
 * Domain Path:       /languages
 * WC requires at least: 9.8
 * WC tested up to:      10.8.1
 *
 * @package PureCart
 */

declare( strict_types=1 );

defined( 'ABSPATH' ) || exit;

define( 'PURECART_FILE', __FILE__ );

// Retrieve version dynamically from this file's header.
$purecart_plugin_data    = get_file_data( PURECART_FILE, [ 'Version' => 'Version' ], 'plugin' );
$purecart_plugin_version = ! empty( $purecart_plugin_data['Version'] ) ? $purecart_plugin_data['Version'] : '0.0.1';

// Define plugin constants.
define( 'PURECART_VERSION',       $purecart_plugin_version );
define( 'PURECART_PATH',          plugin_dir_path( PURECART_FILE ) );
define( 'PURECART_URL',           plugin_dir_url( PURECART_FILE ) );
define( 'PURECART_BASENAME',      plugin_basename( PURECART_FILE ) );
define( 'PURECART_API_NAMESPACE', 'purecart/v1' );

// Shorthand aliases used throughout the codebase.
define( 'PURECART_PLUGIN_DIR',  PURECART_PATH );
define( 'PURECART_PLUGIN_URL',  PURECART_URL );
define( 'PURECART_PLUGIN_FILE', PURECART_FILE );

// Built-in PSR-4 autoloader for the PureCart\ namespace.
// Works without `composer install` — plugin is fully self-contained.
spl_autoload_register( static function ( string $class ): void {
    if ( strncmp( $class, 'PureCart\\', 9 ) !== 0 ) {
        return;
    }
    $relative = substr( $class, 9 );
    $file     = PURECART_PATH . 'includes' . DIRECTORY_SEPARATOR
                . str_replace( '\\', DIRECTORY_SEPARATOR, $relative ) . '.php';
    if ( file_exists( $file ) ) {
        require_once $file;
    }
} );

// Optional Composer vendor autoloader (third-party deps only).
if ( file_exists( PURECART_PATH . 'vendor/autoload.php' ) ) {
    require_once PURECART_PATH . 'vendor/autoload.php';
}

// WooCommerce dependency check + bootstrap.
add_action( 'plugins_loaded', static function (): void {
    if ( ! class_exists( 'WooCommerce' ) ) {
        add_action( 'admin_notices', static function (): void {
            printf(
                '<div class="notice notice-error"><p>%s</p></div>',
                esc_html__( 'PureCart for WooCommerce requires WooCommerce to be installed and active.', 'purecart' )
            );
        } );
        return;
    }

    // WordPress auto-loads translations for WP.org-hosted plugins since WP 4.6.
    \PureCart\Plugin::instance();
}, 11 );

// HPOS (High-Performance Order Storage) compatibility declaration.
add_action( 'before_woocommerce_init', static function (): void {
    if ( class_exists( \Automattic\WooCommerce\Utilities\FeaturesUtil::class ) ) {
        \Automattic\WooCommerce\Utilities\FeaturesUtil::declare_compatibility(
            'custom_order_tables',
            PURECART_FILE,
            true
        );
    }
} );

// Activation / Deactivation hooks.
register_activation_hook( PURECART_FILE,   [ \PureCart\Activator::class, 'activate' ] );
register_deactivation_hook( PURECART_FILE, [ \PureCart\Activator::class, 'deactivate' ] );

/**
 * Global helper — returns the plugin singleton.
 *
 * @return \PureCart\Plugin
 */
function purecart_plugin(): \PureCart\Plugin {
    return \PureCart\Plugin::instance();
}
