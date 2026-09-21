<?php
/**
 * Bootstraps all REST API route groups.
 *
 * Namespace: purecart/v1
 *
 * @package PureCart\API
 */

declare( strict_types=1 );

namespace PureCart\API;

defined( 'ABSPATH' ) || exit;

use PureCart\Licensing\LicenseActivator;
use PureCart\Licensing\LicenseGenerator;
use PureCart\Licensing\LicenseTokenIssuer;
use PureCart\Licensing\LicenseTokenValidator;
use PureCart\Licensing\LicenseTokenRefresher;
use PureCart\Licensing\LicenseTokenRevoker;
use PureCart\Downloads\DownloadLogRepository;
use PureCart\Downloads\TokenManager;

/**
 * Central REST API registrar.
 */
class RestApi {

	/**
	 * Register the rest_api_init hook.
	 *
	 * DownloadDispatcher is booted by `PureCart\Downloads\Module` — it hooks
	 * `template_redirect`/rewrite rules, not a REST route, so it doesn't
	 * belong to this class's job of registering `/purecart/v1/*` routes.
	 *
	 * @since 1.0.0
	 */
	public function __construct() {
		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	/**
	 * Register all PureCart REST API routes.
	 *
	 * @since 1.0.0
	 * @return void
	 */
	public function register_routes(): void {
		register_rest_route(
			PURECART_API_NAMESPACE,
			'/license/activate',
			array(
				'methods'             => \WP_REST_Server::CREATABLE,
				'callback'            => array( $this, 'license_activate' ),
				'permission_callback' => '__return_true',
				'args'                => array(
					'license_key' => array(
						'required'          => true,
						'sanitize_callback' => 'sanitize_text_field',
					),
					'domain'      => array(
						'required'          => true,
						'sanitize_callback' => 'sanitize_text_field',
					),
					'environment' => array(
						'required'          => false,
						'sanitize_callback' => 'sanitize_text_field',
						'default'           => 'production',
					),
				),
			)
		);

		register_rest_route(
			PURECART_API_NAMESPACE,
			'/license/deactivate',
			array(
				'methods'             => \WP_REST_Server::CREATABLE,
				'callback'            => array( $this, 'license_deactivate' ),
				'permission_callback' => '__return_true',
				'args'                => array(
					'license_key' => array(
						'required'          => true,
						'sanitize_callback' => 'sanitize_text_field',
					),
					'domain'      => array(
						'required'          => true,
						'sanitize_callback' => 'sanitize_text_field',
					),
				),
			)
		);

		register_rest_route(
			PURECART_API_NAMESPACE,
			'/license/check',
			array(
				'methods'             => \WP_REST_Server::READABLE,
				'callback'            => array( $this, 'license_check' ),
				// license_key lookups are public (by design — a license key
				// is itself the credential); a user_id lookup additionally
				// requires manage_woocommerce, enforced inside the callback
				// since a single route can't express "auth depends on which
				// param was sent" via permission_callback alone.
				'permission_callback' => '__return_true',
				'args'                => array(
					'license_key' => array(
						'required'          => false,
						'sanitize_callback' => 'sanitize_text_field',
					),
					'domain'      => array(
						'required'          => false,
						'sanitize_callback' => 'sanitize_text_field',
						'default'           => '',
					),
					'user_id'     => array(
						'required'          => false,
						'sanitize_callback' => 'absint',
					),
				),
			)
		);

		register_rest_route(
			PURECART_API_NAMESPACE,
			'/license/ping',
			array(
				'methods'             => \WP_REST_Server::READABLE,
				'callback'            => array( $this, 'license_ping' ),
				'permission_callback' => '__return_true',
			)
		);

		register_rest_route(
			PURECART_API_NAMESPACE,
			'/license/revoke',
			array(
				'methods'             => \WP_REST_Server::CREATABLE,
				'callback'            => array( $this, 'license_revoke' ),
				'permission_callback' => static fn() => current_user_can( 'manage_woocommerce' ),
				'args'                => array(
					'license_key' => array(
						'required'          => true,
						'sanitize_callback' => 'sanitize_text_field',
					),
				),
			)
		);

		register_rest_route(
			PURECART_API_NAMESPACE,
			'/license/token/refresh',
			array(
				'methods'             => \WP_REST_Server::CREATABLE,
				'callback'            => array( $this, 'license_token_refresh' ),
				'permission_callback' => '__return_true',
				'args'                => array(
					'refresh_token' => array(
						'required'          => true,
						'sanitize_callback' => 'sanitize_text_field',
					),
				),
			)
		);

		register_rest_route(
			PURECART_API_NAMESPACE,
			'/license/token/revoke-all',
			array(
				'methods'             => \WP_REST_Server::CREATABLE,
				'callback'            => array( $this, 'license_token_revoke_all' ),
				'permission_callback' => static fn() => current_user_can( 'manage_woocommerce' ),
				'args'                => array(
					'license_key' => array(
						'required'          => true,
						'sanitize_callback' => 'sanitize_text_field',
					),
				),
			)
		);

		register_rest_route(
			PURECART_API_NAMESPACE,
			'/saas/usage/(?P<api_key>[a-z0-9_]+)',
			array(
				'methods'             => \WP_REST_Server::READABLE,
				'callback'            => array( $this, 'saas_usage' ),
				'permission_callback' => '__return_true',
			)
		);

		// Downloads (admin) — no admin-facing surface existed for downloads
		// at all before this; everything else on this file's routes is
		// customer/plugin-facing token consumption.
		register_rest_route(
			PURECART_API_NAMESPACE,
			'/downloads/log',
			array(
				'methods'             => \WP_REST_Server::READABLE,
				'callback'            => array( $this, 'downloads_list_logs' ),
				'permission_callback' => static fn() => current_user_can( 'manage_woocommerce' ),
			)
		);

		register_rest_route(
			PURECART_API_NAMESPACE,
			'/downloads/log/export',
			array(
				'methods'             => \WP_REST_Server::READABLE,
				'callback'            => array( $this, 'downloads_export_csv' ),
				'permission_callback' => static fn() => current_user_can( 'manage_woocommerce' ),
			)
		);

		register_rest_route(
			PURECART_API_NAMESPACE,
			'/downloads/delivery-test',
			array(
				'methods'             => \WP_REST_Server::READABLE,
				'callback'            => array( $this, 'downloads_delivery_test' ),
				'permission_callback' => static fn() => current_user_can( 'manage_woocommerce' ),
			)
		);

		register_rest_route(
			PURECART_API_NAMESPACE,
			'/downloads/bulk-revoke',
			array(
				'methods'             => \WP_REST_Server::CREATABLE,
				'callback'            => array( $this, 'downloads_bulk_revoke' ),
				'permission_callback' => static fn() => current_user_can( 'manage_woocommerce' ),
			)
		);

		register_rest_route(
			PURECART_API_NAMESPACE,
			'/downloads/token/(?P<id>\d+)/revoke',
			array(
				'methods'             => \WP_REST_Server::CREATABLE,
				'callback'            => array( $this, 'downloads_token_revoke' ),
				'permission_callback' => static fn() => current_user_can( 'manage_woocommerce' ),
			)
		);

		register_rest_route(
			PURECART_API_NAMESPACE,
			'/downloads/token/(?P<id>\d+)/regenerate',
			array(
				'methods'             => \WP_REST_Server::CREATABLE,
				'callback'            => array( $this, 'downloads_token_regenerate' ),
				'permission_callback' => static fn() => current_user_can( 'manage_woocommerce' ),
			)
		);
	}

	/**
	 * Handle POST /purecart/v1/license/activate.
	 *
	 * @since  1.0.0
	 * @param  \WP_REST_Request $request REST request object.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function license_activate( \WP_REST_Request $request ): \WP_REST_Response|\WP_Error {
		$license_key = (string) $request->get_param( 'license_key' );
		$domain      = (string) $request->get_param( 'domain' );
		$environment = (string) $request->get_param( 'environment' );

		$result = ( new LicenseActivator() )->activate( $license_key, $domain, $environment );

		if ( ! $result['success'] ) {
			return new \WP_Error( 'purecart_activation_failed', $result['message'], array( 'status' => 403 ) );
		}

		// Issue a JWT pair so the customer's plugin can validate locally
		// instead of polling /license/check — see docs/RND-licensing-jwt.md.
		$license = ( new LicenseGenerator() )->get_by_key( $license_key );
		if ( $license ) {
			$token = ( new LicenseTokenIssuer() )->issue( (int) $license->id, $domain, $environment );
			if ( $token ) {
				$result['data'] = array( 'token' => $token );
			}
		}

		return rest_ensure_response( $result );
	}

	/**
	 * Handle POST /purecart/v1/license/deactivate.
	 *
	 * @since  1.0.0
	 * @param  \WP_REST_Request $request REST request object.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function license_deactivate( \WP_REST_Request $request ): \WP_REST_Response|\WP_Error {
		$result = ( new LicenseActivator() )->deactivate(
			$request->get_param( 'license_key' ),
			$request->get_param( 'domain' )
		);

		if ( ! $result['success'] ) {
			return new \WP_Error( 'purecart_deactivation_failed', $result['message'], array( 'status' => 400 ) );
		}

		return rest_ensure_response( $result );
	}

	/**
	 * Handle GET /purecart/v1/license/check.
	 *
	 * @since  1.0.0
	 * @param  \WP_REST_Request $request REST request object.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function license_check( \WP_REST_Request $request ): \WP_REST_Response|\WP_Error {
		// Bearer JWT path: validate locally, no DB lookup — the whole point
		// of the JWT layer (docs/RND-licensing-jwt.md "Why Not Validate JTI
		// on Every /check Call?"). Falls through to the legacy license_key
		// DB lookup below if no valid Bearer token is present.
		$auth_header = (string) $request->get_header( 'authorization' );
		if ( str_starts_with( $auth_header, 'Bearer ' ) ) {
			$decoded = ( new LicenseTokenValidator() )->validate( substr( $auth_header, 7 ) );

			if ( ! is_wp_error( $decoded ) ) {
				$lic = (array) ( $decoded['lic'] ?? array() );

				return rest_ensure_response(
					array(
						'status'           => ( $lic['expires_at'] ?? null ) && strtotime( (string) $lic['expires_at'] ) < time() ? 'expired' : 'active',
						'plan_type'        => $lic['plan'] ?? '',
						'activation_limit' => $lic['limit'] ?? 0,
						'activated_count'  => $lic['count'] ?? 0,
						'expires_at'       => $lic['expires_at'] ?? null,
						'is_lifetime'      => null === ( $lic['expires_at'] ?? null ),
						'features'         => $lic['features'] ?? array(),
					)
				);
			}
		}

		$user_id = (int) $request->get_param( 'user_id' );

		// Admin/server-to-server lookup: all licenses for a customer.
		if ( $user_id > 0 ) {
			if ( ! current_user_can( 'manage_woocommerce' ) ) {
				return new \WP_Error( 'purecart_forbidden', __( 'You are not allowed to view this license data.', 'purecart' ), array( 'status' => 403 ) );
			}

			return rest_ensure_response( ( new LicenseGenerator() )->get_by_user( $user_id ) );
		}

		$license_key = (string) $request->get_param( 'license_key' );
		if ( '' === $license_key ) {
			return new \WP_Error( 'purecart_missing_param', __( 'license_key or user_id is required.', 'purecart' ), array( 'status' => 400 ) );
		}

		$license = ( new LicenseGenerator() )->get_by_key( $license_key );

		if ( ! $license ) {
			return new \WP_Error( 'purecart_not_found', __( 'Invalid license key.', 'purecart' ), array( 'status' => 404 ) );
		}

		return rest_ensure_response(
			array(
				'status'           => $license->status,
				'plan_type'        => $license->plan_type,
				'activation_limit' => $license->activation_limit,
				'activated_count'  => $license->activated_count,
				'expires_at'       => $license->expires_at,
			)
		);
	}

	/**
	 * Handle GET /purecart/v1/license/ping — lightweight reachability check.
	 *
	 * Does not consume an activation or validate a key; used by remote
	 * plugins to verify the store is reachable before attempting activation.
	 *
	 * @since  1.0.0
	 * @return \WP_REST_Response
	 */
	public function license_ping(): \WP_REST_Response {
		return rest_ensure_response(
			array(
				'status'    => 'ok',
				'timestamp' => time(),
			)
		);
	}

	/**
	 * Handle POST /purecart/v1/license/token/refresh.
	 *
	 * @since  1.0.0
	 * @param  \WP_REST_Request $request REST request object.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function license_token_refresh( \WP_REST_Request $request ): \WP_REST_Response|\WP_Error {
		$result = ( new LicenseTokenRefresher() )->refresh( (string) $request->get_param( 'refresh_token' ) );

		if ( is_wp_error( $result ) ) {
			return $result;
		}

		return rest_ensure_response(
			array(
				'success' => true,
				'data'    => $result,
			)
		);
	}

	/**
	 * Handle POST /purecart/v1/license/token/revoke-all (requires manage_woocommerce).
	 *
	 * @since  1.0.0
	 * @param  \WP_REST_Request $request REST request object.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function license_token_revoke_all( \WP_REST_Request $request ): \WP_REST_Response|\WP_Error {
		$license = ( new LicenseGenerator() )->get_by_key( (string) $request->get_param( 'license_key' ) );

		if ( ! $license ) {
			return new \WP_Error( 'purecart_not_found', __( 'Invalid license key.', 'purecart' ), array( 'status' => 404 ) );
		}

		( new LicenseTokenRevoker() )->revoke_all( (int) $license->id );

		return rest_ensure_response(
			array(
				'success' => true,
				'message' => __( 'All tokens revoked for this license.', 'purecart' ),
			)
		);
	}

	/**
	 * Handle POST /purecart/v1/license/revoke (requires manage_woocommerce).
	 *
	 * @since  1.0.0
	 * @param  \WP_REST_Request $request REST request object.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function license_revoke( \WP_REST_Request $request ): \WP_REST_Response|\WP_Error {
		$key = (string) $request->get_param( 'license_key' );

		$generator = new LicenseGenerator();
		$license   = $generator->get_by_key( $key );

		if ( ! $license ) {
			return new \WP_Error( 'purecart_not_found', __( 'Invalid license key.', 'purecart' ), array( 'status' => 404 ) );
		}

		if ( ! $generator->set_status( (int) $license->id, 'revoked' ) ) {
			return new \WP_Error( 'purecart_revoke_failed', __( 'Could not revoke license.', 'purecart' ), array( 'status' => 500 ) );
		}

		// purecart_license_status_changed already fires from set_status();
		// purecart_license_revoked is the documented, revoke-specific hook
		// the JWT token revoker (and any other listener) hangs off of.
		do_action( 'purecart_license_revoked', (int) $license->id );
		do_action( 'purecart_license_revoked_via_api', $key );

		return rest_ensure_response(
			array(
				'success' => true,
				'message' => __( 'License revoked.', 'purecart' ),
			)
		);
	}

	/**
	 * Handle GET /purecart/v1/saas/usage/{api_key}.
	 *
	 * @since  1.0.0
	 * @param  \WP_REST_Request $request REST request object.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function saas_usage( \WP_REST_Request $request ): \WP_REST_Response|\WP_Error {
		global $wpdb;

        // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching -- API key authentication; cached status could allow suspended accounts through.
		$account = $wpdb->get_row(
			$wpdb->prepare(
				"SELECT * FROM {$wpdb->prefix}purecart_saas_accounts WHERE api_key = %s LIMIT 1",
				sanitize_text_field( $request->get_param( 'api_key' ) )
			)
		);

		if ( ! $account ) {
			return new \WP_Error( 'purecart_not_found', __( 'Invalid API key.', 'purecart' ), array( 'status' => 401 ) );
		}

		if ( 'active' !== $account->status ) {
			return new \WP_Error( 'purecart_account_suspended', __( 'Account is not active.', 'purecart' ), array( 'status' => 403 ) );
		}

		return rest_ensure_response(
			array(
				'plan'           => $account->plan,
				'status'         => $account->status,
				'provisioned_at' => $account->provisioned_at,
			)
		);
	}

	// -----------------------------------------------------------------------
	// Downloads (admin)
	// -----------------------------------------------------------------------

	/**
	 * Handle GET /purecart/v1/downloads/log — admin log with the KPI strip's
	 * counts, optionally filtered by status/product/search/date-range, and
	 * paginated.
	 *
	 * Fetches every row and filters/paginates in PHP rather than in SQL: an
	 * admin-only listing, not a high-frequency query path.
	 *
	 * @since  1.0.0
	 * @param  \WP_REST_Request $request REST request object.
	 * @return \WP_REST_Response
	 */
	public function downloads_list_logs( \WP_REST_Request $request ): \WP_REST_Response {
		$page      = max( 1, (int) ( $request->get_param( 'page' ) ?: 1 ) );
		$per_page  = max( 1, min( 100, (int) ( $request->get_param( 'perPage' ) ?: 20 ) ) );
		$search    = trim( (string) $request->get_param( 'search' ) );
		$status    = trim( (string) $request->get_param( 'status' ) );
		$product   = (int) $request->get_param( 'productId' );
		$date_from = trim( (string) $request->get_param( 'dateFrom' ) );

		$repository = new DownloadLogRepository();
		$rows       = $repository->find_all();

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

			$items[] = $this->prepare_download_log_entry( $row );
		}

		$total       = count( $items );
		$total_pages = max( 1, (int) ceil( $total / $per_page ) );
		$offset      = ( $page - 1 ) * $per_page;

		return rest_ensure_response(
			array(
				'data'       => array_slice( $items, $offset, $per_page ),
				'total'      => $total,
				'totalPages' => $total_pages,
				'stats'      => $repository->stats(),
			)
		);
	}

