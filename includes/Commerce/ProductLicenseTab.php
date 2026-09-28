<?php
/**
 * "License" WooCommerce product data tab for PureCart's one-time product types.
 *
 * Covers purecart_plugin, purecart_saas, and purecart_bundle — the three
 * Commerce product types that provision a license on purchase via
 * LicenseGenerator::create(). The purecart_subscription type manages these
 * same settings through its own Subscription tab in
 * SubscriptionProduct::render_data_panel() (software/saas delivery sub-fields).
 *
 * @package PureCart\Commerce
 */

declare( strict_types=1 );

namespace PureCart\Commerce;

defined( 'ABSPATH' ) || exit;

/**
 * Adds and saves the "License" product data tab for Commerce product types.
 *
 * @since 1.0.0
 */
class ProductLicenseTab {

	/**
	 * Product type slugs this tab is visible on.
	 *
	 * @since 1.0.0
	 * @var   string[]
	 */
	private const TYPES = array(
		ProductTypes::TYPE_PLUGIN,
		ProductTypes::TYPE_SAAS,
		ProductTypes::TYPE_BUNDLE,
	);

	/**
	 * Register hooks.
	 *
	 * @since 1.0.0
	 */
	public function __construct() {
		add_filter( 'woocommerce_product_data_tabs', array( $this, 'add_tab' ) );
		add_action( 'woocommerce_product_data_panels', array( $this, 'render_panel' ) );
		add_action( 'woocommerce_process_product_meta', array( $this, 'save' ) );
	}

	/**
	 * Add the "License" tab to the WooCommerce product data metabox.
	 *
	 * The three `show_if_*` classes follow WooCommerce's own convention —
	 * its core JS shows/hides tabs based on the `#product-type` select value,
	 * matching any class whose `show_if_X` suffix equals the selected type.
	 *
	 * @since  1.0.0
	 * @param  array<string, array<string, mixed>> $tabs Existing product data tabs.
	 * @return array<string, array<string, mixed>>
	 */
	public function add_tab( array $tabs ): array {
		$show_classes = array_map(
			static fn( string $type ) => 'show_if_' . $type,
			self::TYPES
		);

		$tabs['purecart_license'] = array(
			'label'    => __( 'License', 'purecart' ),
			'target'   => 'purecart_license_data',
			'class'    => $show_classes,
			'priority' => 20,
		);

		return $tabs;
	}

	/**
	 * Render the "License" panel.
	 *
	 * @since 1.0.0
	 * @return void
	 */
	public function render_panel(): void {
		global $post;

		$product_id = (int) $post->ID;

		$meta = static function ( string $key, $default = '' ) use ( $product_id ) {
			$value = get_post_meta( $product_id, $key, true );
			return '' === $value ? $default : $value;
		};

		?>
		<div id="purecart_license_data" class="panel woocommerce_options_panel">
			<div class="options_group">
				<?php
				woocommerce_wp_select(
					array(
						'id'          => '_purecart_license_type',
						'label'       => __( 'License type', 'purecart' ),
						'value'       => $meta( '_purecart_license_type', 'single' ),
						'options'     => array(
							'single'    => __( 'Single site', 'purecart' ),
							'multi'     => __( 'Multi-site', 'purecart' ),
							'unlimited' => __( 'Unlimited sites', 'purecart' ),
							'lifetime'  => __( 'Lifetime (no expiry)', 'purecart' ),
						),
						'description' => __( 'Scope of the license key issued on purchase.', 'purecart' ),
						'desc_tip'    => true,
					)
				);
				woocommerce_wp_text_input(
					array(
						'id'                => '_purecart_license_duration_days',
						'label'             => __( 'License duration (days)', 'purecart' ),
						'type'              => 'number',
						'custom_attributes' => array(
							'min'  => '1',
							'step' => '1',
						),
						'value'             => $meta( '_purecart_license_duration_days', 365 ),
						'description'       => __( 'Set 365 for 1 year. Ignored when type is "Lifetime (no expiry)".', 'purecart' ),
						'desc_tip'          => true,
					)
				);
				woocommerce_wp_select(
					array(
						'id'          => '_purecart_renewal_behavior',
						'label'       => __( 'Renewal behavior', 'purecart' ),
						'value'       => $meta( '_purecart_renewal_behavior', 'extend' ),
						'options'     => array(
							'extend'  => __( 'Extend existing key', 'purecart' ),
							'new_key' => __( 'Issue a new key', 'purecart' ),
						),
						'description' => __( '"Issue a new key" revokes the old key on subscription renewal — useful for metered or seat-limited models.', 'purecart' ),
						'desc_tip'    => true,
					)
				);
				?>
			</div>
			<div class="options_group">
				<?php
				woocommerce_wp_text_input(
					array(
						'id'          => '_purecart_plugin_slug',
						'label'       => __( 'Plugin slug', 'purecart' ),
						'value'       => $meta( '_purecart_plugin_slug' ),
						'description' => __( 'Folder/file slug used by the auto-update API endpoint. Only used for PureCart – Plugin products.', 'purecart' ),
						'desc_tip'    => true,
					)
				);
				woocommerce_wp_text_input(
					array(
						'id'          => '_purecart_saas_plan',
						'label'       => __( 'SaaS plan', 'purecart' ),
						'value'       => $meta( '_purecart_saas_plan', 'starter' ),
						'description' => __( 'Plan identifier sent to your SaaS webhook on activation. Only used for PureCart – SaaS products.', 'purecart' ),
						'desc_tip'    => true,
					)
				);
				?>
			</div>
		</div>
		<?php
	}

