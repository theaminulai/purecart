<?php
/**
 * WordPress admin screens for Woo Digital Downloads.
 *
 * @package WooDigitalDownloads\Admin
 */

namespace WooDigitalDownloads\Admin;

defined( 'ABSPATH' ) || exit;

use WooDigitalDownloads\Updates\VersionManager;
use WooDigitalDownloads\Licensing\LicenseGenerator;
use WooDigitalDownloads\Activator;

/**
 * Admin panel: menus, product meta boxes, settings.
 */
class Admin {

    public function __construct() {
        add_action( 'admin_menu',              [ $this, 'register_menus' ] );
        add_action( 'admin_enqueue_scripts',   [ $this, 'enqueue_assets' ] );

        // Product meta boxes.
        add_action( 'add_meta_boxes',          [ $this, 'add_meta_boxes' ] );
        add_action( 'save_post_product',       [ $this, 'save_product_meta' ] );

        // Run DB upgrade check on every admin load.
        add_action( 'admin_init',              [ Activator::class, 'maybe_upgrade' ] );

        // Plugin action links.
        add_filter( 'plugin_action_links_' . WDD_BASENAME, [ $this, 'action_links' ] );
    }

    /** Register the top-level admin menu. */
    public function register_menus(): void {
        add_menu_page(
            __( 'Digital Downloads', 'woo-digital-downloads' ),
            __( 'Digital Downloads', 'woo-digital-downloads' ),
            'manage_woocommerce',
            'wdd-dashboard',
            [ $this, 'page_dashboard' ],
            'dashicons-download',
            58
        );

        add_submenu_page(
            'wdd-dashboard',
            __( 'Licenses',       'woo-digital-downloads' ),
            __( 'Licenses',       'woo-digital-downloads' ),
            'manage_woocommerce',
            'wdd-licenses',
            [ $this, 'page_licenses' ]
        );

        add_submenu_page(
            'wdd-dashboard',
            __( 'Plugin Versions','woo-digital-downloads' ),
            __( 'Plugin Versions','woo-digital-downloads' ),
            'manage_woocommerce',
            'wdd-versions',
            [ $this, 'page_versions' ]
        );

        add_submenu_page(
            'wdd-dashboard',
            __( 'Settings',       'woo-digital-downloads' ),
            __( 'Settings',       'woo-digital-downloads' ),
            'manage_options',
            'wdd-settings',
            [ $this, 'page_settings' ]
        );
		// react dashborard 
		add_submenu_page(
			'wdd-dashboard',
			__( 'React Dashboard', 'woo-digital-downloads' ),
			__( 'React Dashboard', 'woo-digital-downloads' ),
			'manage_woocommerce',
			'wdd-react-dashboard',
			[ $this, 'page_react_dashboard' ]
		);
    }

	public function page_react_dashboard(): void {
		echo '<div class="wrap wdd-react-dashboard" id="wdd-react-dashboard-root"></div>';
	}

    /** Enqueue admin CSS/JS on our screens. */
    public function enqueue_assets( string $hook ): void {
        $wdd_hooks = [
            'toplevel_page_wdd-dashboard',
            'digital-downloads_page_wdd-licenses',
            'digital-downloads_page_wdd-versions',
            'digital-downloads_page_wdd-settings',
			'digital-downloads_page_wdd-react-dashboard',
        ];

        if ( ! in_array( $hook, $wdd_hooks, true ) && 'post.php' !== $hook && 'post-new.php' !== $hook ) {
            return;
        }

        wp_enqueue_style(
            'wdd-admin',
            WDD_URL . 'assets/css/admin.css',
            [],
            WDD_VERSION
        );

        wp_enqueue_script(
            'wdd-admin',
            WDD_URL . 'assets/js/admin.js',
            [ 'jquery' ],
            WDD_VERSION,
            true
        );

		if ( 'digital-downloads_page_wdd-react-dashboard' === $hook ) {
			$assests = include WDD_PATH . 'build/admin/admin.asset.php';
			// https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4
			wp_enqueue_script(
				'wdd-tailwind-browser',
				'https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4',
				[],
				'4.0.0',
				true
			);
			wp_enqueue_script(
				'wdd-react-dashboard',
				WDD_URL . 'build/admin/admin.js',
				$assests['dependencies'],
				$assests['version'],
				true
			);
			wp_enqueue_style(
				'wdd-react-dashboard',
				WDD_URL . 'build/admin/admin.css',
				[],
				$assests['version']
			);

		}
    }

