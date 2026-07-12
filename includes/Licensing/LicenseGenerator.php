<?php
/**
 * Generates and stores license keys.
 *
 * @package PureCart\Licensing
 */

declare( strict_types=1 );

namespace PureCart\Licensing;

defined( 'ABSPATH' ) || exit;

/**
 * CRUD for the purecart_licenses table.
 */
class LicenseGenerator {

    public function create( int $order_id, int $user_id, int $product_id ): ?object {
        global $wpdb;

        $product = wc_get_product( $product_id );
        if ( ! $product ) {
            return null;
        }

        $plan_type     = $product->get_meta( '_purecart_license_type' )          ?: 'single';
        $act_limit     = (int) ( $product->get_meta( '_purecart_activation_limit' ) ?: 1 );
        $duration_days = (int) ( $product->get_meta( '_purecart_license_duration_days' ) ?: 365 );
        $expires_at    = 'lifetime' === $plan_type
            ? null
            : gmdate( 'Y-m-d H:i:s', strtotime( "+{$duration_days} days" ) );

        $license_key = $this->generate_key();

        // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery -- Custom table INSERT; no WP API available.
        $inserted = $wpdb->insert(
            $wpdb->prefix . 'purecart_licenses',
            [
                'order_id'         => $order_id,
                'user_id'          => $user_id,
                'product_id'       => $product_id,
                'license_key'      => $license_key,
                'plan_type'        => $plan_type,
                'status'           => 'active',
                'activation_limit' => $act_limit,
                'activated_count'  => 0,
                'expires_at'       => $expires_at,
                'created_at'       => current_time( 'mysql' ),
                'updated_at'       => current_time( 'mysql' ),
            ],
            [ '%d', '%d', '%d', '%s', '%s', '%s', '%d', '%d', '%s', '%s', '%s' ]
        );

        if ( ! $inserted ) {
            return null;
        }

        // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching -- Fetching the row just inserted; no stale cache risk.
        $license = $wpdb->get_row(
            $wpdb->prepare(
                "SELECT * FROM {$wpdb->prefix}purecart_licenses WHERE id = %d",
                $wpdb->insert_id
            )
        );

        do_action( 'purecart_license_created', $license );

        return $license;
    }

    public function get_by_key( string $license_key ): ?object {
        global $wpdb;

        // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching -- License validation is security-critical; cached results could allow revoked/expired licenses through.
        return $wpdb->get_row(
            $wpdb->prepare(
                "SELECT * FROM {$wpdb->prefix}purecart_licenses WHERE license_key = %s LIMIT 1",
                $license_key
            )
        ) ?: null;
    }

    public function get_by_user( int $user_id ): array {
        global $wpdb;

        // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching -- User license list changes on every order/activation; caching would show stale data in the customer dashboard.
        return $wpdb->get_results(
            $wpdb->prepare(
                "SELECT l.*, p.post_title AS product_name
                   FROM {$wpdb->prefix}purecart_licenses l
                   LEFT JOIN {$wpdb->posts} p ON p.ID = l.product_id
                  WHERE l.user_id = %d
                  ORDER BY l.created_at DESC",
                $user_id
            )
        ) ?: [];
    }

    /** Generate a formatted license key: XXXXXX-XXXXXX-XXXXXX-XXXXXX */
    private function generate_key(): string {
        $segments = [];
        for ( $i = 0; $i < 4; $i++ ) {
            $segments[] = strtoupper( bin2hex( random_bytes( 3 ) ) );
        }
        return implode( '-', $segments );
    }
}
