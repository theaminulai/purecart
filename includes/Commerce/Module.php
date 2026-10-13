<?php
declare( strict_types=1 );
/**
 * Commerce module bootstrap.
 *
 * Registers PureCart's three one-time purchase product types
 * (purecart_plugin, purecart_saas, purecart_bundle), wires order-lifecycle
 * provisioning, and loads the "License" product data tab on product edit screens.
 *
 * @package PureCart\Commerce
 */

namespace PureCart\Commerce;

defined( 'ABSPATH' ) || exit;

/**
 * Boots the Commerce module's classes.
 *
 * @since 1.0.0
 */
class Module {

	/**
	 * Boot Commerce classes.
	 *
	 * @since 1.0.0
	 */
	public function __construct() {
		new ProductTypes();
		new OrderHandler();

		if ( is_admin() ) {
			new ProductLicenseTab();
		}
	}
}