    // ─── Product meta boxes ──────────────────────────────────────────────────

    public function add_meta_boxes(): void {
        add_meta_box(
            'wdd_product_settings',
            __( 'Digital Downloads Settings', 'woo-digital-downloads' ),
            [ $this, 'render_product_meta_box' ],
            'product',
            'normal',
            'high'
        );
    }

    /** Render the product meta box. */
    public function render_product_meta_box( \WP_Post $post ): void {
        wp_nonce_field( 'wdd_save_product_meta', 'wdd_product_nonce' );

        $product         = wc_get_product( $post->ID );
        $license_type    = $product ? $product->get_meta( '_wdd_license_type' )            : 'single';
        $act_limit       = $product ? $product->get_meta( '_wdd_activation_limit' )        : 1;
        $duration        = $product ? $product->get_meta( '_wdd_license_duration_days' )   : 365;
        $plugin_slug     = $product ? $product->get_meta( '_wdd_plugin_slug' )             : '';
        $saas_plan       = $product ? $product->get_meta( '_wdd_saas_plan' )               : 'starter';
        $webhook_url     = get_option( 'wdd_saas_webhook_url', '' );

        ?>
        <table class="form-table wdd-meta-table">
            <tr>
                <th><label for="wdd_license_type"><?php esc_html_e( 'License Type', 'woo-digital-downloads' ); ?></label></th>
                <td>
                    <select id="wdd_license_type" name="wdd_license_type">
                        <?php foreach ( [ 'single' => __( 'Single Site', 'woo-digital-downloads' ), 'multi' => __( 'Multi Site', 'woo-digital-downloads' ), 'unlimited' => __( 'Unlimited Sites', 'woo-digital-downloads' ), 'lifetime' => __( 'Lifetime (No Expiry)', 'woo-digital-downloads' ) ] as $val => $label ) : ?>
                            <option value="<?php echo esc_attr( $val ); ?>" <?php selected( $license_type, $val ); ?>>
                                <?php echo esc_html( $label ); ?>
                            </option>
                        <?php endforeach; ?>
                    </select>
                </td>
            </tr>
            <tr>
                <th><label for="wdd_activation_limit"><?php esc_html_e( 'Activation Limit', 'woo-digital-downloads' ); ?></label></th>
                <td>
                    <input type="number" id="wdd_activation_limit" name="wdd_activation_limit"
                           value="<?php echo esc_attr( $act_limit ); ?>" min="1" class="small-text">
                    <p class="description"><?php esc_html_e( 'Number of sites the license can be activated on.', 'woo-digital-downloads' ); ?></p>
                </td>
            </tr>
            <tr>
                <th><label for="wdd_license_duration_days"><?php esc_html_e( 'License Duration (days)', 'woo-digital-downloads' ); ?></label></th>
                <td>
                    <input type="number" id="wdd_license_duration_days" name="wdd_license_duration_days"
                           value="<?php echo esc_attr( $duration ); ?>" min="1" class="small-text">
                    <p class="description"><?php esc_html_e( 'Set 365 for 1 year. Ignored for "Lifetime" type.', 'woo-digital-downloads' ); ?></p>
                </td>
            </tr>
            <tr>
                <th><label for="wdd_plugin_slug"><?php esc_html_e( 'Plugin Slug', 'woo-digital-downloads' ); ?></label></th>
                <td>
                    <input type="text" id="wdd_plugin_slug" name="wdd_plugin_slug"
                           value="<?php echo esc_attr( $plugin_slug ); ?>" class="regular-text">
                    <p class="description"><?php esc_html_e( 'Used for the auto-update API endpoint. Example: my-awesome-plugin', 'woo-digital-downloads' ); ?></p>
                </td>
            </tr>
            <tr>
                <th><label for="wdd_saas_plan"><?php esc_html_e( 'SaaS Plan', 'woo-digital-downloads' ); ?></label></th>
                <td>
                    <input type="text" id="wdd_saas_plan" name="wdd_saas_plan"
                           value="<?php echo esc_attr( $saas_plan ); ?>" class="regular-text">
                    <p class="description"><?php esc_html_e( 'Plan identifier sent to your SaaS webhook. Example: pro, starter, enterprise', 'woo-digital-downloads' ); ?></p>
                </td>
            </tr>
        </table>
        <?php
    }

