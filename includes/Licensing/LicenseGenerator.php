<?php
declare( strict_types=1 );
/**
 * Generates and stores license keys.
 *
 * @package PureCart\Licensing
 * @since   1.0.0
 */

namespace PureCart\Licensing;

defined( 'ABSPATH' ) || exit;

/**
 * Creates and manages license key records in the `purecart_licenses` table.
 *
 * Handles key generation, status transitions (active, expired, revoked,
 * suspended), expiry extension for subscription renewals, and admin
 * dashboard queries.
 *
 * @since 1.0.0
 */
class LicenseGenerator {

	/**
	 * Generates and stores a new license key for a completed order line item.
	 *
	 * Reads license settings from the product meta (plan type, activation limit,
	 * duration), inserts a record into `purecart_licenses`, and fires the
	 * `purecart_license_created` action.
	 *
	 * @since  1.0.0
	 * @param  int $order_id   WooCommerce order ID.
	 * @param  int $user_id    WordPress user ID of the customer.
	 * @param  int $product_id WooCommerce product ID.
	 * @return object|null             The inserted license row, or null on failure.
	 */
	public function create( int $order_id, int $user_id, int $product_id ): ?object {
		global $wpdb;

		$product = wc_get_product( $product_id );
		if ( ! $product ) {
			return null;
		}

		$plan_type     = $product->get_meta( '_purecart_license_type' ) ?: 'single';
		$act_limit     = (int) ( $product->get_meta( '_purecart_activation_limit' ) ?: 1 );
		$duration_days = (int) ( $product->get_meta( '_purecart_license_duration_days' ) ?: 365 );
		$expires_at    = 'lifetime' === $plan_type
			? null
			: gmdate( 'Y-m-d H:i:s', strtotime( "+{$duration_days} days" ) );

		$license_key = $this->generate_key();

        // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery -- Custom table INSERT; no WP API available.
		$inserted = $wpdb->insert(
			$wpdb->prefix . 'purecart_licenses',
			array(
				'order_id'         => $order_id,
				'user_id'          => $user_id,
				'product_id'       => $product_id,
				'license_key'      => $license_key,
				'plan_type'        => $plan_type,
				'status'           => 'active',
				'activation_limit' => $act_limit,
				'activated_count'  => 0,
				'expires_at'       => $expires_at,
				'created_at'       => current_time( 'mysql' ),
				'updated_at'       => current_time( 'mysql' ),
			),
			array( '%d', '%d', '%d', '%s', '%s', '%s', '%d', '%d', '%s', '%s', '%s' )
		);

		if ( ! $inserted ) {
			return null;
		}

        // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching -- Fetching the row just inserted; no stale cache risk.
		$license = $wpdb->get_row(
			$wpdb->prepare(
				"SELECT * FROM {$wpdb->prefix}purecart_licenses WHERE id = %d",
				$wpdb->insert_id
			)
		);

		/**
		 * Fires after a new license record has been created.
		 *
		 * @since 1.0.0
		 * @param object $license The newly inserted license row.
		 */
		do_action( 'purecart_license_created', $license );

		return $license;
	}

	/**
	 * Looks up a license by its key string.
	 *
	 * @since  1.0.0
	 * @param  string $license_key The license key to look up.
	 * @return object|null              The license row, or null if not found.
	 */
	public function get_by_key( string $license_key ): ?object {
		global $wpdb;

        // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching -- License validation is security-critical; cached results could allow revoked/expired licenses through.
		return $wpdb->get_row(
			$wpdb->prepare(
				"SELECT * FROM {$wpdb->prefix}purecart_licenses WHERE license_key = %s LIMIT 1",
				$license_key
			)
		) ?: null;
	}

	/**
	 * Retrieves all licenses for a given user, ordered newest first.
	 *
	 * @since  1.0.0
	 * @param  int $user_id WordPress user ID.
	 * @return array<int, object>
	 */
	public function get_by_user( int $user_id ): array {
		global $wpdb;

        // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching -- User license list changes on every order/activation; caching would show stale data in the customer dashboard.
		return $wpdb->get_results(
			$wpdb->prepare(
				"SELECT l.*, p.post_title AS product_name
                   FROM {$wpdb->prefix}purecart_licenses l
                   LEFT JOIN {$wpdb->posts} p ON p.ID = l.product_id
                  WHERE l.user_id = %d
                  ORDER BY l.created_at DESC",
				$user_id
			)
		) ?: array();
	}

