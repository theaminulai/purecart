<?php
/**
 * Handles WooCommerce order events to provision licenses, downloads, and SaaS accounts.
 *
 * @package PureCart\Commerce
 */

declare( strict_types=1 );

namespace PureCart\Commerce;

defined( 'ABSPATH' ) || exit;

use PureCart\Licensing\LicenseGenerator;
use PureCart\Downloads\TokenManager;
use PureCart\SaaS\AccountProvisioner;

/**
 * Hooks into WooCommerce order lifecycle.
 */
class OrderHandler {

    public function __construct() {
        add_action( 'woocommerce_order_status_completed',        [ $this, 'on_order_complete' ], 10, 1 );
        add_action( 'woocommerce_order_status_refunded',         [ $this, 'on_order_refunded' ], 10, 1 );
        add_action( 'woocommerce_order_status_cancelled',        [ $this, 'on_order_cancelled' ], 10, 1 );
        add_action( 'woocommerce_subscription_status_cancelled', [ $this, 'on_subscription_cancelled' ], 10, 1 );

        // Action Scheduler handlers.
        add_action( 'purecart_check_expired_licenses', [ $this, 'expire_licenses' ] );
        add_action( 'purecart_process_dunning',        [ $this, 'run_dunning' ] );
    }

    public function on_order_complete( int $order_id ): void {
        $order = wc_get_order( $order_id );
        if ( ! $order ) {
            return;
        }

        foreach ( $order->get_items() as $item ) {
            /** @var \WC_Order_Item_Product $item */
            $product = $item->get_product();
            if ( ! $product ) {
                continue;
            }

            $product_id = $product->get_id();
            $user_id    = (int) $order->get_customer_id();
            $type       = $product->get_type();

            if ( in_array( $type, [ 'purecart_plugin', 'purecart_saas', 'purecart_bundle' ], true ) ) {
                ( new LicenseGenerator() )->create( $order_id, $user_id, $product_id );
            }

            if ( 'purecart_plugin' === $type || 'purecart_bundle' === $type ) {
                ( new TokenManager() )->create_token( $order_id, $user_id, $product_id );
            }

            if ( 'purecart_saas' === $type ) {
                ( new AccountProvisioner() )->provision( $order_id, $user_id, $product_id );
            }
        }

        do_action( 'purecart_order_provisioned', $order_id );
    }

    public function on_order_refunded( int $order_id ): void {
        $this->suspend_by_order( $order_id, 'refunded' );
        do_action( 'purecart_order_refunded', $order_id );
    }

    public function on_order_cancelled( int $order_id ): void {
        $this->suspend_by_order( $order_id, 'cancelled' );
        do_action( 'purecart_order_cancelled', $order_id );
    }

    public function on_subscription_cancelled( mixed $subscription ): void {
        $sub_id = is_object( $subscription ) ? $subscription->get_id() : (int) $subscription;
        do_action( 'purecart_subscription_cancelled', $sub_id );
    }

    public function expire_licenses(): void {
        global $wpdb;

        // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching -- Expiry check must be real-time; caching would miss newly expired licenses.
        $expired = $wpdb->get_col(
            $wpdb->prepare(
                "SELECT id FROM {$wpdb->prefix}purecart_licenses
                  WHERE status = 'active'
                    AND expires_at IS NOT NULL
                    AND expires_at < %s",
                current_time( 'mysql' )
            )
        );

        foreach ( $expired as $id ) {
            // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching -- Status update on custom table; must be real-time.
            $wpdb->update(
                $wpdb->prefix . 'purecart_licenses',
                [ 'status' => 'expired', 'updated_at' => current_time( 'mysql' ) ],
                [ 'id' => $id ],
                [ '%s', '%s' ],
                [ '%d' ]
            );

            do_action( 'purecart_license_expired', (int) $id );
        }
    }

    public function run_dunning(): void {
        do_action( 'purecart_dunning_processed' );
    }

    private function suspend_by_order( int $order_id, string $reason ): void {
        global $wpdb;

        // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching -- Bulk status update on refund/cancellation; must be immediate.
        $wpdb->update(
            $wpdb->prefix . 'purecart_licenses',
            [ 'status' => 'suspended', 'updated_at' => current_time( 'mysql' ) ],
            [ 'order_id' => $order_id ],
            [ '%s', '%s' ],
            [ '%d' ]
        );

        // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching -- Bulk status update on refund/cancellation; must be immediate.
        $wpdb->update(
            $wpdb->prefix . 'purecart_saas_accounts',
            [ 'status' => 'suspended' ],
            [ 'order_id' => $order_id ],
            [ '%s' ],
            [ '%d' ]
        );

        do_action( 'purecart_order_suspended', $order_id, $reason );
    }
}
