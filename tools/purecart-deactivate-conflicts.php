<?php
/**
 * PureCart — Conflict-plugin deactivation helper.
 *
 * USAGE
 * -----
 * Drop this file into your site's wp-content/mu-plugins/ folder.
 * It will silently prevent all listed plugins from loading on every request,
 * without triggering their deactivation hooks or removing them from disk —
 * they stay available for reference / code inspection.
 *
 * Remove this file once you have permanently deactivated or deleted the
 * conflicting plugins through WP Admin → Plugins.
 *
 * WHY A MU-PLUGIN AND NOT WP-CLI?
 * --------------------------------
 * `wp plugin deactivate` runs deactivation hooks (flush_rewrite_rules,
 * table drops, option cleanup) that may corrupt data from these R&D plugins.
 * Filtering `option_active_plugins` prevents loading without side-effects.
 *
 * @package PureCart\Tools
 */

defined( 'ABSPATH' ) || exit;

/**
 * Plugins that conflict with PureCart and must never load alongside it.
 *
 * Format: 'folder/main-file.php' — exactly as stored in the active_plugins option.
 *
 * @var string[]
 */
const PURECART_CONFLICT_PLUGINS = array(
	// Licensing competitors — hook into woocommerce_order_status_completed,
	// issue their own license keys, create duplicate meta on the same order.
	'software-license-manager/License-Manager.php',
	'license-manager-for-woocommerce/license-manager-for-woocommerce.php',
	'digital-license-manager/digital-license-manager.php',
	'wc-key-manager/wc-key-manager.php',

	// JWT / Bearer token interceptors — these hook rest_authentication_errors
	// and claim every Authorization: Bearer header before PureCart sees it,
	// causing 401s on /purecart/v1/license/activate and /saas/usage/*.
	'jwt-auth/jwt-auth.php',
	'jwt-authentication-for-wp-rest-api/jwt-authentication-for-wp-rest-api.php',
	'cocart-jwt-authentication/cocart-jwt-authentication.php',

	// Subscription competitors — hook woocommerce_order_status_completed and
	// the Action Scheduler group, causing double-provisioning of subscription
	// rows and duplicate renewal jobs.
	'arraysubs/arraysubs.php',
	'subscriptions-for-woocommerce/subscriptions-for-woocommerce.php',
	'sublium-subscriptions-for-woocommerce/sublium-subscriptions-for-woocommerce.php',
	'yith-woocommerce-subscription/init.php',
	'recurio/recurio.php',
	'milosubscriptions/milosubscriptions.php',
	'paid-member-subscriptions/index.php',

	// EDD — standalone eCommerce that adds its own product types and modifies
	// the WC checkout flow, bypasses WC file serving.
	'easy-digital-downloads/easy-digital-downloads.php',

	// Invizo Cart — modifies the cart in ways that conflict with PureCart's
	// download token + checkout flow. Verify before removing from this list.
	'invizo-cart/invizo-cart.php',
);

/**
 * Remove all conflicting plugins from the active_plugins option before
 * WordPress loads them. Runs before any plugin is instantiated.
 *
 * @param string[]|mixed $plugins Current value of the active_plugins option.
 * @return string[]
 */
add_filter(
	'option_active_plugins',
	static function ( $plugins ): array {
		if ( ! is_array( $plugins ) ) {
			return array();
		}
		return array_values(
			array_diff( $plugins, PURECART_CONFLICT_PLUGINS )
		);
	},
	0 // Priority 0 — before any plugin bootstrap.
);

/**
 * Same filter for multisite network-activated plugins.
 *
 * @param string[]|mixed $plugins Current value of the active_sitewide_plugins option.
 * @return mixed
 */
add_filter(
	'site_option_active_sitewide_plugins',
	static function ( $plugins ) {
		if ( ! is_array( $plugins ) ) {
			return $plugins;
		}
		foreach ( PURECART_CONFLICT_PLUGINS as $slug ) {
			unset( $plugins[ $slug ] );
		}
		return $plugins;
	},
	0
);

/**
 * Show a one-time admin notice reminding the site owner to permanently
 * deactivate these plugins through WP Admin when convenient.
 */
add_action(
	'admin_notices',
	static function (): void {
		if ( ! current_user_can( 'activate_plugins' ) ) {
			return;
		}
		$screen = function_exists( 'get_current_screen' ) ? get_current_screen() : null;
		if ( $screen && 'plugins' !== $screen->id ) {
			return;
		}
		echo '<div class="notice notice-warning is-dismissible"><p>'
			. '<strong>PureCart:</strong> '
			. esc_html__(
				'16 conflicting plugins are currently suppressed by the PureCart conflict-deactivation helper (mu-plugins/purecart-deactivate-conflicts.php). '
				. 'Please permanently deactivate them via WP Admin → Plugins, then remove that file.',
				'purecart'
			)
			. '</p></div>';
	}
);
