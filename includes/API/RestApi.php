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
use PureCart\Updates\UpdateServer;
use PureCart\Downloads\DownloadDispatcher;

/**
 * Central REST API registrar.
 */
class RestApi {

    public function __construct() {
        new UpdateServer();
        new DownloadDispatcher();

        add_action( 'rest_api_init', [ $this, 'register_routes' ] );
    }

    public function register_routes(): void {
        register_rest_route( PURECART_API_NAMESPACE, '/license/activate', [
            'methods'             => \WP_REST_Server::CREATABLE,
            'callback'            => [ $this, 'license_activate' ],
            'permission_callback' => '__return_true',
            'args'                => [
                'license_key' => [ 'required' => true,  'sanitize_callback' => 'sanitize_text_field' ],
                'domain'      => [ 'required' => true,  'sanitize_callback' => 'sanitize_text_field' ],
                'environment' => [ 'required' => false, 'sanitize_callback' => 'sanitize_text_field', 'default' => 'production' ],
            ],
        ] );

        register_rest_route( PURECART_API_NAMESPACE, '/license/deactivate', [
            'methods'             => \WP_REST_Server::CREATABLE,
            'callback'            => [ $this, 'license_deactivate' ],
            'permission_callback' => '__return_true',
            'args'                => [
                'license_key' => [ 'required' => true, 'sanitize_callback' => 'sanitize_text_field' ],
                'domain'      => [ 'required' => true, 'sanitize_callback' => 'sanitize_text_field' ],
            ],
        ] );

        register_rest_route( PURECART_API_NAMESPACE, '/license/check', [
            'methods'             => \WP_REST_Server::READABLE,
            'callback'            => [ $this, 'license_check' ],
            'permission_callback' => '__return_true',
            'args'                => [
                'license_key' => [ 'required' => true,  'sanitize_callback' => 'sanitize_text_field' ],
                'domain'      => [ 'required' => false, 'sanitize_callback' => 'sanitize_text_field', 'default' => '' ],
            ],
        ] );

        register_rest_route( PURECART_API_NAMESPACE, '/license/revoke', [
            'methods'             => \WP_REST_Server::CREATABLE,
            'callback'            => [ $this, 'license_revoke' ],
            'permission_callback' => static fn() => current_user_can( 'manage_woocommerce' ),
            'args'                => [
                'license_key' => [ 'required' => true, 'sanitize_callback' => 'sanitize_text_field' ],
            ],
        ] );

        register_rest_route( PURECART_API_NAMESPACE, '/saas/usage/(?P<api_key>[a-z0-9_]+)', [
            'methods'             => \WP_REST_Server::READABLE,
            'callback'            => [ $this, 'saas_usage' ],
            'permission_callback' => '__return_true',
        ] );
    }

    public function license_activate( \WP_REST_Request $request ): \WP_REST_Response|\WP_Error {
        $result = ( new LicenseActivator() )->activate(
            $request->get_param( 'license_key' ),
            $request->get_param( 'domain' ),
            $request->get_param( 'environment' )
        );

        if ( ! $result['success'] ) {
            return new \WP_Error( 'purecart_activation_failed', $result['message'], [ 'status' => 403 ] );
        }

        return rest_ensure_response( $result );
    }

    public function license_deactivate( \WP_REST_Request $request ): \WP_REST_Response|\WP_Error {
        $result = ( new LicenseActivator() )->deactivate(
            $request->get_param( 'license_key' ),
            $request->get_param( 'domain' )
        );

        if ( ! $result['success'] ) {
            return new \WP_Error( 'purecart_deactivation_failed', $result['message'], [ 'status' => 400 ] );
        }

        return rest_ensure_response( $result );
    }

    public function license_check( \WP_REST_Request $request ): \WP_REST_Response|\WP_Error {
        global $wpdb;

        // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching -- License check is security-critical; cached status could allow revoked/expired licenses through.
        $license = $wpdb->get_row(
            $wpdb->prepare(
                "SELECT * FROM {$wpdb->prefix}purecart_licenses WHERE license_key = %s LIMIT 1",
                $request->get_param( 'license_key' )
            )
        );

        if ( ! $license ) {
            return new \WP_Error( 'purecart_not_found', __( 'Invalid license key.', 'purecart' ), [ 'status' => 404 ] );
        }

        return rest_ensure_response( [
            'status'           => $license->status,
            'plan_type'        => $license->plan_type,
            'activation_limit' => $license->activation_limit,
            'activated_count'  => $license->activated_count,
            'expires_at'       => $license->expires_at,
        ] );
    }

    public function license_revoke( \WP_REST_Request $request ): \WP_REST_Response|\WP_Error {
        global $wpdb;

        $key = $request->get_param( 'license_key' );

        // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching -- Status update on custom table; must be real-time.
        $updated = $wpdb->update(
            $wpdb->prefix . 'purecart_licenses',
            [ 'status' => 'revoked', 'updated_at' => current_time( 'mysql' ) ],
            [ 'license_key' => $key ],
            [ '%s', '%s' ],
            [ '%s' ]
        );

        if ( false === $updated ) {
            return new \WP_Error( 'purecart_revoke_failed', __( 'Could not revoke license.', 'purecart' ), [ 'status' => 500 ] );
        }

        do_action( 'purecart_license_revoked_via_api', $key );

        return rest_ensure_response( [ 'success' => true, 'message' => __( 'License revoked.', 'purecart' ) ] );
    }

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
            return new \WP_Error( 'purecart_not_found', __( 'Invalid API key.', 'purecart' ), [ 'status' => 401 ] );
        }

        if ( 'active' !== $account->status ) {
            return new \WP_Error( 'purecart_account_suspended', __( 'Account is not active.', 'purecart' ), [ 'status' => 403 ] );
        }

        return rest_ensure_response( [
            'plan'           => $account->plan,
            'status'         => $account->status,
            'provisioned_at' => $account->provisioned_at,
        ] );
    }
}
