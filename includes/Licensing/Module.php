<?php
/**
 * Licensing module bootstrap.
 *
 * @package PureCart\Licensing
 */

declare( strict_types=1 );

namespace PureCart\Licensing;

use PureCart\API\Licenses as LicensesApi;

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
	 * @since 1.0.0
	 */
	public function __construct() {
		new JwtHooks();

		( new LicensesApi() )->register();
	}
}
