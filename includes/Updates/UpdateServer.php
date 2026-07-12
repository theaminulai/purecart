<?php
/**
 * REST endpoint that serves plugin update information to remote WordPress sites.
 *
 * Update check behaviour (WP.org GPL compliance):
 *   - Version metadata and changelog are always public — no license required.
 *   - download_url is only populated when a valid, active license_key is supplied.
 *   - A missing or invalid license_key never returns 403; it simply omits download_url.
 *
 * Remote plugins call:
 *   GET purecart/v1/update-check?slug=my-plugin[&license_key=XXX][&version=1.0.0]
 *   GET purecart/v1/changelog?slug=my-plugin
 *
 * @package PureCart\Updates
 */

declare( strict_types=1 );

namespace PureCart\Updates;

defined( 'ABSPATH' ) || exit;

use PureCart\Licensing\LicenseGenerator;

/**
 * Update server — registers routes on rest_api_init.
 */
class UpdateServer {

	/**
	 * Register the rest_api_init hook.
	 *
	 * @since 1.0.0
	 */
	public function __construct() {
		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	/**
	 * Register the update-check and changelog REST routes.
	 *
	 * @since 1.0.0
	 * @return void
	 */
	public function register_routes(): void {
		register_rest_route(
			PURECART_API_NAMESPACE,
			'/update-check',
			array(
				'methods'             => \WP_REST_Server::READABLE,
				'callback'            => array( $this, 'update_check' ),
				'permission_callback' => '__return_true',
				'args'                => array(
					// license_key is OPTIONAL — omitting it returns metadata without a download URL.
					'license_key' => array(
						'required'          => false,
						'default'           => '',
						'sanitize_callback' => 'sanitize_text_field',
					),
					'slug'        => array(
						'required'          => true,
						'sanitize_callback' => 'sanitize_title',
					),
					'version'     => array(
						'required'          => false,
						'sanitize_callback' => 'sanitize_text_field',
						'default'           => '0.0.0',
					),
				),
			)
		);

		register_rest_route(
			PURECART_API_NAMESPACE,
			'/changelog',
			array(
				'methods'             => \WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_changelog' ),
				'permission_callback' => '__return_true',
				'args'                => array(
					'slug' => array(
						'required'          => true,
						'sanitize_callback' => 'sanitize_title',
					),
				),
			)
		);
	}

	/**
	 * Handle GET /purecart/v1/update-check — return version metadata and optional download URL.
	 *
	 * @since  1.0.0
	 * @param  \WP_REST_Request $request REST request object.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function update_check( \WP_REST_Request $request ): \WP_REST_Response|\WP_Error {
		$license_key = (string) $request->get_param( 'license_key' );
		$slug        = $request->get_param( 'slug' );
		$version     = $request->get_param( 'version' );

		// Locate the product by plugin slug.
		$products = get_posts(
			array(
				'post_type'   => 'product',
				// phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_query -- meta_query is the only way to look up a product by its plugin slug.
				'meta_query'  => array(
					array(
						'key'   => '_purecart_plugin_slug',
						'value' => $slug,
					),
				),
				'fields'      => 'ids',
				'numberposts' => 1,
			)
		);

		if ( empty( $products ) ) {
			return new \WP_Error( 'purecart_plugin_not_found', __( 'Plugin not found.', 'purecart' ), array( 'status' => 404 ) );
		}

		$product_id = (int) $products[0];
		$latest     = ( new VersionManager() )->get_latest( $product_id );

		if ( ! $latest ) {
			return new \WP_Error( 'purecart_not_found', __( 'No versions available.', 'purecart' ), array( 'status' => 404 ) );
		}

		$has_update = version_compare( $version, $latest->version, '<' );

		// Resolve download_url only when a valid, active license key is supplied.
		// A missing or invalid key never causes a 403 — it simply omits the URL.
		$download_url = null;
		if ( $has_update && '' !== $license_key ) {
			$license = ( new LicenseGenerator() )->get_by_key( $license_key );
			if ( $license && 'active' === $license->status ) {
				$download_url = rest_url( PURECART_API_NAMESPACE . "/download/{$slug}?license_key={$license_key}" );
			}
		}

		return rest_ensure_response(
			array(
				'slug'         => $slug,
				'version'      => $latest->version,
				'requires'     => $latest->requires_wp,
				'tested'       => $latest->tested_wp,
				'requires_php' => $latest->requires_php,
				'download_url' => $download_url,
				'sections'     => array( 'changelog' => wp_kses_post( $latest->changelog ?? '' ) ),
				'has_update'   => $has_update,
			)
		);
	}

	/**
	 * Handle GET /purecart/v1/changelog — return all version records for a plugin slug.
	 *
	 * @since  1.0.0
	 * @param  \WP_REST_Request $request REST request object.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function get_changelog( \WP_REST_Request $request ): \WP_REST_Response|\WP_Error {
		$slug = $request->get_param( 'slug' );

		$products = get_posts(
			array(
				'post_type'   => 'product',
				// phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_query -- meta_query is the only way to look up a product by its plugin slug.
				'meta_query'  => array(
					array(
						'key'   => '_purecart_plugin_slug',
						'value' => $slug,
					),
				),
				'fields'      => 'ids',
				'numberposts' => 1,
			)
		);

		if ( empty( $products ) ) {
			return new \WP_Error( 'purecart_not_found', __( 'Plugin not found.', 'purecart' ), array( 'status' => 404 ) );
		}

		$versions = ( new VersionManager() )->get_all( (int) $products[0] );

		return rest_ensure_response(
			array_map(
				static fn( $v ) => array(
					'version'     => $v->version,
					'released_at' => $v->released_at,
					'changelog'   => wp_kses_post( $v->changelog ?? '' ),
				),
				$versions
			)
		);
	}
}
