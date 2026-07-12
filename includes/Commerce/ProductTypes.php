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

    public function __construct() {
        add_filter( 'product_type_selector',     [ $this, 'add_types' ] );
        add_action( 'woocommerce_product_class', [ $this, 'product_class' ], 10, 2 );
        add_action( 'admin_enqueue_scripts',     [ $this, 'enqueue_type_js' ] );
    }

    /** @param array<string,string> $types */
    public function add_types( array $types ): array {
        $types[ self::TYPE_PLUGIN ] = __( 'PureCart – Plugin', 'purecart' );
        $types[ self::TYPE_SAAS ]   = __( 'PureCart – SaaS',   'purecart' );
        $types[ self::TYPE_BUNDLE ] = __( 'PureCart – Bundle', 'purecart' );
        return $types;
    }

    public function product_class( string $classname, string $product_type ): string {
        if ( in_array( $product_type, [ self::TYPE_PLUGIN, self::TYPE_SAAS, self::TYPE_BUNDLE ], true ) ) {
            return \WC_Product_Simple::class;
        }
        return $classname;
    }

    public function enqueue_type_js( string $hook ): void {
        if ( 'post.php' !== $hook && 'post-new.php' !== $hook ) {
            return;
        }

        global $post;
        if ( ! $post || 'product' !== $post->post_type ) {
            return;
        }

        $purecart_types = wp_json_encode( [ self::TYPE_PLUGIN, self::TYPE_SAAS, self::TYPE_BUNDLE ] );

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
