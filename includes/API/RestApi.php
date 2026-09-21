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

use PureCart\Downloads\DownloadDispatcher;

/**
 * Central REST API registrar.
 */
class RestApi {

	/**
	 * Boot sub-modules and register the rest_api_init hook.
	 *
	 * @since 1.0.0
	 */
	public function __construct() {
		new DownloadDispatcher();

		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	/**
	 * Register all PureCart REST API routes.
	 *
	 * @since 1.0.0
	 * @return void
	 */
	public function register_routes(): void {
		// license/*, licenses/* (admin), and license/token/* now live on
		// API\Licenses, registered from Licensing\Module — this file no
		// longer owns any Licensing routes.
		register_rest_route(
			PURECART_API_NAMESPACE,
			'/saas/usage/(?P<api_key>[a-z0-9_]+)',
			array(
				'methods'             => \WP_REST_Server::READABLE,
				'callback'            => array( $this, 'saas_usage' ),
				'permission_callback' => '__return_true',
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
}
