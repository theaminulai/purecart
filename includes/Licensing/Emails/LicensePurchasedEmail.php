<?php
declare( strict_types=1 );
/**
 * "Your license key" customer email, sent on purchase.
 *
 * @package PureCart\Licensing\Emails
 */

namespace PureCart\Licensing\Emails;

defined( 'ABSPATH' ) || exit;

/**
 * Extends WC_Email so this email appears under WooCommerce → Settings → Emails
 * and admins can toggle it, edit the subject/heading, and preview it there —
 * exactly as the SaaS and Subscriptions module emails do.
 *
 * Triggered by the `purecart_license_created` action fired inside
 * {@see \PureCart\Licensing\LicenseGenerator::create()}.
 *
 * @since 1.0.0
 */
class LicensePurchasedEmail extends \WC_Email {

	/**
	 * License row currently being emailed, set by trigger().
	 *
	 * @since 1.0.0
	 * @var object|null
	 */
	private ?object $license = null;

	/**
	 * Set up email properties and attach to the license-created action.
	 *
	 * @since 1.0.0
	 */
	public function __construct() {
		$this->id             = 'purecart_license_purchased';
		$this->title          = __( 'License Key Purchased', 'purecart' );
		$this->description    = __( 'Sent to the customer when a license key is generated, containing the key, activation limit, and a link to manage it.', 'purecart' );
		$this->customer_email = true;
		$this->email_group    = 'purecart_licensing';

		add_action( 'purecart_license_created', array( $this, 'trigger' ), 10, 1 );

		parent::__construct();
	}

	/**
	 * Returns the default email subject.
	 *
	 * @since 1.0.0
	 * @return string
	 */
	public function get_default_subject(): string {
		return __( 'Your {site_title} license key for {product_name}', 'purecart' );
	}

	/**
	 * Returns the default email heading.
	 *
	 * @since 1.0.0
	 * @return string
	 */
	public function get_default_heading(): string {
		return __( 'Your license key is ready', 'purecart' );
	}

	/**
	 * Returns the default additional content appended below the main body.
	 *
	 * @since 1.0.0
	 * @return string
	 */
	public function get_default_additional_content(): string {
		return __( 'Thank you for choosing {site_title}.', 'purecart' );
	}

	/**
	 * Send the email for the given license row.
	 *
	 * Called by `purecart_license_created`. Bails silently if the license
	 * row, its owner, or the product can't be resolved — a missing product
	 * means the key was already created and stored, so this is a best-effort
	 * delivery, not a gate on provisioning.
	 *
	 * @since 1.0.0
	 * @param object|null $license The newly inserted license row.
	 * @return void
	 */
	public function trigger( $license = null ): void {
		$this->setup_locale();

		$user = is_object( $license ) ? get_userdata( (int) $license->user_id ) : false;

		if ( is_object( $license ) && $user instanceof \WP_User ) {
			$this->license   = $license;
			$this->recipient = $user->user_email;
			$this->set_placeholders( $user );
		}

		if ( $this->license && $this->is_enabled() && $this->get_recipient() ) {
			$this->send(
				$this->get_recipient(),
				$this->get_subject(),
				$this->get_content(),
				$this->get_headers(),
				$this->get_attachments()
			);
		}

		$this->license = null;

		$this->restore_locale();
	}

	/**
	 * Populate email placeholders from the license's owner and product.
	 *
	 * @since 1.0.0
	 * @param \WP_User $user The license owner.
	 * @return void
	 */
	private function set_placeholders( \WP_User $user ): void {
		$product      = function_exists( 'wc_get_product' ) ? wc_get_product( (int) $this->license->product_id ) : null;
		$product_name = $product ? $product->get_name() : get_the_title( (int) $this->license->product_id );

		$this->placeholders = array_merge(
			(array) $this->placeholders,
			array(
				'{first_name}'       => (string) ( $user->first_name ?: $user->display_name ),
				'{product_name}'     => (string) $product_name,
				'{license_key}'      => (string) $this->license->license_key,
				'{activation_limit}' => 'unlimited' === $this->license->plan_type
					? __( 'Unlimited', 'purecart' )
					: (string) $this->license->activation_limit,
				'{expires}'          => $this->license->expires_at
					? date_i18n( get_option( 'date_format' ), strtotime( (string) $this->license->expires_at ) )
					: __( 'Never (lifetime)', 'purecart' ),
			)
		);
	}

	/**
	 * URL of the customer's My Licenses My Account tab.
	 *
	 * @since 1.0.0
	 * @return string
	 */
	private function licenses_url(): string {
		if ( function_exists( 'wc_get_account_endpoint_url' ) ) {
			return wc_get_account_endpoint_url( 'purecart-licenses' );
		}

		return wc_get_page_permalink( 'myaccount' );
	}

	/**
	 * Build the prose body shared between the HTML and plain-text variants.
	 *
	 * All dynamic values are already resolved in the placeholder map; we use
	 * format_string() at render time so subject/heading overrides also get
	 * substituted correctly.
	 *
	 * @since 1.0.0
	 * @return string Un-formatted string with {placeholders} still in place.
	 */
	private function body_message(): string {
		$message  = __(
			'Hi {first_name}, your license key for {product_name} is ready.',
			'purecart'
		);

		$message .= "\n\n" . sprintf(
			/* translators: %s: License key string. */
			__( 'License key: %s', 'purecart' ),
			'{license_key}'
		);

		$message .= "\n" . sprintf(
			/* translators: %s: Site limit or "Unlimited". */
			__( 'Site limit: %s', 'purecart' ),
			'{activation_limit}'
		);

		$message .= "\n" . sprintf(
			/* translators: %s: Expiry date or "Never (lifetime)". */
			__( 'Expires: %s', 'purecart' ),
			'{expires}'
		);

		$message .= "\n\n" . sprintf(
			/* translators: %s: My Account licenses tab URL. */
			__( 'You can activate, deactivate, and manage your sites any time from your account: %s', 'purecart' ),
			esc_url( $this->licenses_url() )
		);

		return $message;
	}

	/**
	 * Returns the HTML email body.
	 *
	 * @since 1.0.0
	 * @return string
	 */
	public function get_content_html(): string {
		ob_start();

		do_action( 'woocommerce_email_header', $this->get_heading(), $this );

		echo wp_kses_post( wpautop( $this->format_string( $this->body_message() ) ) );

		// Inline license key block — visually prominent and easy to copy.
		$key_html = sprintf(
			'<p style="text-align:center;margin:24px 0;"><code style="display:inline-block;padding:12px 20px;background:#f5f5f5;border:1px solid #ddd;border-radius:4px;font-size:16px;letter-spacing:2px;">%s</code></p>',
			esc_html( $this->license->license_key ?? '' )
		);
		echo wp_kses(
			$key_html,
			array(
				'p'    => array( 'style' => true ),
				'code' => array( 'style' => true ),
			)
		);

		$additional = $this->get_additional_content();
		if ( $additional ) {
			echo wp_kses_post( wpautop( $this->format_string( $additional ) ) );
		}

		do_action( 'woocommerce_email_footer', $this );

		return (string) ob_get_clean();
	}

	/**
	 * Returns the plain-text email body.
	 *
	 * @since 1.0.0
	 * @return string
	 */
	public function get_content_plain(): string {
		$content = $this->format_string( $this->body_message() );

		$additional = $this->get_additional_content();
		if ( $additional ) {
			$content .= "\n\n" . $this->format_string( $additional );
		}

		return wp_strip_all_tags( $content );
	}
}
