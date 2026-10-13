<?php
declare( strict_types=1 );
/**
 * Adds custom tabs to WooCommerce My Account page.
 *
 * @package PureCart\CustomerDashboard
 */

namespace PureCart\CustomerDashboard;

defined( 'ABSPATH' ) || exit;


/**
 * Registers and renders My Account dashboard tabs.
 *
 * Deliberately does NOT register a "Downloads" tab of its own — WooCommerce
 * already has a native one, and PureCart's own downloads are merged into
 * that same native tab instead (see {@see \PureCart\Downloads\AccountDownloadsMerger}).
 * Running a second, separate "Downloads" tab here used to mean an account
 * with any regular WooCommerce downloadable-product purchase saw two tabs
 * both labeled "Downloads" at once.
 */
class Dashboard {

	/**
	 * My Account endpoint slugs registered by this class.
	 *
	 * @since 1.0.0
	 * @var string[]
	 */
	private array $slugs = array( 'purecart-licenses', 'purecart-updates', 'purecart-api-keys', 'purecart-subscriptions' );

	/**
	 * Register My Account menu, query var, and endpoint hooks.
	 *
	 * @since 1.0.0
	 */
	public function __construct() {
		add_filter( 'woocommerce_account_menu_items', array( $this, 'menu_items' ) );
		add_filter( 'woocommerce_get_query_vars', array( $this, 'query_vars' ) );
		add_filter( 'woocommerce_account_menu_item_classes', array( $this, 'menu_item_classes' ), 10, 2 );

		foreach ( $this->slugs as $slug ) {
			add_action( "woocommerce_account_{$slug}_endpoint", array( $this, 'render_tab' ) );
		}

		add_action( 'init', array( $this, 'endpoints' ) );
		add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_assets' ) );
	}

	/**
	 * Enqueue styles and scripts for PureCart My Account tabs.
	 *
	 * @since 1.0.0
	 * @return void
	 */
	public function enqueue_assets(): void {
		if ( ! function_exists( 'is_wc_endpoint_url' ) ) {
			return;
		}

		if ( is_wc_endpoint_url( 'purecart-licenses' ) ) {
			wp_enqueue_style( 'purecart-admin', PURECART_URL . 'assets/css/admin.css', array(), PURECART_VERSION );
			wp_enqueue_script( 'purecart-admin', PURECART_URL . 'assets/js/admin.js', array( 'jquery' ), PURECART_VERSION, true );
			wp_localize_script(
				'purecart-admin',
				'purecartAdmin',
				array(
					'apiUrl' => esc_url_raw( rest_url( PURECART_API_NAMESPACE . '/' ) ),
				)
			);
		}

		if ( is_wc_endpoint_url( 'purecart-updates' ) ) {
			wp_enqueue_style( 'purecart-myaccount-updates', PURECART_URL . 'assets/css/purecart-myaccount-updates.css', array(), PURECART_VERSION );
		}

		if ( is_wc_endpoint_url( 'purecart-api-keys' ) ) {
			wp_enqueue_style( 'purecart-myaccount-api-keys', PURECART_URL . 'assets/css/purecart-myaccount-api-keys.css', array(), PURECART_VERSION );
		}

		if ( is_wc_endpoint_url( 'purecart-subscriptions' ) ) {
			wp_enqueue_style(
				'purecart-myaccount-subscriptions',
				PURECART_URL . 'build/woo-account/subscriptions.css',
				array(),
				PURECART_VERSION
			);
			wp_enqueue_script(
				'purecart-myaccount-subscriptions',
				PURECART_URL . 'build/woo-account/subscriptions.js',
				array(),
				PURECART_VERSION,
				true
			);
			wp_localize_script(
				'purecart-myaccount-subscriptions',
				'purecartMyAccount',
				array(
					'apiUrl' => esc_url_raw( rest_url( PURECART_API_NAMESPACE . '/subscriptions/' ) ),
					'nonce'  => wp_create_nonce( 'wp_rest' ),
					'i18n'   => array(
						'processing' => __( 'Processing…', 'purecart' ),
						'done'       => __( 'Done! Refreshing…', 'purecart' ),
						'error'      => __( 'An error occurred. Please try again.', 'purecart' ),
					),
				)
			);
		}
	}

	/**
	 * Returns the slug => label map for PureCart My Account tabs.
	 *
	 * @since 1.0.0
	 * @return array<string,string>
	 */
	private function get_tabs(): array {
		return array(
			'purecart-licenses'      => __( 'My Licenses', 'purecart' ),
			'purecart-updates'       => __( 'Software Updates', 'purecart' ),
			'purecart-api-keys'      => __( 'API Keys', 'purecart' ),
			'purecart-subscriptions' => __( 'My Subscriptions', 'purecart' ),
		);
	}