	/**
	 * Looks up a license by its primary key.
	 *
	 * @since  1.0.0
	 * @param  int $license_id License row ID.
	 * @return object|null
	 */
	public function get_by_id( int $license_id ): ?object {
		global $wpdb;

        // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching -- License state is security-critical; a cached row could show a revoked license as active.
		return $wpdb->get_row(
			$wpdb->prepare(
				"SELECT * FROM {$wpdb->prefix}purecart_licenses WHERE id = %d",
				$license_id
			)
		) ?: null;
	}

	/*
	 * Lifecycle mutation methods (extend_expiry, set_status, etc.) are
	 * intentionally kept here — in the class that owns the `purecart_licenses`
	 * table — rather than in the Subscriptions module. This prevents cross-module
	 * direct table writes and keeps the license record lifecycle in one place.
	 */

	/**
	 * Valid values for the `status` ENUM column in `purecart_licenses`.
	 *
	 * Matches the ENUM definition in Activator::create_tables().
	 *
	 * @since 1.0.0
	 * @var string[]
	 */
	private const STATUSES = array( 'active', 'expired', 'revoked', 'suspended' );

	/**
	 * Push a license's expiry date forward by one billing period.
	 *
	 * Anchors on the license's existing `expires_at` rather than "now", so a
	 * renewal processed a few days late doesn't quietly shorten the customer's
	 * total paid-for time — the same anchoring rule RenewalEngine applies to
	 * `next_payment_at`. Falls back to now only when the license has already
	 * lapsed (or never had an expiry to begin with).
	 *
	 * Lifetime licenses (`expires_at IS NULL` with plan_type `lifetime`) are
	 * left alone — there is no date to extend.
	 *
	 * @since  1.0.0
	 * @param  int    $license_id License row ID.
	 * @param  int    $count      Number of periods to add.
	 * @param  string $period     One of 'day', 'week', 'month', 'year'.
	 * @return bool
	 */
	public function extend_expiry( int $license_id, int $count, string $period ): bool {
		global $wpdb;

		$license = $this->get_by_id( $license_id );
		if ( ! $license ) {
			return false;
		}

		if ( 'lifetime' === $license->plan_type || null === $license->expires_at ) {
			return false;
		}

		$now        = current_time( 'mysql' );
		$anchor     = strtotime( (string) $license->expires_at ) > strtotime( $now ) ? (string) $license->expires_at : $now;
		$new_expiry = \PureCart\Subscriptions\Billing\BillingClock::add_interval( $anchor, max( 1, $count ), $period );

        // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery -- Custom table UPDATE; no WP API available.
		$updated = $wpdb->update(
			$wpdb->prefix . 'purecart_licenses',
			array(
				'expires_at' => $new_expiry,
				// A renewal on a lapsed license brings it back to life.
				'status'     => 'expired' === $license->status ? 'active' : $license->status,
				'updated_at' => $now,
			),
			array( 'id' => $license_id ),
			array( '%s', '%s', '%s' ),
			array( '%d' )
		);

		if ( false !== $updated ) {
			/**
			 * Fires after a license's expiry date has been extended.
			 *
			 * @since 1.0.0
			 * @param int    $license_id License row ID.
			 * @param string $new_expiry New expiry date in MySQL datetime format.
			 */
			do_action( 'purecart_license_expiry_extended', $license_id, $new_expiry );
		}

		return false !== $updated;
	}

	/**
	 * Set a license's status, validated against the column's ENUM.
	 *
	 * @since  1.0.0
	 * @param  int    $license_id License row ID.
	 * @param  string $status     One of active/expired/revoked/suspended.
	 * @return bool
	 */
	public function set_status( int $license_id, string $status ): bool {
		global $wpdb;

		if ( ! in_array( $status, self::STATUSES, true ) ) {
			return false;
		}

        // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery -- Custom table UPDATE; no WP API available.
		$updated = $wpdb->update(
			$wpdb->prefix . 'purecart_licenses',
			array(
				'status'     => $status,
				'updated_at' => current_time( 'mysql' ),
			),
			array( 'id' => $license_id ),
			array( '%s', '%s' ),
			array( '%d' )
		);

		if ( false !== $updated ) {
			/**
			 * Fires after a license's status has been changed.
			 *
			 * @since 1.0.0
			 * @param int    $license_id License row ID.
			 * @param string $status     The new status value.
			 */
			do_action( 'purecart_license_status_changed', $license_id, $status );
		}

		return false !== $updated;
	}

