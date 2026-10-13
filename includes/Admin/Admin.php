<?php
declare( strict_types=1 );
/**
 * WordPress admin integration for PureCart.
 *
 * Registers the top-level menu and all eleven sub-pages. Every page
 * renders the same React SPA root element — client-side routing (HashRouter)
 * handles navigation within the SPA. WordPress receives a `currentPage`
 * value via wp_localize_script so the SPA can navigate to the correct
 * route on first load without a full-page reload.
 *
 * @package PureCart\Admin
 */

namespace PureCart\Admin;

defined( 'ABSPATH' ) || exit;

/**
 * Admin panel: menus, asset enqueue, settings.
 *
 * @since 1.0.0
 */
class Admin {


	/**
	 * WP admin page slug → React page name.
	 *
	 * Used by enqueue_assets() to pass the correct initial route to the SPA
	 * via wp_localize_script without having to inspect the $hook suffix.
	 *
	 * @since 1.0.0
	 * @var array<string, string>
	 */
	private const SLUG_TO_PAGE = array(
		'purecart-dashboard'      => 'overview',
		'purecart-licenses'       => 'licenses',
		'purecart-downloads'      => 'downloads',
		'purecart-updates'        => 'updates',
		'purecart-subscriptions'  => 'subscriptions',
		'purecart-saas-accounts'  => 'saas-accounts',
		'purecart-affiliates'     => 'affiliates',
		'purecart-abandoned-cart' => 'abandoned-cart',
		'purecart-security'       => 'security',
		'purecart-analytics'      => 'analytics',
		'purecart-settings'       => 'settings',
	);

	/**
	 * Register admin hooks.
	 *
	 * @since 1.0.0
	 */
	public function __construct() {
		add_action( 'admin_menu', array( $this, 'register_menus' ) );
		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_assets' ) );
		add_filter( 'plugin_action_links_' . PURECART_BASENAME, array( $this, 'action_links' ) );
	}

	/**
	 * Register the PureCart top-level menu and all sub-pages.
	 *
	 * All callbacks render the same React SPA root element. WordPress's
	 * admin_enqueue_scripts hook reads $_GET['page'] to determine which
	 * React route to activate on first load (see enqueue_assets()).
	 *
	 * @since 1.0.0
	 * @return void
	 */
	public function register_menus(): void {
		add_menu_page(
			__( 'PureCart', 'purecart' ),
			__( 'PureCart', 'purecart' ),
			'manage_woocommerce',
			'purecart-dashboard',
			fn() => $this->render_react_root(),
			'dashicons-download',
			58
		);

		// Sub-pages — all render the same React root.
		// The first entry reuses the parent slug to rename the default
		// "PureCart" submenu item to "Overview" in the WP sidebar.
		$nav_items = array(
			array( 'purecart-dashboard', __( 'Overview', 'purecart' ), 'manage_woocommerce' ),
			array( 'purecart-licenses', __( 'Licenses', 'purecart' ), 'manage_woocommerce' ),
			array( 'purecart-downloads', __( 'Downloads', 'purecart' ), 'manage_woocommerce' ),
			array( 'purecart-updates', __( 'Updates', 'purecart' ), 'manage_woocommerce' ),
			array( 'purecart-subscriptions', __( 'Subscriptions', 'purecart' ), 'manage_woocommerce' ),
			array( 'purecart-saas-accounts', __( 'SaaS Accounts', 'purecart' ), 'manage_woocommerce' ),
			array( 'purecart-affiliates', __( 'Affiliates', 'purecart' ), 'manage_woocommerce' ),
			array( 'purecart-abandoned-cart', __( 'Abandoned Cart', 'purecart' ), 'manage_woocommerce' ),
			array( 'purecart-security', __( 'Security', 'purecart' ), 'manage_woocommerce' ),
			array( 'purecart-analytics', __( 'Analytics', 'purecart' ), 'manage_woocommerce' ),
			array( 'purecart-settings', __( 'Settings', 'purecart' ), 'manage_options' ),
		);

		foreach ( $nav_items as list($slug, $label, $capability) ) {
			add_submenu_page(
				'purecart-dashboard',
				/* translators: %s = module name */
				sprintf( __( '%s — PureCart', 'purecart' ), $label ),
				$label,
				$capability,
				$slug,
				fn() => $this->render_react_root()
			);
		}
	}

	/**
	 * Output the React SPA mount point.
	 *
	 * All admin sub-pages call this. The SPA reads window.purecartAdmin.currentPage
	 * (set by enqueue_assets via wp_localize_script) to navigate to the correct
	 * initial route without a second HTTP request.
	 *
	 * @since 1.0.0
	 * @return void
	 */
	private function render_react_root(): void {
		?>
			<div id="purecart-root"></div>
		<?php
	}