	/**
	 * Save the license tab fields.
	 *
	 * WooCommerce verifies the `woocommerce_save_data` nonce and
	 * `current_user_can( 'edit_post' )` before firing
	 * `woocommerce_process_product_meta`; the capability re-check here is
	 * defence in depth.
	 *
	 * @since 1.0.0
	 * @param int $product_id WooCommerce product ID.
	 * @return void
	 */
	public function save( int $product_id ): void {
		if ( ! current_user_can( 'edit_post', $product_id ) ) {
			return;
		}

		// phpcs:ignore WordPress.Security.NonceVerification.Missing -- WooCommerce verifies the woocommerce_save_data nonce before woocommerce_process_product_meta fires.
		$product_type = isset( $_POST['product-type'] ) ? sanitize_text_field( wp_unslash( $_POST['product-type'] ) ) : '';

		if ( ! in_array( $product_type, self::TYPES, true ) ) {
			return;
		}

		// phpcs:ignore WordPress.Security.NonceVerification.Missing -- nonce verified upstream by WooCommerce; see above.
		if ( isset( $_POST['_purecart_license_duration_days'] ) ) {
			// phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized, WordPress.Security.NonceVerification.Missing -- absint() sanitizes; nonce verified upstream.
			update_post_meta( $product_id, '_purecart_license_duration_days', absint( wp_unslash( $_POST['_purecart_license_duration_days'] ) ) );
		}

		// phpcs:ignore WordPress.Security.NonceVerification.Missing -- nonce verified upstream by WooCommerce.
		if ( isset( $_POST['_purecart_plugin_slug'] ) ) {
			// phpcs:ignore WordPress.Security.NonceVerification.Missing -- nonce verified upstream by WooCommerce.
			update_post_meta( $product_id, '_purecart_plugin_slug', sanitize_text_field( wp_unslash( $_POST['_purecart_plugin_slug'] ) ) );
		}

		// phpcs:ignore WordPress.Security.NonceVerification.Missing -- nonce verified upstream by WooCommerce.
		if ( isset( $_POST['_purecart_saas_plan'] ) ) {
			// phpcs:ignore WordPress.Security.NonceVerification.Missing -- nonce verified upstream by WooCommerce.
			update_post_meta( $product_id, '_purecart_saas_plan', sanitize_text_field( wp_unslash( $_POST['_purecart_saas_plan'] ) ) );
		}

		$enum_fields = array(
			'_purecart_license_type'     => array( array( 'single', 'multi', 'unlimited', 'lifetime' ), 'single' ),
			'_purecart_renewal_behavior' => array( array( 'extend', 'new_key' ), 'extend' ),
		);

		foreach ( $enum_fields as $meta_key => list( $allowed, $default ) ) {
			// phpcs:ignore WordPress.Security.NonceVerification.Missing -- nonce verified upstream by WooCommerce.
			if ( ! isset( $_POST[ $meta_key ] ) ) {
				continue;
			}
			// phpcs:ignore WordPress.Security.NonceVerification.Missing -- nonce verified upstream by WooCommerce.
			$value = sanitize_text_field( wp_unslash( $_POST[ $meta_key ] ) );
			update_post_meta( $product_id, $meta_key, in_array( $value, $allowed, true ) ? $value : $default );
		}
	}
}
