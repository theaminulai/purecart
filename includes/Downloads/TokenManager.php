<?php
/**
 * Creates and validates signed, expiring download tokens.
 *
 * @package PureCart\Downloads
 */

declare( strict_types=1 );

namespace PureCart\Downloads;

use PureCart\Settings\OptionKeys;
use PureCart\Settings\Settings;

defined( 'ABSPATH' ) || exit;

/**
 * Manages the purecart_downloads table.
 */
class TokenManager {

	/**
	 * Create a signed, expiring download token for a product in an order.
	 *
	 * @since  1.0.0
	 * @param  int $order_id   WooCommerce order ID.
	 * @param  int $user_id    WordPress user ID of the customer.
	 * @param  int $product_id WooCommerce product ID.
	 * @return object|null     The inserted download row, or null on failure.
	 */
	public function create_token( int $order_id, int $user_id, int $product_id ): ?object {
		global $wpdb;

		$file_id = (int) get_post_meta( $product_id, '_purecart_primary_file_id', true );
		if ( ! $file_id ) {
			return null;
		}

		$expiry_secs = (int) Settings::get( OptionKeys::DOWNLOAD_EXPIRY_SECONDS, DAY_IN_SECONDS );
		$max_count   = (int) Settings::get( OptionKeys::DOWNLOAD_MAX_COUNT, 3 );
		$token       = bin2hex( random_bytes( 32 ) );
		$expires_at  = gmdate( 'Y-m-d H:i:s', time() + $expiry_secs );

        // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery -- Custom table INSERT; no WP API available.
		$inserted = $wpdb->insert(
			$wpdb->prefix . 'purecart_downloads',
			array(
				'order_id'       => $order_id,
				'user_id'        => $user_id,
				'product_id'     => $product_id,
				'file_id'        => $file_id,
				'token'          => $token,
				'download_count' => 0,
				'max_downloads'  => $max_count,
				'expires_at'     => $expires_at,
				'ip_address'     => '',
				'country_code'   => '',
				'created_at'     => current_time( 'mysql' ),
			),
			array( '%d', '%d', '%d', '%d', '%s', '%d', '%d', '%s', '%s', '%s', '%s' )
		);

		if ( ! $inserted ) {
			return null;
		}

        // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching -- Custom table; result just inserted, no stale cache risk.
		return $wpdb->get_row(
			$wpdb->prepare(
				"SELECT * FROM {$wpdb->prefix}purecart_downloads WHERE id = %d",
				$wpdb->insert_id
			)
		);
	}

	/**
	 * Validate a download token and report why it failed, if it did.
	 *
	 * @since  1.0.0
	 * @param  string $token The hex download token.
	 * @return array{download: ?object, reason: ?string} `reason` is null on
	 *               success, otherwise one of 'not_found', 'expired',
	 *               'exhausted', 'revoked'. `download` is the row when found
	 *               (even if invalid), so callers can log against its ID.
	 */
	public function validate_token( string $token ): array {
		global $wpdb;

        // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching -- Token validation is time-sensitive; caching could allow replays of expired/exhausted tokens.
		$row = $wpdb->get_row(
			$wpdb->prepare(
				"SELECT * FROM {$wpdb->prefix}purecart_downloads WHERE token = %s LIMIT 1",
				$token
			)
		);

		if ( ! $row ) {
			return array(
				'download' => null,
				'reason'   => 'not_found',
			);
		}

		if ( 'revoked' === $row->status ) {
			return array(
				'download' => $row,
				'reason'   => 'revoked',
			);
		}

		if ( strtotime( $row->expires_at ) < time() ) {
			return array(
				'download' => $row,
				'reason'   => 'expired',
			);
		}

		// max_downloads = 0 means unlimited.
		if ( (int) $row->max_downloads > 0 && (int) $row->download_count >= (int) $row->max_downloads ) {
			return array(
				'download' => $row,
				'reason'   => 'exhausted',
			);
		}

		return array(
			'download' => $row,
			'reason'   => null,
		);
	}