	/**
	 * Enqueue admin assets on PureCart pages.
	 *
	 * Loads the React build and localizes the current React page name so the
	 * SPA can navigate to the correct route on first mount.
	 *
	 * @since 1.0.0
	 * @param string $hook Current admin page hook suffix.
	 * @return void
	 */
	public function enqueue_assets( string $hook ): void {
		// React SPA pages
		// All purecart pages share the same hook prefix or top-level hook.
		if ( strpos( $hook, 'purecart' ) === false ) {
			return;
		}

		$asset_file = PURECART_PATH . 'build/admin/app/app.asset.php';
		if ( ! file_exists( $asset_file ) ) {
			return;
		}

		$asset = require $asset_file;

		wp_enqueue_style(
			'purecart-app',
			PURECART_URL . 'build/admin/app/app.css',
			array(),
			$asset['version']
		);

		wp_enqueue_script(
			'purecart-app',
			PURECART_URL . 'build/admin/app/app.js',
			$asset['dependencies'],
			$asset['version'],
			true
		);

		// Determine which React page to show on initial load from the WP slug.
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Reading page slug for routing only, not processing form data.
		$wp_slug      = isset( $_GET['page'] ) ? sanitize_key( $_GET['page'] ) : 'purecart-dashboard';
		$current_page = self::SLUG_TO_PAGE[ $wp_slug ] ?? 'overview';

		wp_localize_script(
			'purecart-app',
			'purecartAdmin',
			array(
				'nonce'       => wp_create_nonce( 'purecart_admin_nonce' ),
				'restNonce'   => wp_create_nonce( 'wp_rest' ),
				'apiUrl'      => esc_url_raw( rest_url( PURECART_API_NAMESPACE . '/' ) ),
				'adminUrl'    => esc_url_raw( admin_url() ),
				'currentPage' => $current_page,
				'version'     => PURECART_VERSION,
				'currentUser' => $this->current_user_payload(),
			)
		);

		$this->enqueue_menu_router();
	}

	/**
	 * Display data for the signed-in user, for the SPA top bar's account menu.
	 *
	 * Presentation fields plus the two wp-admin URLs the menu links to — and
	 * one capability flag, used only to decide whether the menu shows its
	 * Settings link. It is deliberately not a permissions source: every REST
	 * route re-checks its own capability server-side, so a tampered value
	 * here can reveal a link, never an action.
	 *
	 * @since 1.1.0
	 * @return array<string, mixed> The `purecartAdmin.currentUser` payload.
	 */
	private function current_user_payload(): array {
		$user = wp_get_current_user();

		$role_names = wp_roles()->get_names();
		$role_slug  = (string) ( ( (array) $user->roles )[0] ?? '' );
		$role_label = isset( $role_names[ $role_slug ] )
			? translate_user_role( $role_names[ $role_slug ] )
			: '';

		return array(
			'id'               => (int) $user->ID,
			'name'             => (string) $user->display_name,
			'email'            => (string) $user->user_email,
			'avatarUrl'        => (string) get_avatar_url( $user->ID, array( 'size' => 72 ) ),
			'roleLabel'        => $role_label,
			'profileUrl'       => esc_url_raw( admin_url( 'profile.php' ) ),
			'logoutUrl'        => esc_url_raw( wp_logout_url() ),
			'canManageOptions' => current_user_can( 'manage_options' ),
		);
	}

	/**
	 * Registers and enqueues the menu-router script with its slug-to-path map.
	 *
	 * Intercepts WordPress sidebar link clicks so the React SPA navigates
	 * without a full page reload. Each `purecart-*` admin slug maps to a
	 * HashRouter path; the router script prevents the default anchor
	 * navigation, pushes the hash change (which HashRouter picks up via the
	 * native `hashchange` event), then restores the correct `?page=` parameter
	 * with `replaceState` so browser refreshes and WP menu highlighting work
	 * as expected.
	 *
	 * @since 1.0.0
	 * @return void
	 */
	private function enqueue_menu_router(): void {
		$asset_router_file = PURECART_PATH . 'build/admin/menu-router/menu-router.asset.php';
		if ( ! file_exists( $asset_router_file ) ) {
			return;
		}
		wp_register_script(
			'purecart-menu-router',
			PURECART_URL . 'build/admin/menu-router/menu-router.js',
			array( 'purecart-app' ),
			PURECART_VERSION,
			true
		);

		wp_localize_script(
			'purecart-menu-router',
			'purecartMenuMap',
			array(
				'purecart-dashboard'      => '/overview',
				'purecart-licenses'       => '/licenses',
				'purecart-downloads'      => '/downloads',
				'purecart-updates'        => '/updates',
				'purecart-subscriptions'  => '/subscriptions',
				'purecart-saas-accounts'  => '/saas-accounts',
				'purecart-affiliates'     => '/affiliates',
				'purecart-abandoned-cart' => '/abandoned-cart',
				'purecart-security'       => '/security',
				'purecart-analytics'      => '/analytics',
				'purecart-settings'       => '/settings',
			)
		);

		wp_enqueue_script( 'purecart-menu-router' );
	}
	/**
	 * Add Settings and Licenses quick links to the plugin row on the Plugins screen.
	 *
	 * @since  1.0.0
	 * @param  string[] $links Existing plugin action links.
	 * @return string[]
	 */
	public function action_links( array $links ): array {
		$extra = array(
			'<a href="' . esc_url( admin_url( 'admin.php?page=purecart-settings' ) ) . '">' . esc_html__( 'Settings', 'purecart' ) . '</a>',
			'<a href="' . esc_url( admin_url( 'admin.php?page=purecart-licenses' ) ) . '">' . esc_html__( 'Licenses', 'purecart' ) . '</a>',
		);
		return array_merge( $extra, $links );
	}
}
