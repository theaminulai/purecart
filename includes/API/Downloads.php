<?php
/**
 * Admin REST routes for the Secure Downloads module.
 *
 * @package PureCart\Api
 */

declare( strict_types=1 );

namespace PureCart\API;

use PureCart\Downloads\DownloadLogRepository;
use PureCart\Downloads\TokenManager;
use PureCart\Settings\OptionKeys;
use PureCart\Settings\Settings;

defined( 'ABSPATH' ) || exit;

/**
 * No admin-facing REST surface existed for downloads at all — only the
 * dispatcher that streams a file when a customer visits a token URL. This is
 * the missing admin surface, under `/downloads/*`, gated behind
 * `manage_woocommerce` throughout — mirrors API\Licenses's split between
 * customer-facing token consumption (DownloadDispatcher) and admin
 * management (this controller).
 *
 * Instantiated directly from Plugin::init() rather than via a Downloads
 * `Module` class, since the Downloads module has no bootstrap of its own.
 *
 * @since 1.0.0
 */
class Downloads extends PureCartApi {

	/** Admin-facing log/token queries. @var DownloadLogRepository */
	private DownloadLogRepository $repository;

	/** Token lifecycle writes (revoke/regenerate). @var TokenManager */
	private TokenManager $tokens;

	/**
	 * Builds the two domain classes this controller adapts to REST.
	 *
	 * @since 1.0.0
	 */
	public function __construct() {
		$this->repository = new DownloadLogRepository();
		$this->tokens     = new TokenManager();
	}

	/**
	 * Every route on this controller is admin-only.
	 *
	 * @since 1.0.0
	 * @return bool
	 */
	public function permission_admin(): bool {
		return current_user_can( 'manage_woocommerce' );
	}

	// -----------------------------------------------------------------------
	// Route registration
	// -----------------------------------------------------------------------

