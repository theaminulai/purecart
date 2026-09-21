<?php
/**
 * Secure Downloads module bootstrap.
 *
 * @package PureCart\Downloads
 */

declare( strict_types=1 );

namespace PureCart\Downloads;

defined( 'ABSPATH' ) || exit;

/**
 * Wires the Downloads module into the plugin's init flow, mirroring
 * `PureCart\SaaS\Module`. DownloadLogRepository and TokenManager are
 * stateless collaborators instantiated where they're used (RestApi.php's
 * admin `/downloads/*` route handlers) — nothing here owns a long-lived
 * instance of them. The admin REST routes themselves live on RestApi.php
 * rather than a dedicated DownloadsApi controller, since that file is
 * already this plugin's central REST registrar (see its own docblock), so
 * this Module only needs to boot the two classes that register their own
 * WordPress hooks: the customer-facing token dispatcher and the My Account
 * downloads-tab merger.
 *
 * @since 1.0.0
 */
class Module {

	/**
	 * @since 1.0.0
	 */
	public function __construct() {
		new AccountDownloadsMerger();
		new DownloadDispatcher();
	}
}
