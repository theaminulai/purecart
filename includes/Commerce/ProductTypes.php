<?php
/**
 * Registers PureCart WooCommerce product types.
 *
 * Slugs: purecart_plugin | purecart_saas | purecart_bundle
 *
 * @package PureCart\Commerce
 */

declare( strict_types=1 );

namespace PureCart\Commerce;

defined( 'ABSPATH' ) || exit;

/**
 * Registers three custom WooCommerce product types.
 */
class ProductTypes {

	public const TYPE_PLUGIN = 'purecart_plugin';
	public const TYPE_SAAS   = 'purecart_saas';
	public const TYPE_BUNDLE = 'purecart_bundle';

	/**
	 * Register product type hooks.
	 *
	 * @since 1.0.0
	 */
	public function __construct() {
		add_filter( 'product_type_selector', array( $this, 'add_types' ) );
		add_action( 'woocommerce_product_class', array( $this, 'product_class' ), 10, 2 );
		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_type_js' ) );
	}

	/**
	 * Add PureCart product types to the WooCommerce product type selector.
	 *
	 * @since  1.0.0
	 * @param  array<string,string> $types Existing product type slug => label pairs.
	 * @return array<string,string>
	 */
	public function add_types( array $types ): array {
		$types[ self::TYPE_PLUGIN ] = __( 'PureCart – Plugin', 'purecart' );
		$types[ self::TYPE_SAAS ]   = __( 'PureCart – SaaS', 'purecart' );
		$types[ self::TYPE_BUNDLE ] = __( 'PureCart – Bundle', 'purecart' );
		return $types;
	}

	/**
	 * Map PureCart product types to WC_Product_Simple so WooCommerce handles them correctly.
	 *
	 * @since  1.0.0
	 * @param  string $classname    The default WooCommerce product class name.
	 * @param  string $product_type The product type slug.
	 * @return string
	 */
	public function product_class( string $classname, string $product_type ): string {
		if ( in_array( $product_type, array( self::TYPE_PLUGIN, self::TYPE_SAAS, self::TYPE_BUNDLE ), true ) ) {
			return \WC_Product_Simple::class;
		}
		return $classname;
	}

	/**
	 * Inline JS on the product edit screen to hide the Shipping tab for PureCart types.
	 *
	 * @since  1.0.0
	 * @param  string $hook Current admin page hook suffix.
	 * @return void
	 */
	public function enqueue_type_js( string $hook ): void {
		if ( 'post.php' !== $hook && 'post-new.php' !== $hook ) {
			return;
		}

		global $post;
		if ( ! $post || 'product' !== $post->post_type ) {
			return;
		}

		$purecart_types = wp_json_encode( array( self::TYPE_PLUGIN, self::TYPE_SAAS, self::TYPE_BUNDLE ) );

		wp_add_inline_script(
			'woocommerce_admin',
			sprintf(
				'(function($){
                    var purecartTypes = %s;
                    function purecartToggle(type) {
                        if (purecartTypes.indexOf(type) > -1) {
                            $(".shipping_tab").hide();
                        } else {
                            $(".shipping_tab").show();
                        }
                    }
                    $("select#product-type").on("change", function(){
                        purecartToggle($(this).val());
                    });
                    purecartToggle($("select#product-type").val());
                })(jQuery);',
				$purecart_types
			)
		);
	}
}
