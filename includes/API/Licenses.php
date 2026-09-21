<?php
/**
 * Admin REST routes for the Licensing module.
 *
 * @package PureCart\Api
 */

declare( strict_types=1 );

namespace PureCart\API;

use PureCart\Licensing\LicenseGenerator;
use PureCart\Licensing\LicenseActivator;

defined( 'ABSPATH' ) || exit;

/**
 * Every route on `/license/*` (singular) in RestApi.php is the customer-
 * facing/plugin-facing surface — activate, deactivate, check, revoke by key.
 * None of it is an admin list/detail/manage API, so the admin SPA's Licenses
 * pages had nothing to call. This is that missing admin surface, under
 * `/licenses/*` (plural), gated behind `manage_woocommerce` throughout —
 * mirrors how API\Subscriptions and API\Updates split "customer/plugin
 * endpoints" from "admin management endpoints".
 *
 * Instantiated directly from Plugin::init() rather than via a Licensing
 * `Module` class, since the Licensing module has no bootstrap of its own —
 * LicenseGenerator/LicenseActivator are plain, hookless domain classes.
 *
 * @since 1.0.0
 */
class Licenses extends PureCartApi {

	/** License row CRUD and admin lifecycle operations. @var LicenseGenerator */
	private LicenseGenerator $generator;

	/** Per-domain activation records. @var LicenseActivator */
	private LicenseActivator $activator;

