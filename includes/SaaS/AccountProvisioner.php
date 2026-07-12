<?php
/**
 * Provisions SaaS accounts when WooCommerce orders are completed.
 *
 * @package PureCart\SaaS
 */

declare( strict_types=1 );

namespace PureCart\SaaS;

defined( 'ABSPATH' ) || exit;

/**
 * Manages the purecart_saas_accounts table and webhook calls.
 */
class AccountProvisioner {

    public function provision( int $order_id, int $user_id, int $product_id ): ?object {
        global $wpdb;

        $product = wc_get_product( $product_id );
        if ( ! $product ) {
            return null;
        }

        $plan    = $product->get_meta( '_purecart_saas_plan' ) ?: 'starter';
        $api_key = 'purecart_' . bin2hex( random_bytes( 24 ) );

        // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery -- Custom table INSERT; no WP API available.
        $inserted = $wpdb->insert(
            $wpdb->prefix . 'purecart_saas_accounts',
            [
                'user_id'        => $user_id,
                'order_id'       => $order_id,
                'product_id'     => $product_id,
                'plan'           => $plan,
                'api_key'        => $api_key,
                'status'         => 'active',
                'provisioned_at' => current_time( 'mysql' ),
            ],
            [ '%d', '%d', '%d', '%s', '%s', '%s', '%s' ]
        );

        if ( ! $inserted ) {
            return null;
        }

        // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching -- Fetching the row just inserted; no stale cache risk.
        $account = $wpdb->get_row(
            $wpdb->prepare(
                "SELECT * FROM {$wpdb->prefix}purecart_saas_accounts WHERE id = %d",
                $wpdb->insert_id
            )
        );

        $this->send_webhook( $account, 'provision' );

        do_action( 'purecart_saas_provisioned', $account );

        return $account;
    }

    public function suspend( int $account_id ): bool {
        global $wpdb;

        // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching -- Status update on custom table; must be real-time.
        $updated = $wpdb->update(
            $wpdb->prefix . 'purecart_saas_accounts',
            [ 'status' => 'suspended' ],
            [ 'id'     => $account_id ],
            [ '%s' ],
            [ '%d' ]
        );

        if ( $updated ) {
            $account = $this->get_by_id( $account_id );
            if ( $account ) {
                $this->send_webhook( $account, 'suspend' );
            }
        }

        return (bool) $updated;
    }

    public function activate( int $account_id ): bool {
        global $wpdb;

        // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching -- Status update on custom table; must be real-time.
        $updated = $wpdb->update(
            $wpdb->prefix . 'purecart_saas_accounts',
            [ 'status' => 'active' ],
            [ 'id'     => $account_id ],
            [ '%s' ],
            [ '%d' ]
        );

        if ( $updated ) {
            $account = $this->get_by_id( $account_id );
            if ( $account ) {
                $this->send_webhook( $account, 'activate' );
            }
        }

        return (bool) $updated;
    }

    public function get_by_user( int $user_id ): array {
        global $wpdb;

        // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching -- User account list changes on every order/status update; caching would show stale data in the customer dashboard.
        return $wpdb->get_results(
            $wpdb->prepare(
                "SELECT a.*, p.post_title AS product_name
                   FROM {$wpdb->prefix}purecart_saas_accounts a
                   LEFT JOIN {$wpdb->posts} p ON p.ID = a.product_id
                  WHERE a.user_id = %d
                  ORDER BY a.provisioned_at DESC",
                $user_id
            )
        ) ?: [];
    }

    private function get_by_id( int $account_id ): ?object {
        global $wpdb;

        // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching -- Internal helper called immediately after an UPDATE; must reflect the just-written state.
        return $wpdb->get_row(
            $wpdb->prepare(
                "SELECT * FROM {$wpdb->prefix}purecart_saas_accounts WHERE id = %d LIMIT 1",
                $account_id
            )
        ) ?: null;
    }

    private function send_webhook( object $account, string $event ): void {
        $webhook_url = get_option( 'purecart_saas_webhook_url', '' );
        $secret      = get_option( 'purecart_webhook_secret',   '' );

        if ( empty( $webhook_url ) ) {
            return;
        }

        $payload = wp_json_encode( [
            'event'   => $event,
            'api_key' => $account->api_key,
            'plan'    => $account->plan,
            'user_id' => $account->user_id,
        ] );

        $sig = hash_hmac( 'sha256', (string) $payload, (string) $secret );

        wp_remote_post( $webhook_url, [
            'timeout'     => 15,
            'redirection' => 0,
            'headers'     => [
                'Content-Type'       => 'application/json',
                'X-PureCart-Webhook' => $event,
                'X-PureCart-Sig'     => $sig,
            ],
            'body' => $payload,
        ] );
    }
}
