<?php
/**
 * Handles domain activation and deactivation for licenses.
 *
 * @package PureCart\Licensing
 */

declare( strict_types=1 );

namespace PureCart\Licensing;

defined( 'ABSPATH' ) || exit;

/**
 * Manages the purecart_license_activations table.
 */
class LicenseActivator {

    /**
     * Activate a license on a domain.
     *
     * @return array{success: bool, message: string}
     */
    public function activate( string $license_key, string $domain, string $environment = 'production' ): array {
        global $wpdb;

        // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching -- License validation is security-critical; cached results could allow revoked/expired licenses through.
        $license = $wpdb->get_row(
            $wpdb->prepare(
                "SELECT * FROM {$wpdb->prefix}purecart_licenses WHERE license_key = %s LIMIT 1",
                $license_key
            )
        );

        if ( ! $license ) {
            return [ 'success' => false, 'message' => __( 'Invalid license key.', 'purecart' ) ];
        }

        if ( 'active' !== $license->status ) {
            return [ 'success' => false, 'message' => __( 'License is not active.', 'purecart' ) ];
        }

        if ( $license->expires_at && strtotime( $license->expires_at ) < time() ) {
            return [ 'success' => false, 'message' => __( 'License has expired.', 'purecart' ) ];
        }

        // Already activated on this domain — refresh last_check.
        // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching -- Activation state is security-critical; cannot use stale cache.
        $existing = $wpdb->get_var(
            $wpdb->prepare(
                "SELECT id FROM {$wpdb->prefix}purecart_license_activations
                  WHERE license_id = %d AND domain = %s LIMIT 1",
                $license->id,
                $domain
            )
        );

        if ( $existing ) {
            // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching -- Updating last_check on existing activation record.
            $wpdb->update(
                $wpdb->prefix . 'purecart_license_activations',
                [ 'last_check' => current_time( 'mysql' ) ],
                [ 'id' => $existing ],
                [ '%s' ],
                [ '%d' ]
            );
            return [ 'success' => true, 'message' => __( 'License already activated on this domain.', 'purecart' ) ];
        }

        if ( 'unlimited' !== $license->plan_type
            && (int) $license->activated_count >= (int) $license->activation_limit
        ) {
            return [ 'success' => false, 'message' => __( 'Activation limit reached.', 'purecart' ) ];
        }

        $env_allowed = [ 'production', 'staging', 'local' ];
        if ( ! in_array( $environment, $env_allowed, true ) ) {
            $environment = 'production';
        }

        // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery -- Custom table INSERT; no WP API available.
        $wpdb->insert(
            $wpdb->prefix . 'purecart_license_activations',
            [
                'license_id'   => $license->id,
                'domain'       => $domain,
                'ip_address'   => sanitize_text_field( wp_unslash( $_SERVER['REMOTE_ADDR'] ?? '' ) ),
                'environment'  => $environment,
                'activated_at' => current_time( 'mysql' ),
                'last_check'   => current_time( 'mysql' ),
            ],
            [ '%d', '%s', '%s', '%s', '%s', '%s' ]
        );

        // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching -- Atomic counter increment; must be real-time.
        $wpdb->query(
            $wpdb->prepare(
                "UPDATE {$wpdb->prefix}purecart_licenses
                    SET activated_count = activated_count + 1,
                        updated_at = %s
                  WHERE id = %d",
                current_time( 'mysql' ),
                $license->id
            )
        );

        do_action( 'purecart_license_activated', $license->id, $domain, $environment );

        return [ 'success' => true, 'message' => __( 'License activated successfully.', 'purecart' ) ];
    }

    /**
     * Deactivate a license from a domain.
     *
     * @return array{success: bool, message: string}
     */
    public function deactivate( string $license_key, string $domain ): array {
        global $wpdb;

        // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching -- License validation is security-critical; cannot use stale cache.
        $license = $wpdb->get_row(
            $wpdb->prepare(
                "SELECT * FROM {$wpdb->prefix}purecart_licenses WHERE license_key = %s LIMIT 1",
                $license_key
            )
        );

        if ( ! $license ) {
            return [ 'success' => false, 'message' => __( 'Invalid license key.', 'purecart' ) ];
        }

        // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching -- DELETE from custom table; no WP API available.
        $deleted = $wpdb->delete(
            $wpdb->prefix . 'purecart_license_activations',
            [ 'license_id' => $license->id, 'domain' => $domain ],
            [ '%d', '%s' ]
        );

        if ( $deleted ) {
            // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching -- Atomic counter decrement; must be real-time.
            $wpdb->query(
                $wpdb->prepare(
                    "UPDATE {$wpdb->prefix}purecart_licenses
                        SET activated_count = GREATEST(0, activated_count - 1),
                            updated_at = %s
                      WHERE id = %d",
                    current_time( 'mysql' ),
                    $license->id
                )
            );

            do_action( 'purecart_license_deactivated', $license->id, $domain );
        }

        return [ 'success' => true, 'message' => __( 'License deactivated.', 'purecart' ) ];
    }
}
