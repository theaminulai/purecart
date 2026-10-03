<?php
declare( strict_types=1 );
/**
 * Database store for wp_purecart_product_versions.
 *
 * @package PureCart\Store
 */

namespace PureCart\Store;

defined( 'ABSPATH' ) || exit;

/**
 * Creates and maintains the product version / update manifest table.
 *
 * Beyond the core version and channel columns, this table tracks additional
 * metadata required by the Updates module:
 *
 *   platform        per-platform packages (.dmg / .exe / .AppImage share a product)
 *   file_size       shown in admin version history without stat()-ing each file
 *   release_notes   short plain-text summary, separate from the HTML changelog
 *   is_active       pull a bad release without deleting its row or file
 *   is_rollback     marks a row reactivated by an emergency rollback (admin badge)
 *   download_count  per-version download analytics
 *   created_by      audit trail: which admin uploaded this package
 *
 * The `channel` ENUM includes `nightly` in addition to `stable` and `beta`.
 *
 * @since 1.0.0
 */
class ProductVersions extends PureCartStore {

	/**
	 * Returns the CREATE TABLE SQL for the product versions table.
	 *
	 * @since 1.0.0
	 * @param string $charset Character set collation string from $wpdb->get_charset_collate().
	 * @return string CREATE TABLE SQL statement ready for dbDelta().
	 */
	protected function schema( string $charset ): string {
		global $wpdb;

		// Every ENUM stays on a single line. dbDelta() splits a CREATE TABLE
		// body on commas to identify column definitions, so an ENUM broken
		// across lines makes it read each quoted value as its own column name
		// and emit malformed `ADD COLUMN 'beta'` statements. This exact bug
		// hit the subscriptions table on a live site — see
		// Subscriptions\Schema::migrate_status_enum().
		return "CREATE TABLE {$wpdb->prefix}purecart_product_versions (
            id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            product_id      BIGINT UNSIGNED NOT NULL,
            version         VARCHAR(32) NOT NULL DEFAULT '',
            platform        VARCHAR(64) NOT NULL DEFAULT 'all',
            channel         ENUM('stable','beta','nightly') NOT NULL DEFAULT 'stable',
            file_path       TEXT        NOT NULL,
            file_size       BIGINT UNSIGNED NOT NULL DEFAULT 0,
            checksum_sha256 VARCHAR(64) NOT NULL DEFAULT '',
            requires_wp     VARCHAR(10) NOT NULL DEFAULT '',
            tested_wp       VARCHAR(10) NOT NULL DEFAULT '',
            requires_php    VARCHAR(10) NOT NULL DEFAULT '',
            changelog       LONGTEXT,
            release_notes   TEXT NULL,
            is_active       TINYINT(1) NOT NULL DEFAULT 1,
            is_rollback     TINYINT(1) NOT NULL DEFAULT 0,
            download_count  BIGINT UNSIGNED NOT NULL DEFAULT 0,
            released_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            created_by      BIGINT UNSIGNED NULL,
            PRIMARY KEY  (id),
            KEY idx_product_version (product_id, version),
            KEY idx_channel         (product_id, channel, is_active),
            KEY idx_platform        (product_id, platform),
            KEY idx_released_at     (released_at)
        ) $charset;";
	}

	/**
	 * Create/upgrade the table, then force the `channel` ENUM's value list.
	 *
	 * dbDelta() reliably adds new columns, but it does not rewrite an existing
	 * column's ENUM value list — an install created before `nightly` existed
	 * keeps `ENUM('stable','beta')` and silently coerces any `nightly` insert
	 * to the default. The explicit ALTER below is idempotent and cheap.
	 *
	 * @since 1.0.0
	 * @return void
	 */
	public function create(): void {
		parent::create();
		$this->migrate_channel_enum();
	}

	/**
	 * Adds `nightly` to the `channel` ENUM definition on pre-nightly installations.
	 *
	 * @since 1.0.0
	 * @return void
	 */
	private function migrate_channel_enum(): void {
		global $wpdb;

		$table = $wpdb->prefix . 'purecart_product_versions';

        // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.PreparedSQL.NotPrepared -- Schema migration on a plugin-owned table; the name is built from $wpdb->prefix and a literal, never user input.
		$column = $wpdb->get_row( "SHOW COLUMNS FROM {$table} LIKE 'channel'" );

		if ( ! $column || false !== strpos( (string) $column->Type, 'nightly' ) ) {
			return;
		}

        // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.PreparedSQL.NotPrepared -- As above; fixed DDL, no user input.
		$wpdb->query( "ALTER TABLE {$table} MODIFY COLUMN channel ENUM('stable','beta','nightly') NOT NULL DEFAULT 'stable'" );
	}
}