	/**
	 * Handle GET /purecart/v1/downloads/log/export — CSV download of every
	 * log row.
	 *
	 * @since  1.0.0
	 * @return void Exits after streaming the CSV; never returns.
	 */
	public function downloads_export_csv(): void {
		nocache_headers();
		header( 'Content-Type: text/csv; charset=utf-8' );
		header( 'Content-Disposition: attachment; filename="purecart-download-log-' . gmdate( 'Y-m-d' ) . '.csv"' );

		// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_fopen -- Streaming a generated CSV directly to the response; WP_Filesystem has no streaming-output equivalent.
		$out = fopen( 'php://output', 'w' );
		fputcsv( $out, array( 'Time', 'Order', 'Customer', 'Email', 'Product', 'File', 'IP Address', 'Status' ) );

		foreach ( ( new DownloadLogRepository() )->find_all() as $row ) {
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
	 * Handle GET /purecart/v1/downloads/delivery-test — self-test of the
	 * local file-streaming delivery path (the only delivery method actually
	 * implemented today; S3/R2 presigned delivery is a later phase per
	 * docs/RND-secure-downloads.md).
	 *
	 * @since  1.0.0
	 * @return \WP_REST_Response
	 */
	public function downloads_delivery_test(): \WP_REST_Response {
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

	/**
	 * Handle POST /purecart/v1/downloads/bulk-revoke — body: { ids: number[] }
	 * of download_id.
	 *
	 * @since  1.0.0
	 * @param  \WP_REST_Request $request REST request object.
	 * @return \WP_REST_Response
	 */
	public function downloads_bulk_revoke( \WP_REST_Request $request ): \WP_REST_Response {
		$ids = (array) $request->get_param( 'ids' );

		$manager = new TokenManager();
		$revoked = 0;
		foreach ( $ids as $id ) {
			if ( $manager->revoke( (int) $id ) ) {
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
	 * Handle POST /purecart/v1/downloads/token/{id}/revoke.
	 *
	 * @since  1.0.0
	 * @param  \WP_REST_Request $request REST request object.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function downloads_token_revoke( \WP_REST_Request $request ): \WP_REST_Response|\WP_Error {
		$id         = (int) $request->get_param( 'id' );
		$repository = new DownloadLogRepository();

		if ( ! $repository->get_token( $id ) ) {
			return new \WP_Error( 'purecart_not_found', __( 'Download token not found.', 'purecart' ), array( 'status' => 404 ) );
		}

		( new TokenManager() )->revoke( $id );

		return rest_ensure_response(
			array(
				'success' => true,
				'token'   => $this->prepare_download_token( $repository->get_token( $id ) ),
			)
		);
	}

	/**
	 * Handle POST /purecart/v1/downloads/token/{id}/regenerate.
	 *
	 * @since  1.0.0
	 * @param  \WP_REST_Request $request REST request object.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function downloads_token_regenerate( \WP_REST_Request $request ): \WP_REST_Response|\WP_Error {
		$id         = (int) $request->get_param( 'id' );
		$repository = new DownloadLogRepository();

		if ( ! $repository->get_token( $id ) ) {
			return new \WP_Error( 'purecart_not_found', __( 'Download token not found.', 'purecart' ), array( 'status' => 404 ) );
		}

		( new TokenManager() )->regenerate( $id );

		return rest_ensure_response(
			array(
				'success' => true,
				'token'   => $this->prepare_download_token( $repository->get_token( $id ) ),
			)
		);
	}

	/**
	 * Snake_case log row (joined with token/product/customer columns) to the
	 * camelCase shape the SPA expects.
	 *
	 * @since  1.0.0
	 * @param  object $row Log row, joined with download/product/customer columns.
	 * @return array<string, mixed>
	 */
	private function prepare_download_log_entry( object $row ): array {
		$file_path = get_post_meta( (int) $row->file_id, '_purecart_file_path', true );

		return array(
			'id'            => (int) $row->id,
			'downloadId'    => (int) $row->download_id,
			'orderId'       => (int) $row->order_id,
			'productId'     => (int) $row->product_id,
			'fileId'        => (int) $row->file_id,
			'fileLabel'     => (string) ( $row->file_label ?: "File #{$row->file_id}" ),
			'fileExtension' => $file_path ? strtolower( (string) pathinfo( (string) $file_path, PATHINFO_EXTENSION ) ) : '',
			'token'         => substr( (string) $row->token, -8 ),
			'status'        => (string) $row->status,
			'ipAddress'     => (string) $row->ip_address,
			'downloadedAt'  => (string) $row->downloaded_at,
			'customerName'  => (string) ( $row->customer_name ?? '' ),
			'customerEmail' => (string) ( $row->customer_email ?? '' ),
			'productName'   => (string) ( $row->product_name ?? '' ) ?: "Product #{$row->product_id}",
			'tokenStatus'   => $this->download_token_lifecycle_status( $row->token_status, $row->expires_at ),
			'downloadCount' => (int) $row->download_count,
			'maxDownloads'  => (int) $row->max_downloads,
			'expiresAt'     => (string) $row->expires_at,
		);
	}

	/**
	 * Snake_case token row to the camelCase shape the SPA expects.
	 *
	 * @since  1.0.0
	 * @param  object $row Token row, joined with product/customer columns.
	 * @return array<string, mixed>
	 */
	private function prepare_download_token( object $row ): array {
		return array(
			'id'            => (int) $row->id,
			'orderId'       => (int) $row->order_id,
			'productId'     => (int) $row->product_id,
			'productName'   => (string) ( $row->product_name ?? '' ) ?: "Product #{$row->product_id}",
			'customerName'  => (string) ( $row->customer_name ?? '' ),
			'customerEmail' => (string) ( $row->customer_email ?? '' ),
			'token'         => substr( (string) $row->token, -8 ),
			'downloadCount' => (int) $row->download_count,
			'maxDownloads'  => (int) $row->max_downloads,
			'expiresAt'     => (string) $row->expires_at,
			'status'        => $this->download_token_lifecycle_status( $row->status, $row->expires_at ),
		);
	}

	/**
	 * Derives the 'active'|'expired'|'revoked' lifecycle status a token row
	 * doesn't store directly — 'expired' is computed from `expires_at`
	 * rather than persisted, since it changes on its own without a write.
	 *
	 * @since  1.0.0
	 * @param  string $stored_status Raw `status` column value ('active'|'revoked').
	 * @param  string $expires_at    MySQL datetime string.
	 * @return string
	 */
	private function download_token_lifecycle_status( string $stored_status, string $expires_at ): string {
		if ( 'revoked' === $stored_status ) {
			return 'revoked';
		}

		if ( strtotime( $expires_at ) < time() ) {
			return 'expired';
		}

		return 'active';
	}
}
