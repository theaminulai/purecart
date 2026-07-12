<?php
/**
 * Adds custom tabs to WooCommerce My Account page.
 *
 * @package PureCart\CustomerDashboard
 */

declare( strict_types=1 );

namespace PureCart\CustomerDashboard;

defined( 'ABSPATH' ) || exit;

use PureCart\Licensing\LicenseGenerator;
use PureCart\Downloads\TokenManager;
use PureCart\SaaS\AccountProvisioner;

/**
 * Registers and renders My Account dashboard tabs.
 */
class Dashboard {

    /** @var string[] */
    private array $slugs = [ 'purecart-licenses', 'purecart-downloads', 'purecart-api-keys' ];

    public function __construct() {
        add_filter( 'woocommerce_account_menu_items',        [ $this, 'menu_items' ] );
        add_filter( 'woocommerce_get_query_vars',            [ $this, 'query_vars' ] );
        add_filter( 'woocommerce_account_menu_item_classes', [ $this, 'menu_item_classes' ], 10, 2 );

        foreach ( $this->slugs as $slug ) {
            add_action( "woocommerce_account_{$slug}_endpoint", [ $this, 'render_tab' ] );
        }

        add_action( 'init', [ $this, 'endpoints' ] );
    }

    /** @return array<string,string> */
    private function get_tabs(): array {
        return [
            'purecart-licenses'  => __( 'My Licenses', 'purecart' ),
            'purecart-downloads' => __( 'Downloads',   'purecart' ),
            'purecart-api-keys'  => __( 'API Keys',    'purecart' ),
        ];
    }

    public function endpoints(): void {
        foreach ( $this->slugs as $slug ) {
            add_rewrite_endpoint( $slug, EP_ROOT | EP_PAGES );
        }
    }

    /**
     * @param array<string,string> $items
     * @return array<string,string>
     */
    public function menu_items( array $items ): array {
        $logout = $items['customer-logout'] ?? null;
        unset( $items['customer-logout'] );

        foreach ( $this->get_tabs() as $slug => $label ) {
            $items[ $slug ] = $label;
        }

        if ( $logout ) {
            $items['customer-logout'] = $logout;
        }

        return $items;
    }

    /**
     * @param array<string,string> $vars
     * @return array<string,string>
     */
    public function query_vars( array $vars ): array {
        foreach ( $this->slugs as $slug ) {
            $vars[ $slug ] = $slug;
        }
        return $vars;
    }

    /**
     * @param string[] $classes
     * @param string   $endpoint
     * @return string[]
     */
    public function menu_item_classes( array $classes, string $endpoint ): array {
        global $wp;

        if ( isset( $wp->query_vars[ $endpoint ] ) ) {
            $classes[] = 'is-active';
        }

        return $classes;
    }

    public function render_tab(): void {
        global $wp;

        $active = '';
        foreach ( $this->slugs as $slug ) {
            if ( isset( $wp->query_vars[ $slug ] ) ) {
                $active = $slug;
                break;
            }
        }

        switch ( $active ) {
            case 'purecart-licenses':
                $this->render_licenses_tab();
                break;
            case 'purecart-downloads':
                $this->render_downloads_tab();
                break;
            case 'purecart-api-keys':
                $this->render_api_keys_tab();
                break;
        }
    }