	/**
	 * Increment the download counter and append a log entry for the given download.
	 *
	 * @since  1.0.0
	 * @param  int $download_id The purecart_downloads row ID.
	 * @return void
	 */
	public function increment_count( int $download_id ): void {
		global $wpdb;

        // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching -- Atomic counter increment on custom table.
		$wpdb->query(
			$wpdb->prepare(
				"UPDATE {$wpdb->prefix}purecart_downloads
                    SET download_count = download_count + 1
                  WHERE id = %d",
				$download_id
			)
		);

        // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery -- Append-only event log; no WP API available.
		$wpdb->insert(
			$wpdb->prefix . 'purecart_download_logs',
			array(
				'download_id'   => $download_id,
				'ip_address'    => sanitize_text_field( wp_unslash( $_SERVER['REMOTE_ADDR'] ?? '' ) ),
				'user_agent'    => sanitize_text_field( substr( wp_unslash( (string) ( $_SERVER['HTTP_USER_AGENT'] ?? '' ) ), 0, 500 ) ),
				'country_code'  => '',
				'downloaded_at' => current_time( 'mysql' ),
			),
			array( '%d', '%s', '%s', '%s', '%s' )
		);
	}

	/**
	 * Log a rejected download attempt against an existing download row.
	 *
	 * @since  1.0.0
	 * @param  int    $download_id The purecart_downloads row ID.
	 * @param  string $status      One of 'rejected_expired', 'rejected_exhausted',
	 *                             'rejected_revoked'.
	 * @return void
	 */
	public function log_rejected( int $download_id, string $status ): void {
		global $wpdb;

        // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery -- Append-only event log; no WP API available.
		$wpdb->insert(
			$wpdb->prefix . 'purecart_download_logs',
			array(
				'download_id'   => $download_id,
				'ip_address'    => sanitize_text_field( wp_unslash( $_SERVER['REMOTE_ADDR'] ?? '' ) ),
				'user_agent'    => sanitize_text_field( substr( wp_unslash( (string) ( $_SERVER['HTTP_USER_AGENT'] ?? '' ) ), 0, 500 ) ),
				'country_code'  => '',
				'status'        => $status,
				'downloaded_at' => current_time( 'mysql' ),
			),
			array( '%d', '%s', '%s', '%s', '%s', '%s' )
		);
	}

	/**
	 * Revoke a download token, blocking any further use.
	 *
	 * @since  1.0.0
	 * @param  int $download_id The purecart_downloads row ID.
	 * @return bool
	 */
	public function revoke( int $download_id ): bool {
		global $wpdb;

        // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery -- Custom table UPDATE; no WP API available.
		return false !== $wpdb->update(
			$wpdb->prefix . 'purecart_downloads',
			array( 'status' => 'revoked' ),
			array( 'id' => $download_id ),
			array( '%s' ),
			array( '%d' )
		);
	}

	/**
	 * Regenerate a download token: new token string, reset usage, fresh expiry.
	 *
	 * @since  1.0.0
	 * @param  int $download_id The purecart_downloads row ID.
	 * @return object|null      The updated row, or null if the row doesn't exist.
	 */
	public function regenerate( int $download_id ): ?object {
		global $wpdb;

		$expiry_secs = (int) Settings::get( OptionKeys::DOWNLOAD_EXPIRY_SECONDS, DAY_IN_SECONDS );
		$token       = bin2hex( random_bytes( 32 ) );
		$expires_at  = gmdate( 'Y-m-d H:i:s', time() + $expiry_secs );

        // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery -- Custom table UPDATE; no WP API available.
		$wpdb->update(
			$wpdb->prefix . 'purecart_downloads',
			array(
				'token'          => $token,
				'download_count' => 0,
				'expires_at'     => $expires_at,
				'status'         => 'active',
			),
			array( 'id' => $download_id ),
			array( '%s', '%d', '%s', '%s' ),
			array( '%d' )
		);

        // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching -- Custom table; result just updated, no stale cache risk.
		return $wpdb->get_row(
			$wpdb->prepare(
				"SELECT * FROM {$wpdb->prefix}purecart_downloads WHERE id = %d",
				$download_id
			)
		) ?: null;
	}

	/**
	 * Retrieve all download tokens for a given user, ordered newest first.
	 *
	 * @since  1.0.0
	 * @param  int $user_id WordPress user ID.
	 * @return array<int, object>
	 */
	public function get_by_user( int $user_id ): array {
		global $wpdb;

        // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching -- Custom table; results vary per user and update on every download, making persistent caching unreliable.
		return $wpdb->get_results(
			$wpdb->prepare(
				"SELECT d.*, p.post_title AS product_name
                   FROM {$wpdb->prefix}purecart_downloads d
                   LEFT JOIN {$wpdb->posts} p ON p.ID = d.product_id
                  WHERE d.user_id = %d
                  ORDER BY d.created_at DESC",
				$user_id
			)
		) ?: array();
	}
}