    /** Save meta box values. */
    public function save_product_meta( int $post_id ): void {
        if ( ! isset( $_POST['wdd_product_nonce'] )
            || ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['wdd_product_nonce'] ) ), 'wdd_save_product_meta' )
            || defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE
            || ! current_user_can( 'edit_post', $post_id )
        ) {
            return;
        }

        $fields = [
            '_wdd_license_type'          => 'wdd_license_type',
            '_wdd_activation_limit'      => 'wdd_activation_limit',
            '_wdd_license_duration_days' => 'wdd_license_duration_days',
            '_wdd_plugin_slug'           => 'wdd_plugin_slug',
            '_wdd_saas_plan'             => 'wdd_saas_plan',
        ];

        foreach ( $fields as $meta_key => $post_key ) {
            if ( isset( $_POST[ $post_key ] ) ) {
                update_post_meta( $post_id, $meta_key, sanitize_text_field( wp_unslash( $_POST[ $post_key ] ) ) );
            }
        }
    }

    // ─── Admin pages ─────────────────────────────────────────────────────────

    public function page_dashboard(): void {
        global $wpdb;

        $total_licenses = (int) $wpdb->get_var( "SELECT COUNT(*) FROM {$wpdb->prefix}wdd_licenses" );
        $active_licenses = (int) $wpdb->get_var( "SELECT COUNT(*) FROM {$wpdb->prefix}wdd_licenses WHERE status = 'active'" );
        $total_downloads = (int) $wpdb->get_var( "SELECT SUM(download_count) FROM {$wpdb->prefix}wdd_downloads" );
        $total_saas = (int) $wpdb->get_var( "SELECT COUNT(*) FROM {$wpdb->prefix}wdd_saas_accounts WHERE status = 'active'" );

        ?>
        <div class="wrap wdd-dashboard">
            <h1><?php esc_html_e( 'Digital Downloads Dashboard', 'woo-digital-downloads' ); ?></h1>

            <div class="wdd-stats-grid">
                <div class="wdd-stat-card">
                    <h3><?php echo esc_html( $active_licenses ); ?></h3>
                    <p><?php esc_html_e( 'Active Licenses', 'woo-digital-downloads' ); ?></p>
                </div>
                <div class="wdd-stat-card">
                    <h3><?php echo esc_html( $total_licenses ); ?></h3>
                    <p><?php esc_html_e( 'Total Licenses', 'woo-digital-downloads' ); ?></p>
                </div>
                <div class="wdd-stat-card">
                    <h3><?php echo esc_html( $total_downloads ?: 0 ); ?></h3>
                    <p><?php esc_html_e( 'Total Downloads', 'woo-digital-downloads' ); ?></p>
                </div>
                <div class="wdd-stat-card">
                    <h3><?php echo esc_html( $total_saas ); ?></h3>
                    <p><?php esc_html_e( 'Active SaaS Accounts', 'woo-digital-downloads' ); ?></p>
                </div>
            </div>

            <p><?php
                printf(
                    /* translators: %s = link */
                    esc_html__( 'Plugin version %s. Go to %s to manage licenses.', 'woo-digital-downloads' ),
                    esc_html( WDD_VERSION ),
                    '<a href="' . esc_url( admin_url( 'admin.php?page=wdd-licenses' ) ) . '">' . esc_html__( 'Licenses', 'woo-digital-downloads' ) . '</a>'
                );
            ?></p>
        </div>
        <?php
    }

    public function page_licenses(): void {
        global $wpdb;

        $licenses = $wpdb->get_results(
            "SELECT l.*, p.post_title AS product_name, u.user_email
               FROM {$wpdb->prefix}wdd_licenses l
               LEFT JOIN {$wpdb->posts} p ON p.ID = l.product_id
               LEFT JOIN {$wpdb->users} u ON u.ID = l.user_id
              ORDER BY l.created_at DESC
              LIMIT 100"
        );

        ?>
        <div class="wrap">
            <h1><?php esc_html_e( 'Licenses', 'woo-digital-downloads' ); ?></h1>
            <table class="wp-list-table widefat fixed striped">
                <thead>
                    <tr>
                        <th><?php esc_html_e( 'License Key', 'woo-digital-downloads' ); ?></th>
                        <th><?php esc_html_e( 'Customer', 'woo-digital-downloads' ); ?></th>
                        <th><?php esc_html_e( 'Product', 'woo-digital-downloads' ); ?></th>
                        <th><?php esc_html_e( 'Status', 'woo-digital-downloads' ); ?></th>
                        <th><?php esc_html_e( 'Sites', 'woo-digital-downloads' ); ?></th>
                        <th><?php esc_html_e( 'Expires', 'woo-digital-downloads' ); ?></th>
                    </tr>
                </thead>
                <tbody>
                <?php if ( empty( $licenses ) ) : ?>
                    <tr><td colspan="6"><?php esc_html_e( 'No licenses found.', 'woo-digital-downloads' ); ?></td></tr>
                <?php else : ?>
                    <?php foreach ( $licenses as $l ) : ?>
                    <tr>
                        <td><code><?php echo esc_html( $l->license_key ); ?></code></td>
                        <td><?php echo esc_html( $l->user_email ?? '' ); ?></td>
                        <td><?php echo esc_html( $l->product_name ?? '' ); ?></td>
                        <td><span class="wdd-badge wdd-badge--<?php echo esc_attr( $l->status ); ?>"><?php echo esc_html( ucfirst( $l->status ) ); ?></span></td>
                        <td><?php echo esc_html( $l->activated_count . ' / ' . ( 'unlimited' === $l->plan_type ? '∞' : $l->activation_limit ) ); ?></td>
                        <td><?php echo $l->expires_at ? esc_html( date_i18n( get_option( 'date_format' ), strtotime( $l->expires_at ) ) ) : esc_html__( 'Lifetime', 'woo-digital-downloads' ); ?></td>
                    </tr>
                    <?php endforeach; ?>
                <?php endif; ?>
                </tbody>
            </table>
        </div>
        <?php
    }

    public function page_versions(): void {
        echo '<div class="wrap"><h1>' . esc_html__( 'Plugin Versions', 'woo-digital-downloads' ) . '</h1>';
        echo '<p>' . esc_html__( 'Upload new plugin ZIPs from the product edit screen, or via the REST API.', 'woo-digital-downloads' ) . '</p></div>';
    }

    public function page_settings(): void {
        if ( isset( $_POST['wdd_settings_nonce'] )
            && wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['wdd_settings_nonce'] ) ), 'wdd_save_settings' ) ) {

            update_option( 'wdd_saas_webhook_url',        sanitize_url( wp_unslash( $_POST['wdd_saas_webhook_url'] ?? '' ) ) );
            update_option( 'wdd_webhook_secret',          sanitize_text_field( wp_unslash( $_POST['wdd_webhook_secret'] ?? '' ) ) );
            update_option( 'wdd_download_expiry_seconds', absint( $_POST['wdd_download_expiry_seconds'] ?? DAY_IN_SECONDS ) );
            update_option( 'wdd_download_max_count',      absint( $_POST['wdd_download_max_count'] ?? 3 ) );

            echo '<div class="notice notice-success"><p>' . esc_html__( 'Settings saved.', 'woo-digital-downloads' ) . '</p></div>';
        }

        $webhook_url = get_option( 'wdd_saas_webhook_url', '' );
        $secret      = get_option( 'wdd_webhook_secret',   '' );
        $expiry      = get_option( 'wdd_download_expiry_seconds', DAY_IN_SECONDS );
        $max_dl      = get_option( 'wdd_download_max_count', 3 );
        ?>
        <div class="wrap">
            <h1><?php esc_html_e( 'Digital Downloads Settings', 'woo-digital-downloads' ); ?></h1>
            <form method="post">
                <?php wp_nonce_field( 'wdd_save_settings', 'wdd_settings_nonce' ); ?>
                <table class="form-table">
                    <tr>
                        <th><label for="wdd_saas_webhook_url"><?php esc_html_e( 'SaaS Webhook URL', 'woo-digital-downloads' ); ?></label></th>
                        <td>
                            <input type="url" id="wdd_saas_webhook_url" name="wdd_saas_webhook_url"
                                   value="<?php echo esc_attr( $webhook_url ); ?>" class="regular-text">
                            <p class="description"><?php esc_html_e( 'Your SaaS backend will receive account.provisioned events here.', 'woo-digital-downloads' ); ?></p>
                        </td>
                    </tr>
                    <tr>
                        <th><label for="wdd_webhook_secret"><?php esc_html_e( 'Webhook Secret', 'woo-digital-downloads' ); ?></label></th>
                        <td>
                            <input type="password" id="wdd_webhook_secret" name="wdd_webhook_secret"
                                   value="<?php echo esc_attr( $secret ); ?>" class="regular-text">
                        </td>
                    </tr>
                    <tr>
                        <th><label for="wdd_download_expiry_seconds"><?php esc_html_e( 'Download Link Expiry (seconds)', 'woo-digital-downloads' ); ?></label></th>
                        <td>
                            <input type="number" id="wdd_download_expiry_seconds" name="wdd_download_expiry_seconds"
                                   value="<?php echo esc_attr( $expiry ); ?>" class="small-text" min="3600">
                            <p class="description"><?php esc_html_e( 'Default: 86400 (24 hours).', 'woo-digital-downloads' ); ?></p>
                        </td>
                    </tr>
                    <tr>
                        <th><label for="wdd_download_max_count"><?php esc_html_e( 'Max Downloads per Token', 'woo-digital-downloads' ); ?></label></th>
                        <td>
                            <input type="number" id="wdd_download_max_count" name="wdd_download_max_count"
                                   value="<?php echo esc_attr( $max_dl ); ?>" class="small-text" min="1">
                        </td>
                    </tr>
                </table>
                <?php submit_button(); ?>
            </form>
        </div>
        <?php
    }

    /**
     * Add "Settings" and "Licenses" links to plugin list.
     *
     * @param string[] $links
     * @return string[]
     */
    public function action_links( array $links ): array {
        $extra = [
            '<a href="' . esc_url( admin_url( 'admin.php?page=wdd-settings' ) ) . '">' . esc_html__( 'Settings', 'woo-digital-downloads' ) . '</a>',
            '<a href="' . esc_url( admin_url( 'admin.php?page=wdd-licenses' ) ) . '">' . esc_html__( 'Licenses', 'woo-digital-downloads' ) . '</a>',
        ];

        return array_merge( $extra, $links );
    }
}