	/**
	 * Builds the two domain classes this controller adapts to REST.
	 *
	 * @since 1.0.0
	 */
	public function __construct() {
		$this->generator = new LicenseGenerator();
		$this->activator = new LicenseActivator();
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
	 * Registers every /licenses/* and /reports/licenses/* route.
	 *
	 * @since 1.0.0
	 * @return void
	 */
	public function register_routes(): void {
		$ns   = PURECART_API_NAMESPACE;
		$base = '/licenses';

		register_rest_route(
			$ns,
			$base,
			array(
				'methods'             => \WP_REST_Server::READABLE,
				'callback'            => array( $this, 'list_licenses' ),
				'permission_callback' => array( $this, 'permission_admin' ),
			)
		);

		register_rest_route(
			$ns,
			$base . '/export',
			array(
				'methods'             => \WP_REST_Server::READABLE,
				'callback'            => array( $this, 'export_csv' ),
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

		register_rest_route(
			$ns,
			$base . '/(?P<id>\d+)',
			array(
				'methods'             => \WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_license' ),
				'permission_callback' => array( $this, 'permission_admin' ),
			)
		);

		foreach ( array(
			'extend'            => 'admin_extend',
			'suspend'           => 'admin_suspend',
			'reinstate'         => 'admin_reinstate',
			'revoke'            => 'admin_revoke',
			'reset-activations' => 'admin_reset_activations',
			'duplicate'         => 'admin_duplicate',
		) as $action => $callback ) {
			register_rest_route(
				$ns,
				$base . '/(?P<id>\d+)/' . $action,
				array(
					'methods'             => \WP_REST_Server::CREATABLE,
					'callback'            => array( $this, $callback ),
					'permission_callback' => array( $this, 'permission_admin' ),
				)
			);
		}

		register_rest_route(
			$ns,
			'/reports/licenses/summary',
			array(
				'methods'             => \WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_report_summary' ),
				'permission_callback' => array( $this, 'permission_admin' ),
			)
		);
	}

	// -----------------------------------------------------------------------
	// Read endpoints
	// -----------------------------------------------------------------------

	/**
	 * GET /licenses — admin list with the KPI strip's counts, optionally
	 * filtered by status/product/search/date-range, and paginated.
	 *
	 * Fetches every row and filters/paginates in PHP rather than in SQL —
	 * same trade-off API\Updates::admin_versions() makes: this table is an
	 * admin-only listing, not a high-frequency query path, and version-style
	 * filtering logic is far more readable in PHP than assembled SQL.
	 *
	 * @since 1.0.0
	 * @param \WP_REST_Request $request REST request.
	 * @return \WP_REST_Response
	 */
	public function list_licenses( \WP_REST_Request $request ): \WP_REST_Response {
		$page     = max( 1, (int) ( $request->get_param( 'page' ) ?: 1 ) );
		$per_page = max( 1, min( 100, (int) ( $request->get_param( 'perPage' ) ?: 20 ) ) );
		$search   = trim( (string) $request->get_param( 'search' ) );
		$status   = trim( (string) $request->get_param( 'status' ) );
		$product  = (int) $request->get_param( 'productId' );
		$days     = $request->get_param( 'expiresWithinDays' );

		$rows = $this->generator->find_all();

		$items = array();
		foreach ( $rows as $row ) {
			if ( '' !== $search ) {
				$q = strtolower( $search );
				if ( false === strpos( strtolower( (string) $row->license_key ), $q )
					&& false === strpos( strtolower( (string) $row->customer_name ), $q )
					&& false === strpos( strtolower( (string) $row->customer_email ), $q )
					&& false === strpos( strtolower( (string) $row->product_name ), $q )
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

			if ( null !== $days && '' !== $days ) {
				if ( ! $row->expires_at ) {
					continue;
				}
				$within = strtotime( (string) $row->expires_at ) <= strtotime( '+' . (int) $days . ' days' );
				if ( ! $within ) {
					continue;
				}
			}

			$items[] = $this->prepare_license( $row );
		}

		$total       = count( $items );
		$total_pages = max( 1, (int) ceil( $total / $per_page ) );
		$offset      = ( $page - 1 ) * $per_page;

		return rest_ensure_response(
			array(
				'data'       => array_slice( $items, $offset, $per_page ),
				'total'      => $total,
				'totalPages' => $total_pages,
				'stats'      => $this->generator->stats(),
			)
		);
	}

	/**
	 * GET /licenses/{id} — one license, its activation records, and JWT
	 * token status.
	 *
	 * @since 1.0.0
	 * @param \WP_REST_Request $request REST request.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function get_license( \WP_REST_Request $request ) {
		$id      = (int) $request->get_param( 'id' );
		$license = $this->generator->get_by_id_with_details( $id );

		if ( ! $license ) {
			return new \WP_Error( 'purecart_not_found', __( 'License not found.', 'purecart' ), array( 'status' => 404 ) );
		}

		$activations = array_map(
			array( $this, 'prepare_activation' ),
			$this->activator->find_by_license( $id )
		);

		return rest_ensure_response(
			array(
				'license'     => $this->prepare_license( $license ),
				'activations' => $activations,
				'jwtStatus'   => $this->jwt_status( $id ),
			)
		);
	}

	/**
	 * GET /reports/licenses/summary — LicenseSummaryPage's aggregate data.
	 *
	 * @since 1.0.0
	 * @return \WP_REST_Response
	 */
	public function get_report_summary(): \WP_REST_Response {
		global $wpdb;

		$table = $wpdb->prefix . 'purecart_licenses';
		$stats = $this->generator->stats();

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- Reporting aggregate over a custom table; {$table} is not user input, the date is bound below.
		$issued_by_day = $wpdb->get_results(
			$wpdb->prepare(
				"SELECT DATE( created_at ) AS day, COUNT(*) AS total
                   FROM {$table}
                  WHERE created_at >= %s
               GROUP BY day
               ORDER BY day ASC",
				gmdate( 'Y-m-d 00:00:00', strtotime( '-29 days' ) )
			)
		) ?: array();

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- As above; fixed query, no variable input.
		$by_plan = $wpdb->get_results( "SELECT plan_type, COUNT(*) AS total FROM {$table} GROUP BY plan_type" ) ?: array();

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- As above; fixed query, no variable input.
		$by_status = $wpdb->get_results( "SELECT status, COUNT(*) AS total FROM {$table} GROUP BY status" ) ?: array();

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- As above; fixed query, no variable input.
		$by_product = $wpdb->get_results(
			"SELECT l.product_id, p.post_title AS product_name, COUNT(*) AS total
               FROM {$table} l
               LEFT JOIN {$wpdb->posts} p ON p.ID = l.product_id
           GROUP BY l.product_id
           ORDER BY total DESC
              LIMIT 10"
		) ?: array();

		return rest_ensure_response(
			array(
				'stats'       => $stats,
				'issuedByDay' => array_map(
					static fn( $r ) => array(
						'date'  => (string) $r->day,
						'count' => (int) $r->total,
					),
					$issued_by_day
				),
				'byPlan'      => array_map(
					static fn( $r ) => array(
						'plan'  => (string) $r->plan_type,
						'count' => (int) $r->total,
					),
					$by_plan
				),
				'byStatus'    => array_map(
					static fn( $r ) => array(
						'status' => (string) $r->status,
						'count'  => (int) $r->total,
					),
					$by_status
				),
				'topProducts' => array_map(
					static fn( $r ) => array(
						'productId'   => (int) $r->product_id,
						'productName' => (string) ( $r->product_name ?: "Product #{$r->product_id}" ),
						'count'       => (int) $r->total,
					),
					$by_product
				),
			)
		);
	}

	/**
	 * GET /licenses/export — CSV download of every license.
	 *
	 * @since 1.0.0
	 * @return void Exits after streaming the CSV; never returns.
	 */
	public function export_csv(): void {
		nocache_headers();
		header( 'Content-Type: text/csv; charset=utf-8' );
		header( 'Content-Disposition: attachment; filename="purecart-licenses-' . gmdate( 'Y-m-d' ) . '.csv"' );

		// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_fopen -- Streaming a generated CSV directly to the response; WP_Filesystem has no streaming-output equivalent.
		$out = fopen( 'php://output', 'w' );
		fputcsv( $out, array( 'License Key', 'Customer', 'Email', 'Product', 'Plan', 'Status', 'Activations', 'Limit', 'Expires', 'Created' ) );

		foreach ( $this->generator->find_all() as $row ) {
			fputcsv(
				$out,
				array(
					(string) $row->license_key,
					(string) $row->customer_name,
					(string) $row->customer_email,
					(string) $row->product_name,
					(string) $row->plan_type,
					(string) $row->status,
					(string) $row->activated_count,
					(string) $row->activation_limit,
					(string) $row->expires_at,
					(string) $row->created_at,
				)
			);
		}

		// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_fclose -- Pairs with the fopen() above.
		fclose( $out );
		exit;
	}

	// -----------------------------------------------------------------------
	// Action endpoints
	// -----------------------------------------------------------------------

	/**
	 * POST /licenses/{id}/extend — push expiry forward by N days.
	 *
	 * @since 1.0.0
	 * @param \WP_REST_Request $request REST request.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function admin_extend( \WP_REST_Request $request ) {
		$id   = (int) $request->get_param( 'id' );
		$days = max( 1, (int) ( $request->get_param( 'days' ) ?: 30 ) );

		if ( ! $this->generator->get_by_id( $id ) ) {
			return new \WP_Error( 'purecart_not_found', __( 'License not found.', 'purecart' ), array( 'status' => 404 ) );
		}

		$ok = $this->generator->extend_expiry( $id, $days, 'day' );
		if ( ! $ok ) {
			return new \WP_Error( 'purecart_extend_failed', __( 'This license cannot be extended (lifetime plans have no expiry).', 'purecart' ), array( 'status' => 400 ) );
		}

		return rest_ensure_response(
			array(
				'success' => true,
				'license' => $this->prepare_license( $this->generator->get_by_id_with_details( $id ) ),
			)
		);
	}

	/**
	 * POST /licenses/{id}/suspend
	 *
	 * @since 1.0.0
	 * @param \WP_REST_Request $request REST request.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function admin_suspend( \WP_REST_Request $request ) {
		return $this->set_status_response( (int) $request->get_param( 'id' ), 'suspended' );
	}

	/**
	 * POST /licenses/{id}/reinstate
	 *
	 * @since 1.0.0
	 * @param \WP_REST_Request $request REST request.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function admin_reinstate( \WP_REST_Request $request ) {
		return $this->set_status_response( (int) $request->get_param( 'id' ), 'active' );
	}

	/**
	 * POST /licenses/{id}/revoke
	 *
	 * @since 1.0.0
	 * @param \WP_REST_Request $request REST request.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function admin_revoke( \WP_REST_Request $request ) {
		return $this->set_status_response( (int) $request->get_param( 'id' ), 'revoked' );
	}

	/**
	 * POST /licenses/bulk-revoke — body: { ids: number[] }.
	 *
	 * @since 1.0.0
	 * @param \WP_REST_Request $request REST request.
	 * @return \WP_REST_Response
	 */
	public function bulk_revoke( \WP_REST_Request $request ): \WP_REST_Response {
		$ids = (array) $request->get_param( 'ids' );

		$revoked = 0;
		foreach ( $ids as $id ) {
			if ( $this->generator->set_status( (int) $id, 'revoked' ) ) {
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

	/**
	 * POST /licenses/{id}/reset-activations
	 *
	 * @since 1.0.0
	 * @param \WP_REST_Request $request REST request.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function admin_reset_activations( \WP_REST_Request $request ) {
		$id = (int) $request->get_param( 'id' );

		if ( ! $this->generator->get_by_id( $id ) ) {
			return new \WP_Error( 'purecart_not_found', __( 'License not found.', 'purecart' ), array( 'status' => 404 ) );
		}

		$this->activator->reset_activations( $id );

		return rest_ensure_response(
			array(
				'success' => true,
				'license' => $this->prepare_license( $this->generator->get_by_id_with_details( $id ) ),
			)
		);
	}

	/**
	 * POST /licenses/{id}/duplicate
	 *
	 * @since 1.0.0
	 * @param \WP_REST_Request $request REST request.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function admin_duplicate( \WP_REST_Request $request ) {
		$id      = (int) $request->get_param( 'id' );
		$created = $this->generator->duplicate( $id );

		if ( ! $created ) {
			return new \WP_Error( 'purecart_duplicate_failed', __( 'Could not duplicate this license.', 'purecart' ), array( 'status' => 400 ) );
		}

		return rest_ensure_response(
			array(
				'success' => true,
				'license' => $this->prepare_license( $this->generator->get_by_id_with_details( (int) $created->id ) ),
			)
		);
	}

	// -----------------------------------------------------------------------
	// Shaping
	// -----------------------------------------------------------------------

	/**
	 * Shared body for the suspend/reinstate/revoke actions, which all just
	 * set a different target status.
	 *
	 * @since 1.0.0
	 * @param int    $id     License row ID.
	 * @param string $status One of active/expired/revoked/suspended.
	 * @return \WP_REST_Response|\WP_Error
	 */
	private function set_status_response( int $id, string $status ) {
		if ( ! $this->generator->get_by_id( $id ) ) {
			return new \WP_Error( 'purecart_not_found', __( 'License not found.', 'purecart' ), array( 'status' => 404 ) );
		}

		$this->generator->set_status( $id, $status );

		return rest_ensure_response(
			array(
				'success' => true,
				'license' => $this->prepare_license( $this->generator->get_by_id_with_details( $id ) ),
			)
		);
	}

	/**
	 * Snake_case DB row to the camelCase shape the SPA expects.
	 *
	 * @since 1.0.0
	 * @param object $row License row, joined with product/customer columns.
	 * @return array<string, mixed>
	 */
	private function prepare_license( object $row ): array {
		return array(
			'id'              => (int) $row->id,
			'orderId'         => (int) $row->order_id,
			'userId'          => (int) $row->user_id,
			'productId'       => (int) $row->product_id,
			'productName'     => (string) ( $row->product_name ?? '' ) ?: "Product #{$row->product_id}",
			'customerName'    => (string) ( $row->customer_name ?? '' ),
			'customerEmail'   => (string) ( $row->customer_email ?? '' ),
			'licenseKey'      => (string) $row->license_key,
			'planType'        => (string) $row->plan_type,
			'status'          => (string) $row->status,
			'activationLimit' => (int) $row->activation_limit,
			'activatedCount'  => (int) $row->activated_count,
			'expiresAt'       => $row->expires_at ? (string) $row->expires_at : null,
			'createdAt'       => (string) $row->created_at,
			'updatedAt'       => (string) $row->updated_at,
		);
	}

	/**
	 * Snake_case activation row to the camelCase shape the SPA expects.
	 *
	 * @since 1.0.0
	 * @param object $row Activation row.
	 * @return array<string, mixed>
	 */
	private function prepare_activation( object $row ): array {
		return array(
			'id'          => (int) $row->id,
			'licenseId'   => (int) $row->license_id,
			'domain'      => (string) $row->domain,
			'ipAddress'   => (string) $row->ip_address,
			'environment' => (string) $row->environment,
			'activatedAt' => (string) $row->activated_at,
			'lastCheck'   => $row->last_check ? (string) $row->last_check : null,
		);
	}

	/**
	 * Most recent non-revoked access/refresh token for a license, for the
	 * detail page's JWT section.
	 *
	 * @since 1.0.0
	 * @param int $license_id License row ID.
	 * @return array<string, mixed>
	 */
	private function jwt_status( int $license_id ): array {
		global $wpdb;

		$table = $wpdb->prefix . 'purecart_license_tokens';

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- Admin detail view, must reflect a token just issued/revoked; {$table} is not user input, $license_id is bound below.
		$access = $wpdb->get_row(
			$wpdb->prepare(
				"SELECT expires_at, revoked FROM {$table}
                  WHERE license_id = %d AND token_type = 'access'
               ORDER BY created_at DESC LIMIT 1",
				$license_id
			)
		);

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- As above.
		$refresh = $wpdb->get_row(
			$wpdb->prepare(
				"SELECT expires_at, revoked FROM {$table}
                  WHERE license_id = %d AND token_type = 'refresh'
               ORDER BY created_at DESC LIMIT 1",
				$license_id
			)
		);

		$access_active = $access && ! (int) $access->revoked && strtotime( (string) $access->expires_at ) > time();

		return array(
			'accessTokenActive'     => (bool) $access_active,
			'accessTokenExpiresAt'  => $access ? (string) $access->expires_at : null,
			'refreshTokenExpiresAt' => $refresh ? (string) $refresh->expires_at : null,
		);
	}
}
