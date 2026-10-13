<?php
declare( strict_types=1 );
/**
 * Database store for wp_purecart_subscription_items.
 *
 * @package PureCart\Store
 */

namespace PureCart\Store;

defined( 'ABSPATH' ) || exit;

/**
 * Creates and maintains the subscription line-items table.
 *
 * Forward-looking for bundle/multi-product subscriptions — not used by
 * MVP logic yet, created now so no later migration is needed.
 *
 * @since 1.0.0
 */
class SubscriptionItems extends PureCartStore {

	/**
	 * Returns the CREATE TABLE SQL for the subscription line-items table.
	 *
	 * @since 1.0.0
	 * @param string $charset Character set collation string from $wpdb->get_charset_collate().
	 * @return string CREATE TABLE SQL statement ready for dbDelta().
	 */
	protected function schema( string $charset ): string {
		global $wpdb;

		return "CREATE TABLE {$wpdb->prefix}purecart_subscription_items (
            id               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            subscription_id  BIGINT UNSIGNED NOT NULL,
            product_id       BIGINT UNSIGNED NOT NULL,
            variation_id     BIGINT UNSIGNED DEFAULT 0,
            qty              INT UNSIGNED NOT NULL DEFAULT 1,
            line_subtotal    DECIMAL(10,2) NOT NULL,
            line_total       DECIMAL(10,2) NOT NULL,
            delivery_type    VARCHAR(32) NOT NULL DEFAULT 'membership',
            PRIMARY KEY  (id),
            KEY idx_subscription_id (subscription_id)
        ) $charset;";
	}
}
