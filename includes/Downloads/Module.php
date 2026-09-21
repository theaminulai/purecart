<?php
/**
 * Secure Downloads module bootstrap.
 *
 * @package PureCart\Downloads
 */

declare( strict_types=1 );

namespace PureCart\Downloads;

use PureCart\API\Downloads as DownloadsApi;

defined( 'ABSPATH' ) || exit;

/**
 * Wires the Downloads module into the plugin's init flow, mirroring
 * `PureCart\SaaS\Module`. DownloadLogRepository and TokenManager are
 * stateless collaborators instantiated where they're used (API\Downloads's
 * admin route handlers) — nothing here owns a long-lived instance of them.
 * AccountDownloadsMerger and DownloadDispatcher are the two classes that
 * register their own WordPress hooks (the My Account downloads-tab merger
 * and the customer-facing token dispatcher), so alongside the admin API
 * registration, that's all this Module needs to boot.
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

		( new DownloadsApi() )->register();
	}
}
