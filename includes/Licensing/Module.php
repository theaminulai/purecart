<?php
declare( strict_types=1 );
/**
 * Licensing module bootstrap.
 *
 * @package PureCart\Licensing
 */

namespace PureCart\Licensing;

use PureCart\API\Licenses as LicensesApi;
use PureCart\Licensing\Emails\LicensePurchasedEmail;

defined( 'ABSPATH' ) || exit;

/**
 * Wires the Licensing module into the plugin's init flow, mirroring
 * `PureCart\SaaS\Module`. LicenseGenerator, LicenseActivator, and the
 * LicenseToken* JWT collaborators are stateless, instantiated where
 * they're used (RestApi.php's customer-facing `license/*` route handlers,
 * and API\Licenses's own admin routes) — nothing here owns a long-lived
 * instance of them. JwtHooks is the only class that registers its own
 * WordPress hooks (scheduled token cleanup, license-status-change
 * listeners), so alongside the admin API registration, that's all this
 * Module needs to boot.
 *
 * @since 1.0.0
 */
class Module {

	/**
	 * Instantiates the hook-registering classes and registers the admin REST API routes.
	 *
	 * @since 1.0.0
	 */
	public function __construct() {
		new JwtHooks();

		add_filter( 'woocommerce_email_classes', array( $this, 'register_emails' ) );

		( new LicensesApi() )->register();
	}

	/**
	 * Register the module's customer emails under WooCommerce → Settings → Emails.
	 *
	 * @since 1.0.0
	 * @param array<string, \WC_Email> $emails Registered WooCommerce emails.
	 * @return array<string, \WC_Email>
	 */
	public function register_emails( array $emails ): array {
		$email                 = new LicensePurchasedEmail();
		$emails[ $email->id ] = $email;

		return $emails;
	}
}