	/**
	 * Retrieves all license records with joined product and customer details,
	 * ordered newest first.
	 *
	 * @since 1.0.0
	 * @return array<int, object>
	 */
	public function find_all(): array {
		global $wpdb;

        // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching -- Admin listing; must reflect a just-issued/just-revoked license.
		return $wpdb->get_results(
			"SELECT l.*, p.post_title AS product_name, u.display_name AS customer_name, u.user_email AS customer_email
               FROM {$wpdb->prefix}purecart_licenses l
               LEFT JOIN {$wpdb->posts} p ON p.ID = l.product_id
               LEFT JOIN {$wpdb->users} u ON u.ID = l.user_id
           ORDER BY l.created_at DESC"
		) ?: array();
	}

	/**
	 * Returns counts for the admin Licenses list KPI strip.
	 *
	 * @since 1.0.0
	 * @return array{total: int, active: int, expiring_30d: int, revoked: int}
	 */
	public function stats(): array {
		global $wpdb;

		$table = $wpdb->prefix . 'purecart_licenses';

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- Admin KPI strip, must reflect the current table state; {$table} is not user input.
		$total = (int) $wpdb->get_var( "SELECT COUNT(*) FROM {$table}" );
		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- As above; status is bound below.
		$active = (int) $wpdb->get_var( $wpdb->prepare( "SELECT COUNT(*) FROM {$table} WHERE status = %s", 'active' ) );
		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- As above; status is bound below.
		$revoked = (int) $wpdb->get_var( $wpdb->prepare( "SELECT COUNT(*) FROM {$table} WHERE status = %s", 'revoked' ) );
		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- As above; all values are bound below.
		$expiring_30d = (int) $wpdb->get_var(
			$wpdb->prepare(
				"SELECT COUNT(*) FROM {$table} WHERE status = %s AND expires_at IS NOT NULL AND expires_at BETWEEN %s AND %s",
				'active',
				current_time( 'mysql' ),
				gmdate( 'Y-m-d H:i:s', strtotime( '+30 days' ) )
			)
		);

		return array(
			'total'        => $total,
			'active'       => $active,
			'expiring_30d' => $expiring_30d,
			'revoked'      => $revoked,
		);
	}

	/**
	 * Retrieves a single license record with joined product and customer details.
	 *
	 * @since 1.0.0
	 * @param int $license_id License row ID.
	 * @return object|null
	 */
	public function get_by_id_with_details( int $license_id ): ?object {
		global $wpdb;

        // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching -- License detail view; must reflect current status.
		return $wpdb->get_row(
			$wpdb->prepare(
				"SELECT l.*, p.post_title AS product_name, u.display_name AS customer_name, u.user_email AS customer_email
                   FROM {$wpdb->prefix}purecart_licenses l
                   LEFT JOIN {$wpdb->posts} p ON p.ID = l.product_id
                   LEFT JOIN {$wpdb->users} u ON u.ID = l.user_id
                  WHERE l.id = %d",
				$license_id
			)
		) ?: null;
	}

	/**
	 * Issues a fresh license for the same order/user/product as an existing record.
	 *
	 * Used by the admin "Duplicate License" row action.
	 *
	 * @since 1.0.0
	 * @param int $license_id License row ID to copy.
	 * @return object|null The new license row, or null if the source doesn't exist.
	 */
	public function duplicate( int $license_id ): ?object {
		$source = $this->get_by_id( $license_id );
		if ( ! $source ) {
			return null;
		}

		return $this->create( (int) $source->order_id, (int) $source->user_id, (int) $source->product_id );
	}

	/**
	 * Generates a random, formatted license key.
	 *
	 * Produces a four-segment uppercase hexadecimal string in the format
	 * `XXXXXX-XXXXXX-XXXXXX-XXXXXX`, using cryptographically secure random
	 * bytes via `random_bytes()`.
	 *
	 * @since 1.0.0
	 * @return string The generated license key.
	 */
	private function generate_key(): string {
		$segments = array();
		for ( $i = 0; $i < 4; $i++ ) {
			$segments[] = strtoupper( bin2hex( random_bytes( 3 ) ) );
		}
		return implode( '-', $segments );
	}
}
