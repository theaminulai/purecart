<?php
/**
 * Manages product version records (plugin ZIPs).
 *
 * @package PureCart\Updates
 */

declare( strict_types=1 );

namespace PureCart\Updates;

defined( 'ABSPATH' ) || exit;

/**
 * CRUD for the purecart_product_versions table.
 */
class VersionManager {

    /**
     * Insert a new version record.
     *
     * @param array<string,mixed> $data
     */
    public function create( array $data ): ?object {
        global $wpdb;

        $file_path = (string) ( $data['file_path'] ?? '' );
        $checksum  = file_exists( $file_path ) ? hash_file( 'sha256', $file_path ) : '';

        // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery -- Custom table INSERT; no WP API available.
        $inserted = $wpdb->insert(
            $wpdb->prefix . 'purecart_product_versions',
            [
                'product_id'      => (int)    ( $data['product_id']   ?? 0 ),
                'version'         => (string) ( $data['version']      ?? '' ),
                'file_path'       => $file_path,
                'checksum_sha256' => $checksum,
                'requires_wp'     => (string) ( $data['requires_wp']  ?? '' ),
                'tested_wp'       => (string) ( $data['tested_wp']    ?? '' ),
                'requires_php'    => (string) ( $data['requires_php'] ?? '' ),
                'channel'         => in_array( $data['channel'] ?? '', [ 'beta', 'stable' ], true )
                                        ? $data['channel'] : 'stable',
                'changelog'       => wp_kses_post( (string) ( $data['changelog'] ?? '' ) ),
                'released_at'     => current_time( 'mysql' ),
            ],
            [ '%d', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s' ]
        );

        if ( ! $inserted ) {
            return null;
        }

        // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching -- Fetching the row just inserted; no stale cache risk.
        $version = $wpdb->get_row(
            $wpdb->prepare(
                "SELECT * FROM {$wpdb->prefix}purecart_product_versions WHERE id = %d",
                $wpdb->insert_id
            )
        );

        do_action( 'purecart_version_added', $version );

        return $version;
    }

    public function get_latest( int $product_id, string $channel = 'stable' ): ?object {
        global $wpdb;

        $cache_key = "purecart_version_latest_{$product_id}_{$channel}";
        $cached    = wp_cache_get( $cache_key, 'purecart' );
        if ( false !== $cached ) {
            return $cached ?: null;
        }

        // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery -- Custom table; result cached above.
        $result = $wpdb->get_row(
            $wpdb->prepare(
                "SELECT * FROM {$wpdb->prefix}purecart_product_versions
                  WHERE product_id = %d AND channel = %s
                  ORDER BY released_at DESC
                  LIMIT 1",
                $product_id,
                $channel
            )
        ) ?: null;

        wp_cache_set( $cache_key, $result ?? false, 'purecart', 5 * MINUTE_IN_SECONDS );

        return $result;
    }

    public function get_all( int $product_id ): array {
        global $wpdb;

        // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching -- Admin-only list; changes on every upload, caching would show stale versions.
        return $wpdb->get_results(
            $wpdb->prepare(
                "SELECT * FROM {$wpdb->prefix}purecart_product_versions
                  WHERE product_id = %d
                  ORDER BY released_at DESC",
                $product_id
            )
        ) ?: [];
    }

    public function get_by_id( int $version_id ): ?object {
        global $wpdb;

        $cache_key = "purecart_version_{$version_id}";
        $cached    = wp_cache_get( $cache_key, 'purecart' );
        if ( false !== $cached ) {
            return $cached ?: null;
        }

        // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery -- Custom table; result cached above.
        $result = $wpdb->get_row(
            $wpdb->prepare(
                "SELECT * FROM {$wpdb->prefix}purecart_product_versions WHERE id = %d LIMIT 1",
                $version_id
            )
        ) ?: null;

        wp_cache_set( $cache_key, $result ?? false, 'purecart', 5 * MINUTE_IN_SECONDS );

        return $result;
    }

    public function delete( int $version_id ): bool {
        global $wpdb;

        $version = $this->get_by_id( $version_id );
        if ( $version && file_exists( $version->file_path ) ) {
            wp_delete_file( $version->file_path );
        }

        // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching -- DELETE from custom table; cache bust follows.
        $deleted = (bool) $wpdb->delete(
            $wpdb->prefix . 'purecart_product_versions',
            [ 'id' => $version_id ],
            [ '%d' ]
        );

        if ( $deleted ) {
            wp_cache_delete( "purecart_version_{$version_id}", 'purecart' );
            if ( $version ) {
                wp_cache_delete( "purecart_version_latest_{$version->product_id}_stable", 'purecart' );
                wp_cache_delete( "purecart_version_latest_{$version->product_id}_beta",   'purecart' );
            }
        }

        return $deleted;
    }
}