	/**
	 * Registers every /downloads/* route.
	 *
	 * @since 1.0.0
	 * @return void
	 */
	public function register_routes(): void {
		$ns   = PURECART_API_NAMESPACE;
		$base = '/downloads';

		register_rest_route(
			$ns,
			$base . '/log',
			array(
				'methods'             => \WP_REST_Server::READABLE,
				'callback'            => array( $this, 'list_logs' ),
				'permission_callback' => array( $this, 'permission_admin' ),
			)
		);

		register_rest_route(
			$ns,
			$base . '/log/export',
			array(
				'methods'             => \WP_REST_Server::READABLE,
				'callback'            => array( $this, 'export_csv' ),
				'permission_callback' => array( $this, 'permission_admin' ),
			)
		);

		register_rest_route(
			$ns,
			$base . '/delivery-test',
			array(
				'methods'             => \WP_REST_Server::READABLE,
				'callback'            => array( $this, 'delivery_test' ),
				'permission_callback' => array( $this, 'permission_admin' ),
			)
		);

		register_rest_route(
			$ns,
			$base . '/bulk-revoke',
			array(
				'methods'             => \WP_REST_Server::CREATABLE,
				'callback'            => array( $this, 'bulk_revoke' ),
				'permission_callback' => array( $this, 'permission_admin' ),
			)
		);

		foreach ( array(
			'revoke'     => 'admin_revoke',
			'regenerate' => 'admin_regenerate',
		) as $action => $callback ) {
			register_rest_route(
				$ns,
				$base . '/token/(?P<id>\d+)/' . $action,
				array(
					'methods'             => \WP_REST_Server::CREATABLE,
					'callback'            => array( $this, $callback ),
					'permission_callback' => array( $this, 'permission_admin' ),
				)
			);
		}

		register_rest_route(
			$ns,
			$base . '/settings',
			array(
				array(
					'methods'             => \WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_settings' ),
					'permission_callback' => array( $this, 'permission_admin' ),
				),
				array(
					'methods'             => \WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'save_settings' ),
					'permission_callback' => array( $this, 'permission_admin' ),
					'args'                => array(
						'expiry_seconds' => array(
							'type'              => 'integer',
							'sanitize_callback' => 'absint',
							'required'          => false,
						),
						'max_count'      => array(
							'type'              => 'integer',
							'sanitize_callback' => 'absint',
							'required'          => false,
						),
					),
				),
			)
		);
	}

	// -----------------------------------------------------------------------
	// Read endpoints
	// -----------------------------------------------------------------------

	/**
	 * GET /downloads/log — admin log with the KPI strip's counts, optionally
	 * filtered by status/product/search/date-range, and paginated.
	 *
	 * Fetches every row and filters/paginates in PHP rather than in SQL —
	 * same trade-off API\Licenses::list_licenses() makes.
	 *
	 * @since 1.0.0
	 * @param \WP_REST_Request $request REST request.
	 * @return \WP_REST_Response
	 */
	public function list_logs( \WP_REST_Request $request ): \WP_REST_Response {
		$page      = max( 1, (int) ( $request->get_param( 'page' ) ?: 1 ) );
		$per_page  = max( 1, min( 100, (int) ( $request->get_param( 'perPage' ) ?: 20 ) ) );
		$search    = trim( (string) $request->get_param( 'search' ) );
		$status    = trim( (string) $request->get_param( 'status' ) );
		$product   = (int) $request->get_param( 'productId' );
		$date_from = trim( (string) $request->get_param( 'dateFrom' ) );

		$rows = $this->repository->find_all();

		$items = array();
		foreach ( $rows as $row ) {
			if ( '' !== $search ) {
				$q = strtolower( $search );
				if ( false === strpos( strtolower( (string) $row->customer_name ), $q )
					&& false === strpos( strtolower( (string) $row->customer_email ), $q )
					&& false === strpos( strtolower( (string) $row->product_name ), $q )
					&& false === strpos( strtolower( (string) $row->file_label ), $q )
					&& (string) $row->order_id !== $search
				) {
					continue;
				}
			}

			if ( '' !== $status && 'All' !== $status && $status !== $row->status ) {
				continue;
			}

			if ( $product > 0 && $product !== (int) $row->product_id ) {
				continue;
			}

			if ( '' !== $date_from && strtotime( (string) $row->downloaded_at ) < strtotime( $date_from ) ) {
				continue;
			}

			$items[] = $this->prepare_log_entry( $row );
		}

		$total       = count( $items );
		$total_pages = max( 1, (int) ceil( $total / $per_page ) );
		$offset      = ( $page - 1 ) * $per_page;

		return rest_ensure_response(
			array(
				'data'       => array_slice( $items, $offset, $per_page ),
				'total'      => $total,
				'totalPages' => $total_pages,
				'stats'      => $this->repository->stats(),
			)
		);
	}

	/**
	 * GET /downloads/log/export — CSV download of every log row.
	 *
	 * @since 1.0.0
	 * @return void Exits after streaming the CSV; never returns.
	 */
	public function export_csv(): void {
		nocache_headers();
		header( 'Content-Type: text/csv; charset=utf-8' );
		header( 'Content-Disposition: attachment; filename="purecart-download-log-' . gmdate( 'Y-m-d' ) . '.csv"' );

		// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_fopen -- Streaming a generated CSV directly to the response; WP_Filesystem has no streaming-output equivalent.
		$out = fopen( 'php://output', 'w' );
		fputcsv( $out, array( 'Time', 'Order', 'Customer', 'Email', 'Product', 'File', 'IP Address', 'Status' ) );

		foreach ( $this->repository->find_all() as $row ) {
			fputcsv(
				$out,
				array(
					(string) $row->downloaded_at,
					(string) $row->order_id,
					(string) $row->customer_name,
					(string) $row->customer_email,
					(string) $row->product_name,
					(string) ( $row->file_label ?: "File #{$row->file_id}" ),
					(string) $row->ip_address,
					(string) $row->status,
				)
			);
		}

		// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_fclose -- Pairs with the fopen() above.
		fclose( $out );
		exit;
	}

	/**
	 * GET /downloads/delivery-test — self-test of the local file-streaming
	 * delivery path (the only delivery method actually implemented today;
	 * S3/R2 presigned delivery is a later phase per docs/RND-secure-downloads.md).
	 *
	 * @since 1.0.0
	 * @return \WP_REST_Response
	 */
	public function delivery_test(): \WP_REST_Response {
		$dir = wp_upload_dir()['basedir'] . '/purecart-protected';

		if ( ! is_dir( $dir ) ) {
			wp_mkdir_p( $dir );
		}

		$ok = is_dir( $dir ) && is_writable( $dir ) && function_exists( 'readfile' );

		return rest_ensure_response(
			array(
				'success' => $ok,
				'message' => $ok
					? __( 'Delivery OK — protected uploads path is writable.', 'purecart' )
					: __( 'Delivery failed — protected uploads path is missing or not writable.', 'purecart' ),
			)
		);
	}

	// -----------------------------------------------------------------------
	// Action endpoints
	// -----------------------------------------------------------------------

	/**
	 * POST /downloads/token/{id}/revoke
	 *
	 * @since 1.0.0
	 * @param \WP_REST_Request $request REST request.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function admin_revoke( \WP_REST_Request $request ) {
		$id = (int) $request->get_param( 'id' );

		if ( ! $this->repository->get_token( $id ) ) {
			return new \WP_Error( 'purecart_not_found', __( 'Download token not found.', 'purecart' ), array( 'status' => 404 ) );
		}

		$this->tokens->revoke( $id );

		return rest_ensure_response(
			array(
				'success' => true,
				'token'   => $this->prepare_token( $this->repository->get_token( $id ) ),
			)
		);
	}

	/**
	 * POST /downloads/token/{id}/regenerate
	 *
	 * @since 1.0.0
	 * @param \WP_REST_Request $request REST request.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function admin_regenerate( \WP_REST_Request $request ) {
		$id = (int) $request->get_param( 'id' );

		if ( ! $this->repository->get_token( $id ) ) {
			return new \WP_Error( 'purecart_not_found', __( 'Download token not found.', 'purecart' ), array( 'status' => 404 ) );
		}

		$this->tokens->regenerate( $id );

		return rest_ensure_response(
			array(
				'success' => true,
				'token'   => $this->prepare_token( $this->repository->get_token( $id ) ),
			)
		);
	}

	/**
	 * POST /downloads/bulk-revoke — body: { ids: number[] } of download_id.
	 *
	 * @since 1.0.0
	 * @param \WP_REST_Request $request REST request.
	 * @return \WP_REST_Response
	 */
	public function bulk_revoke( \WP_REST_Request $request ): \WP_REST_Response {
		$ids = (array) $request->get_param( 'ids' );

		$revoked = 0;
		foreach ( $ids as $id ) {
			if ( $this->tokens->revoke( (int) $id ) ) {
				++$revoked;
			}
		}

		return rest_ensure_response(
			array(
				'success' => true,
				'revoked' => $revoked,
			)
		);
	}

	// -----------------------------------------------------------------------
	// Settings
	// -----------------------------------------------------------------------

	/**
	 * GET /downloads/settings
	 *
	 * @since 1.0.0
	 * @return \WP_REST_Response
	 */
	public function get_settings(): \WP_REST_Response {
		return rest_ensure_response(
			array(
				'expiry_seconds' => (int) Settings::get( OptionKeys::DOWNLOAD_EXPIRY_SECONDS, DAY_IN_SECONDS ),
				'max_count'      => (int) Settings::get( OptionKeys::DOWNLOAD_MAX_COUNT, 3 ),
			)
		);
	}

	/**
	 * POST /downloads/settings
	 *
	 * @since 1.0.0
	 * @param \WP_REST_Request $request REST request.
	 * @return \WP_REST_Response
	 */
	public function save_settings( \WP_REST_Request $request ): \WP_REST_Response {
		if ( null !== $request->get_param( 'expiry_seconds' ) ) {
			Settings::set( OptionKeys::DOWNLOAD_EXPIRY_SECONDS, max( 1, (int) $request->get_param( 'expiry_seconds' ) ) );
		}

		if ( null !== $request->get_param( 'max_count' ) ) {
			Settings::set( OptionKeys::DOWNLOAD_MAX_COUNT, max( 0, (int) $request->get_param( 'max_count' ) ) );
		}

		return rest_ensure_response(
			array(
				'success'        => true,
				'expiry_seconds' => (int) Settings::get( OptionKeys::DOWNLOAD_EXPIRY_SECONDS, DAY_IN_SECONDS ),
				'max_count'      => (int) Settings::get( OptionKeys::DOWNLOAD_MAX_COUNT, 3 ),
			)
		);
	}

	// -----------------------------------------------------------------------
	// Shaping
	// -----------------------------------------------------------------------

	/**
	 * Snake_case log row (joined with token/product/customer columns) to the
	 * camelCase shape the SPA expects.
	 *
	 * @since 1.0.0
	 * @param object $row Log row, joined with download/product/customer columns.
	 * @return array<string, mixed>
	 */
	private function prepare_log_entry( object $row ): array {
		$file_path = get_post_meta( (int) $row->file_id, '_purecart_file_path', true );

		return array(
			'id'             => (int) $row->id,
			'downloadId'     => (int) $row->download_id,
			'orderId'        => (int) $row->order_id,
			'productId'      => (int) $row->product_id,
			'fileId'         => (int) $row->file_id,
			'fileLabel'      => (string) ( $row->file_label ?: "File #{$row->file_id}" ),
			'fileExtension'  => $file_path ? strtolower( (string) pathinfo( (string) $file_path, PATHINFO_EXTENSION ) ) : '',
			'token'          => substr( (string) $row->token, -8 ),
			'status'         => (string) $row->status,
			'ipAddress'      => (string) $row->ip_address,
			'downloadedAt'   => (string) $row->downloaded_at,
			'customerName'   => (string) ( $row->customer_name ?? '' ),
			'customerEmail'  => (string) ( $row->customer_email ?? '' ),
			'productName'    => (string) ( $row->product_name ?? '' ) ?: "Product #{$row->product_id}",
			'tokenStatus'    => $this->token_lifecycle_status( $row->token_status, $row->expires_at ),
			'downloadCount'  => (int) $row->download_count,
			'maxDownloads'   => (int) $row->max_downloads,
			'expiresAt'      => (string) $row->expires_at,
		);
	}

	/**
	 * Snake_case token row to the camelCase shape the SPA expects.
	 *
	 * @since 1.0.0
	 * @param object $row Token row, joined with product/customer columns.
	 * @return array<string, mixed>
	 */
	private function prepare_token( object $row ): array {
		return array(
			'id'             => (int) $row->id,
			'orderId'        => (int) $row->order_id,
			'productId'      => (int) $row->product_id,
			'productName'    => (string) ( $row->product_name ?? '' ) ?: "Product #{$row->product_id}",
			'customerName'   => (string) ( $row->customer_name ?? '' ),
			'customerEmail'  => (string) ( $row->customer_email ?? '' ),
			'token'          => substr( (string) $row->token, -8 ),
			'downloadCount'  => (int) $row->download_count,
			'maxDownloads'   => (int) $row->max_downloads,
			'expiresAt'      => (string) $row->expires_at,
			'status'         => $this->token_lifecycle_status( $row->status, $row->expires_at ),
		);
	}

	/**
	 * Derives the 'active'|'expired'|'revoked' lifecycle status a token row
	 * doesn't store directly — 'expired' is computed from `expires_at`
	 * rather than persisted, since it changes on its own without a write.
	 *
	 * @since 1.0.0
	 * @param string $stored_status Raw `status` column value ('active'|'revoked').
	 * @param string $expires_at    MySQL datetime string.
	 * @return string
	 */
	private function token_lifecycle_status( string $stored_status, string $expires_at ): string {
		if ( 'revoked' === $stored_status ) {
			return 'revoked';
		}

		if ( strtotime( $expires_at ) < time() ) {
			return 'expired';
		}

		return 'active';
	}
}
