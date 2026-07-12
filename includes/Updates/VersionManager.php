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
	 * Insert a new plugin version record and compute its SHA-256 checksum.
	 *
	 * @since  1.0.0
	 * @param  array<string,mixed> $data Version data: product_id, version, file_path, requires_wp, tested_wp, requires_php, channel, changelog.
	 * @return object|null               The inserted version row, or null on failure.
	 */
	public function create( array $data ): ?object {
		global $wpdb;

		$file_path = (string) ( $data['file_path'] ?? '' );
		$checksum  = file_exists( $file_path ) ? hash_file( 'sha256', $file_path ) : '';

        // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery -- Custom table INSERT; no WP API available.
		$inserted = $wpdb->insert(
			$wpdb->prefix . 'purecart_product_versions',
			array(
				'product_id'      => (int) ( $data['product_id'] ?? 0 ),
				'version'         => (string) ( $data['version'] ?? '' ),
				'file_path'       => $file_path,
				'checksum_sha256' => $checksum,
				'requires_wp'     => (string) ( $data['requires_wp'] ?? '' ),
				'tested_wp'       => (string) ( $data['tested_wp'] ?? '' ),
				'requires_php'    => (string) ( $data['requires_php'] ?? '' ),
				'channel'         => in_array( $data['channel'] ?? '', array( 'beta', 'stable' ), true )
										? $data['channel'] : 'stable',
				'changelog'       => wp_kses_post( (string) ( $data['changelog'] ?? '' ) ),
				'released_at'     => current_time( 'mysql' ),
			),
			array( '%d', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s' )
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

	/**
	 * Fetch the latest version record for a product on the given release channel.
	 *
	 * @since  1.0.0
	 * @param  int    $product_id WooCommerce product ID.
	 * @param  string $channel    Release channel: 'stable' or 'beta'.
	 * @return object|null             The latest version row, or null if none exists.
	 */
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

	/**
	 * Retrieve all version records for a product, ordered newest first.
	 *
	 * @since  1.0.0
	 * @param  int $product_id WooCommerce product ID.
	 * @return array<int, object>
	 */
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
		) ?: array();
	}

	/**
	 * Fetch a single version record by its primary key.
	 *
	 * @since  1.0.0
	 * @param  int $version_id The purecart_product_versions row ID.
	 * @return object|null             The version row, or null if not found.
	 */
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

	/**
	 * Delete a version record and its associated file, then bust the version cache.
	 *
	 * @since  1.0.0
	 * @param  int $version_id The purecart_product_versions row ID.
	 * @return bool             True if the record was deleted, false otherwise.
	 */
	public function delete( int $version_id ): bool {
		global $wpdb;

		$version = $this->get_by_id( $version_id );
		if ( $version && file_exists( $version->file_path ) ) {
			wp_delete_file( $version->file_path );
		}

        // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching -- DELETE from custom table; cache bust follows.
		$deleted = (bool) $wpdb->delete(
			$wpdb->prefix . 'purecart_product_versions',
			array( 'id' => $version_id ),
			array( '%d' )
		);

		if ( $deleted ) {
			wp_cache_delete( "purecart_version_{$version_id}", 'purecart' );
			if ( $version ) {
				wp_cache_delete( "purecart_version_latest_{$version->product_id}_stable", 'purecart' );
				wp_cache_delete( "purecart_version_latest_{$version->product_id}_beta", 'purecart' );
			}
		}

		return $deleted;
	}
}
