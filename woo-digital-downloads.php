<?php
/**
 * Plugin Name:       Woo Digital Downloads
 * Plugin URI:        https://x.com/woo-digital-downloads
 * Description:       The ultimate digital downloads extension for WooCommerce — a powerful alternative to Easy Digital Downloads.
 * Version:           1.0.0
 * Requires at least: 6.0
 * Requires PHP:      8.0
 * Author:             Digital Downloads
 * Author URI:        https://x.com
 * License:           GPL-3.0+
 * License URI:       https://www.gnu.org/licenses/gpl-3.0.html
 * Text Domain:       woo-digital-downloads
 * Domain Path:       /languages
 * WC requires at least: 8.0
 * WC tested up to:      9.0
 *
 * @package WooDigitalDownloads
 */

defined( 'ABSPATH' ) || exit;

define( 'WDD_FILE',          __FILE__ );
// Retrieve the version dynamically from this file's header comments
$plugin_data = get_file_data( WDD_FILE, array( 'Version' => 'Version' ), 'plugin' );
$plugin_version = ! empty( $plugin_data['Version'] ) ? $plugin_data['Version'] : '0.0.1';
// Define plugin constants
define( 'WDD_VERSION', $plugin_version );

define( 'WDD_PATH',          plugin_dir_path( WDD_FILE ) );
define( 'WDD_URL',           plugin_dir_url( WDD_FILE ) );
define( 'WDD_BASENAME',      plugin_basename( WDD_FILE ) );
define( 'WDD_API_NAMESPACE', 'wdd/v1' );

// Back-compat aliases used internally.
define( 'WDD_PLUGIN_DIR',  WDD_PATH );
define( 'WDD_PLUGIN_URL',  WDD_URL );
define( 'WDD_PLUGIN_FILE', WDD_FILE );

// Composer autoloader 
if ( file_exists( WDD_PATH . 'vendor/autoload.php' ) ) {
    require_once WDD_PATH . 'vendor/autoload.php';
} else {
    add_action( 'admin_notices', static function (): void {
        printf(
            '<div class="notice notice-error"><p>%s</p></div>',
            esc_html__(
                'Woo Digital Downloads: vendor/ directory not found. Run "composer install" in the plugin directory.',
                'woo-digital-downloads'
            )
        );
    } );
    return;
}

// WooCommerce dependency check

add_action( 'plugins_loaded', static function (): void {
    if ( ! class_exists( 'WooCommerce' ) ) {
        add_action( 'admin_notices', static function (): void {
            printf(
                '<div class="notice notice-error"><p>%s</p></div>',
                esc_html__( 'Woo Digital Downloads requires WooCommerce to be installed and active.', 'woo-digital-downloads' )
            );
        } );
        return;
    }

    load_plugin_textdomain( 'woo-digital-downloads', false, WDD_PATH . 'languages' );

    \WooDigitalDownloads\Plugin::instance();
}, 11 );

// HPOS compatibility

add_action( 'before_woocommerce_init', static function (): void {
    if ( class_exists( \Automattic\WooCommerce\Utilities\FeaturesUtil::class ) ) {
        \Automattic\WooCommerce\Utilities\FeaturesUtil::declare_compatibility(
            'custom_order_tables',
            WDD_FILE,
            true
        );
    }
} );

// Activation / Deactivation

register_activation_hook( WDD_FILE,   [ \WooDigitalDownloads\Activator::class, 'activate' ] );
register_deactivation_hook( WDD_FILE, [ \WooDigitalDownloads\Activator::class, 'deactivate' ] );

/**
 * Global helper — returns the plugin singleton.
 *
 * @return \WooDigitalDownloads\Plugin
 */
function wdd(): \WooDigitalDownloads\Plugin {
    return \WooDigitalDownloads\Plugin::instance();
}