	/**
	 * Register PureCart endpoints on the WooCommerce My Account page.
	 *
	 * Flushes rewrite rules once — automatically — whenever the set of
	 * registered slugs changes (new endpoint added, old one removed). Uses a
	 * hash stored in an option so the flush only fires on the first request
	 * after a code change, never on every page load.
	 *
	 * @since 1.0.0
	 * @return void
	 */
	public function endpoints(): void {
		foreach ( $this->slugs as $slug ) {
			add_rewrite_endpoint( $slug, EP_ROOT | EP_PAGES );
		}

		$current = md5( implode( ',', $this->slugs ) );
		if ( get_option( 'purecart_endpoints_version' ) !== $current ) {
			flush_rewrite_rules( false );
			update_option( 'purecart_endpoints_version', $current, false );
		}
	}

	/**
	 * Inject PureCart tabs into the WooCommerce My Account navigation.
	 *
	 * @since  1.0.0
	 * @param  array<string,string> $items Existing menu items (slug => label).
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
	 * Register PureCart endpoint slugs as WooCommerce query variables.
	 *
	 * @since  1.0.0
	 * @param  array<string,string> $vars Existing query vars (slug => slug).
	 * @return array<string,string>
	 */
	public function query_vars( array $vars ): array {
		foreach ( $this->slugs as $slug ) {
			$vars[ $slug ] = $slug;
		}
		return $vars;
	}

	/**
	 * Add an is-active CSS class to the current PureCart My Account menu item.
	 *
	 * @since  1.0.0
	 * @param  string[] $classes  Existing CSS classes for the menu item.
	 * @param  string   $endpoint The endpoint slug being rendered.
	 * @return string[]
	 */
	public function menu_item_classes( array $classes, string $endpoint ): array {
		global $wp;

		if ( isset( $wp->query_vars[ $endpoint ] ) ) {
			$classes[] = 'is-active';
		}

		return $classes;
	}

	/**
	 * Determine the active PureCart endpoint and delegate to the correct renderer.
	 *
	 * @since 1.0.0
	 * @return void
	 */
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
			case 'purecart-updates':
				$this->render_updates_tab();
				break;
			case 'purecart-api-keys':
				$this->render_api_keys_tab();
				break;
			case 'purecart-subscriptions':
				$this->render_subscriptions_tab();
				break;
		}
	}

	/**
	 * Render the Software Updates tab content.
	 *
	 * @since 1.0.0
	 * @return void
	 */
	private function render_updates_tab(): void {
		$template = PURECART_PATH . 'templates/myaccount/purecart-updates.php';
		$override = locate_template( 'purecart/myaccount/purecart-updates.php' );

		if ( '' !== $override ) {
			load_template( $override );
		} elseif ( file_exists( $template ) ) {
			load_template( $template );
		}
	}

	/**
	 * Render the My Subscriptions tab content.
	 *
	 * Supports theme overrides at:
	 *   yourtheme/purecart/myaccount/purecart-subscriptions.php
	 *
	 * @since 1.0.0
	 * @return void
	 */
	private function render_subscriptions_tab(): void {
		$template = PURECART_PATH . 'templates/myaccount/purecart-subscriptions.php';
		$override = locate_template( 'purecart/myaccount/purecart-subscriptions.php' );

		if ( '' !== $override ) {
			load_template( $override );
		} elseif ( file_exists( $template ) ) {
			load_template( $template );
		}
	}

	/**
	 * Render the My Licenses tab content.
	 *
	 * Supports theme overrides at:
	 *   yourtheme/purecart/myaccount/purecart-licenses.php
	 *
	 * @since 1.0.0
	 * @return void
	 */
	private function render_licenses_tab(): void {
		$template = PURECART_PATH . 'templates/myaccount/purecart-licenses.php';
		$override = locate_template( 'purecart/myaccount/purecart-licenses.php' );

		if ( '' !== $override ) {
			load_template( $override );
		} elseif ( file_exists( $template ) ) {
			load_template( $template );
		}
	}

	/**
	 * Render the API Keys tab content.
	 *
	 * Supports theme overrides at:
	 *   yourtheme/purecart/myaccount/purecart-api-keys.php
	 *
	 * @since 1.0.0
	 * @return void
	 */
	private function render_api_keys_tab(): void {
		$template = PURECART_PATH . 'templates/myaccount/purecart-api-keys.php';
		$override = locate_template( 'purecart/myaccount/purecart-api-keys.php' );

		if ( '' !== $override ) {
			load_template( $override );
		} elseif ( file_exists( $template ) ) {
			load_template( $template );
		}
	}
}
