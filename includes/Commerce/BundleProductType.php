<?php
declare( strict_types=1 );
/**
 * WC_Product subclass for the "PureCart – Bundle" product type.
 *
 * @package PureCart\Commerce
 */

namespace PureCart\Commerce;

defined( 'ABSPATH' ) || exit;

/**
 * WC_Product subclass that fixes type-detection for the "PureCart – Bundle" product type.
 *
 * Overrides WC_Product_Simple::get_type() so that the product self-reports as
 * 'purecart_bundle' rather than 'simple'. See PluginProductType's class docblock
 * for a full explanation of why mapping to WC_Product_Simple alone is insufficient.
 *
 * @since 1.0.0
 */
class BundleProductType extends \WC_Product_Simple {

	/**
	 * Returns the WooCommerce product type slug for Bundle products.
	 *
	 * @since 1.0.0
	 * @return string
	 */
	public function get_type() {
		return ProductTypes::TYPE_BUNDLE;
	}
}
