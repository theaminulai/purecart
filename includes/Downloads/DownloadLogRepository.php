<?php
/**
 * Admin query layer over wp_purecart_download_logs / wp_purecart_downloads.
 *
 * @package PureCart\Downloads
 */

declare( strict_types=1 );

namespace PureCart\Downloads;

defined( 'ABSPATH' ) || exit;

/**
 * Read-side queries for the admin Downloads log/token management screens.
 *
 * TokenManager owns token lifecycle writes (create/revoke/regenerate); this
 * class owns the admin-facing reads that join those rows with product/order/
 * customer context, mirroring how LicenseGenerator carries both concerns for
 * Licensing but split out here since the log table and the token table are
 * two separate stores.
 *
 * @since 1.0.0
 */
class DownloadLogRepository {

	/**
	 * Every download-log row (success + rejected attempts), newest first,
	 * joined with its token and product/customer context.
	 *
	 * Fetches every row and filters/paginates in PHP, same trade-off
	 * API\Licenses::list_licenses() makes: an admin-only listing, not a
	 * high-frequency query path.
	 *
	 * @since 1.0.0
	 * @return array<int, object>
	 */
	public function find_all(): array {
		global $wpdb;

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching -- Admin listing; must reflect a just-logged download attempt.
		return $wpdb->get_results(
			"SELECT log.id, log.download_id, log.ip_address, log.user_agent, log.status, log.downloaded_at,
                    d.order_id, d.user_id, d.product_id, d.file_id, d.token,
                    d.download_count, d.max_downloads, d.expires_at, d.status AS token_status,
                    p.post_title AS product_name, f.post_title AS file_label,
                    u.display_name AS customer_name, u.user_email AS customer_email
               FROM {$wpdb->prefix}purecart_download_logs log
               JOIN {$wpdb->prefix}purecart_downloads d ON d.id = log.download_id
               LEFT JOIN {$wpdb->posts} p ON p.ID = d.product_id
               LEFT JOIN {$wpdb->posts} f ON f.ID = d.file_id
               LEFT JOIN {$wpdb->users} u ON u.ID = d.user_id
           ORDER BY log.downloaded_at DESC"
		) ?: array();
	}

	/**
	 * Every download token row (one per product per order), newest first,
	 * without the per-attempt log join — used for the "Tokens Expiring" KPI
	 * and the token-centric parts of the admin UI.
	 *
	 * @since 1.0.0
	 * @return array<int, object>
	 */
	public function find_all_tokens(): array {
		global $wpdb;

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching -- Admin listing; must reflect a just-issued/just-revoked token.
		return $wpdb->get_results(
			"SELECT d.*, p.post_title AS product_name, u.display_name AS customer_name, u.user_email AS customer_email
               FROM {$wpdb->prefix}purecart_downloads d
               LEFT JOIN {$wpdb->posts} p ON p.ID = d.product_id
               LEFT JOIN {$wpdb->users} u ON u.ID = d.user_id
           ORDER BY d.created_at DESC"
		) ?: array();
	}

	/**
	 * One download token row with product/customer context, for row actions
	 * (revoke/regenerate) that need to re-render after mutating.
	 *
	 * @since 1.0.0
	 * @param int $download_id purecart_downloads row ID.
	 * @return object|null
	 */
	public function get_token( int $download_id ): ?object {
		global $wpdb;

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching -- Admin detail/refresh view; must reflect a just-issued/just-revoked token.
		return $wpdb->get_row(
			$wpdb->prepare(
				"SELECT d.*, p.post_title AS product_name, u.display_name AS customer_name, u.user_email AS customer_email
                   FROM {$wpdb->prefix}purecart_downloads d
                   LEFT JOIN {$wpdb->posts} p ON p.ID = d.product_id
                   LEFT JOIN {$wpdb->users} u ON u.ID = d.user_id
                  WHERE d.id = %d",
				$download_id
			)
		) ?: null;
	}

	/**
	 * Counts behind the Downloads list's KPI strip.
	 *
	 * @since 1.0.0
	 * @return array{totalDownloads: int, uniqueFiles: int, failedAttempts: int, tokensExpiringIn24h: int}
	 */
	public function stats(): array {
		global $wpdb;

		$logs_table   = $wpdb->prefix . 'purecart_download_logs';
		$tokens_table = $wpdb->prefix . 'purecart_downloads';

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- Admin KPI strip, must reflect current table state; {$logs_table}/{$tokens_table} are not user input, status is bound below.
		$total_downloads = (int) $wpdb->get_var( $wpdb->prepare( "SELECT COUNT(*) FROM {$logs_table} WHERE status = %s", 'success' ) );

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- As above.
		$unique_files = (int) $wpdb->get_var( "SELECT COUNT(DISTINCT file_id) FROM {$tokens_table}" );

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- As above; status is bound below.
		$failed_attempts = (int) $wpdb->get_var( $wpdb->prepare( "SELECT COUNT(*) FROM {$logs_table} WHERE status != %s", 'success' ) );

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- As above; all values are bound below.
		$expiring_24h = (int) $wpdb->get_var(
			$wpdb->prepare(
				"SELECT COUNT(*) FROM {$tokens_table} WHERE status = %s AND expires_at BETWEEN %s AND %s",
				'active',
				current_time( 'mysql' ),
				gmdate( 'Y-m-d H:i:s', strtotime( '+24 hours' ) )
			)
		);

		return array(
			'totalDownloads'      => $total_downloads,
			'uniqueFiles'         => $unique_files,
			'failedAttempts'      => $failed_attempts,
			'tokensExpiringIn24h' => $expiring_24h,
		);
	}
}