    private function render_licenses_tab(): void {
        $user_id  = get_current_user_id();
        $licenses = ( new LicenseGenerator() )->get_by_user( $user_id );

        if ( empty( $licenses ) ) {
            echo '<p>' . esc_html__( 'You have no licenses yet.', 'purecart' ) . '</p>';
            return;
        }

        echo '<table class="woocommerce-table shop_table purecart-licenses-table">';
        echo '<thead><tr>'
            . '<th>' . esc_html__( 'Product',     'purecart' ) . '</th>'
            . '<th>' . esc_html__( 'License Key', 'purecart' ) . '</th>'
            . '<th>' . esc_html__( 'Status',      'purecart' ) . '</th>'
            . '<th>' . esc_html__( 'Sites Used',  'purecart' ) . '</th>'
            . '<th>' . esc_html__( 'Expires',     'purecart' ) . '</th>'
            . '</tr></thead><tbody>';

        foreach ( $licenses as $license ) {
            // Build expiry label — escape at point of output below.
            $expires_label = $license->expires_at
                ? date_i18n( get_option( 'date_format' ), strtotime( $license->expires_at ) )
                : __( 'Lifetime', 'purecart' );

            printf(
                '<tr><td>%s</td><td><code>%s</code></td><td><span class="purecart-status purecart-status--%s">%s</span></td><td>%s / %s</td><td>%s</td></tr>',
                esc_html( $license->product_name ?? '' ),
                esc_html( $license->license_key ),
                esc_attr( $license->status ),
                esc_html( ucfirst( $license->status ) ),
                esc_html( (string) $license->activated_count ),
                'unlimited' === $license->plan_type ? esc_html__( '∞', 'purecart' ) : esc_html( (string) $license->activation_limit ),
                esc_html( $expires_label )
            );
        }

        echo '</tbody></table>';
    }

    private function render_downloads_tab(): void {
        $user_id   = get_current_user_id();
        $downloads = ( new TokenManager() )->get_by_user( $user_id );

        if ( empty( $downloads ) ) {
            echo '<p>' . esc_html__( 'No downloads available.', 'purecart' ) . '</p>';
            return;
        }

        echo '<table class="woocommerce-table shop_table purecart-downloads-table">';
        echo '<thead><tr>'
            . '<th>' . esc_html__( 'Product',   'purecart' ) . '</th>'
            . '<th>' . esc_html__( 'Downloads', 'purecart' ) . '</th>'
            . '<th>' . esc_html__( 'Expires',   'purecart' ) . '</th>'
            . '<th>' . esc_html__( 'Action',    'purecart' ) . '</th>'
            . '</tr></thead><tbody>';

        foreach ( $downloads as $dl ) {
            $remaining = max( 0, (int) $dl->max_downloads - (int) $dl->download_count );
            $expired   = strtotime( $dl->expires_at ) < time();
            $url       = home_url( 'purecart/' . $dl->token );

            printf(
                '<tr><td>%s</td><td>%d / %d</td><td>%s</td><td>%s</td></tr>',
                esc_html( $dl->product_name ?? '' ),
                (int) $dl->download_count,
                (int) $dl->max_downloads,
                esc_html( date_i18n( get_option( 'date_format' ), strtotime( $dl->expires_at ) ) ),
                ( $expired || $remaining <= 0 )
                    ? '<span class="purecart-expired">' . esc_html__( 'Expired', 'purecart' ) . '</span>'
                    : '<a href="' . esc_url( $url ) . '" class="button">' . esc_html__( 'Download', 'purecart' ) . '</a>'
            );
        }

        echo '</tbody></table>';
    }

    private function render_api_keys_tab(): void {
        $user_id  = get_current_user_id();
        $accounts = ( new AccountProvisioner() )->get_by_user( $user_id );

        if ( empty( $accounts ) ) {
            echo '<p>' . esc_html__( 'No API keys found.', 'purecart' ) . '</p>';
            return;
        }

        echo '<table class="woocommerce-table shop_table purecart-api-keys-table">';
        echo '<thead><tr>'
            . '<th>' . esc_html__( 'Product', 'purecart' ) . '</th>'
            . '<th>' . esc_html__( 'Plan',    'purecart' ) . '</th>'
            . '<th>' . esc_html__( 'API Key', 'purecart' ) . '</th>'
            . '<th>' . esc_html__( 'Status',  'purecart' ) . '</th>'
            . '</tr></thead><tbody>';

        foreach ( $accounts as $account ) {
            printf(
                '<tr><td>%s</td><td>%s</td><td><code class="purecart-api-key">%s</code></td><td><span class="purecart-status purecart-status--%s">%s</span></td></tr>',
                esc_html( $account->product_name ?? '' ),
                esc_html( ucfirst( $account->plan ) ),
                esc_html( $account->api_key ),
                esc_attr( $account->status ),
                esc_html( ucfirst( $account->status ) )
            );
        }

        echo '</tbody></table>';
    }
}
