<?php
declare( strict_types=1 );
/**
 * Database store for wp_purecart_saas_accounts.
 *
 * @package PureCart\Store
 */

namespace PureCart\Store;

defined( 'ABSPATH' ) || exit;

/**
 * Creates and maintains the SaaS provisioned accounts table.
 *
 * @since 1.0.0
 */
class SaasAccounts extends PureCartStore {

	/**
	 * Returns the CREATE TABLE SQL for the SaaS provisioned accounts table.
	 *
	 * @since 1.0.0
	 * @param string $charset Character set collation string from $wpdb->get_charset_collate().
	 * @return string CREATE TABLE SQL statement ready for dbDelta().
	 */
	protected function schema( string $charset ): string {
		global $wpdb;

		return "CREATE TABLE {$wpdb->prefix}purecart_saas_accounts (
            id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            user_id        BIGINT UNSIGNED NOT NULL DEFAULT 0,
            order_id       BIGINT UNSIGNED NOT NULL DEFAULT 0,
            product_id     BIGINT UNSIGNED NOT NULL DEFAULT 0,
            plan           VARCHAR(50)  NOT NULL DEFAULT '',
            api_key        VARCHAR(128) NOT NULL DEFAULT '',
            status         ENUM('active','suspended','cancelled') NOT NULL DEFAULT 'active',
            provisioned_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY  (id),
            UNIQUE KEY  api_key          (api_key),
            KEY idx_user_product (user_id, product_id)
        ) $charset;";
	}
}
