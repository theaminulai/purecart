<?php
/**
 * Customer My Account — My Subscriptions Tab Template.
 *
 * Follows WooCommerce My Account table conventions so the output is visually
 * indistinguishable from WooCommerce's own My Orders / My Downloads pages
 * regardless of which WooCommerce-compatible theme is active:
 *  - woocommerce-table shop_table          ← standard WC table classes
 *  - <mark class="order-status status-*">  ← WC status badge markup
 *  - .button                               ← WC button class
 *  - woocommerce-info / woocommerce-notices-wrapper ← WC notice markup
 *
 * Override this template by copying it to:
 *   yourtheme/purecart/myaccount/purecart-subscriptions.php
 *
 * Styles for the custom subscription statuses that WooCommerce themes don't
 * know about are loaded from build/woo-account/subscriptions.css.
 * Runtime JS (action buttons) is loaded from build/woo-account/subscriptions.js
 * with window.purecartMyAccount set by Dashboard::enqueue_assets().
 *
 * @package PureCart\Templates
 * @version 1.0.0
 */

defined( 'ABSPATH' ) || exit;

use PureCart\Subscriptions\Repository\SubscriptionRepository;

$repo          = new SubscriptionRepository();
$user_id       = get_current_user_id();
$subscriptions = $repo->find_by_user( $user_id );

/**
 * Format a billing period for display.
 *
 * @param int    $interval e.g. 1, 3
 * @param string $period   e.g. 'month', 'year', 'week'
 * @return string
 */
$format_period = static function ( int $interval, string $period ): string {
	if ( 1 === $interval ) {
		$map = array(
			'day'   => __( 'Daily', 'purecart' ),
			'week'  => __( 'Weekly', 'purecart' ),
			'month' => __( 'Monthly', 'purecart' ),
			'year'  => __( 'Yearly', 'purecart' ),
		);
		return $map[ $period ] ?? ucfirst( $period );
	}
	/* translators: 1: numeric interval, 2: period (days/weeks/months/years) */
	return sprintf( __( 'Every %1$d %2$ss', 'purecart' ), $interval, $period );
};

/**
 * Format a MySQL datetime using the site's date format, or return em-dash.
 *
 * @param string|null $dt MySQL datetime.
 * @return string
 */
$format_date = static function ( ?string $dt ): string {
	if ( ! $dt ) {
		return '&mdash;';
	}
	return date_i18n( get_option( 'date_format' ), strtotime( $dt ) );
};

/**
 * Map subscription status to the WooCommerce order-status CSS slug and label.
 *
 * WooCommerce themes style `mark.order-status.status-{slug}` — use slugs
 * that map to colors the theme already knows (processing → blue, completed →
 * green, on-hold → orange, cancelled → grey) so we get free theme-consistent
 * colours. For statuses with no WC analogue we use a `purecart-status-*`
 * slug and add a rule in subscriptions.css.
 *
 * @param string $status Raw DB status.
 * @return array{ slug: string, label: string }
 */
$status_info = static function ( string $status ): array {
	$map = array(
		'active'    => array( 'slug' => 'processing',        'label' => __( 'Active', 'purecart' ) ),
		'trialing'  => array( 'slug' => 'purecart-trialing', 'label' => __( 'Trial', 'purecart' ) ),
		'paused'    => array( 'slug' => 'on-hold',           'label' => __( 'Paused', 'purecart' ) ),
		'past_due'  => array( 'slug' => 'failed',            'label' => __( 'Past Due', 'purecart' ) ),
		'suspended' => array( 'slug' => 'purecart-suspended','label' => __( 'Suspended', 'purecart' ) ),
		'cancelled' => array( 'slug' => 'cancelled',         'label' => __( 'Cancelled', 'purecart' ) ),
		'expired'   => array( 'slug' => 'purecart-expired',  'label' => __( 'Expired', 'purecart' ) ),
	);
	return $map[ $status ] ?? array( 'slug' => 'purecart-' . sanitize_key( $status ), 'label' => ucfirst( $status ) );
};

?>
<div class="woocommerce-notices-wrapper"></div>

<?php if ( empty( $subscriptions ) ) : ?>

	<div class="woocommerce-info">
		<?php esc_html_e( 'You have no subscriptions yet.', 'purecart' ); ?>
	</div>

<?php else : ?>

	<table class="woocommerce-table woocommerce-table--my-subscriptions shop_table my_account_subscriptions">
		<thead>
			<tr>
				<th class="subscription-id">
					<span class="nobr"><?php esc_html_e( 'Subscription', 'purecart' ); ?></span>
				</th>
				<th class="subscription-status">
					<span class="nobr"><?php esc_html_e( 'Status', 'purecart' ); ?></span>
				</th>
				<th class="subscription-billing">
					<span class="nobr"><?php esc_html_e( 'Billing', 'purecart' ); ?></span>
				</th>
				<th class="subscription-next-payment">
					<span class="nobr"><?php esc_html_e( 'Next Payment', 'purecart' ); ?></span>
				</th>
				<th class="subscription-actions">
					<span class="nobr"><?php esc_html_e( 'Actions', 'purecart' ); ?></span>
				</th>
			</tr>
		</thead>
		<tbody>
			<?php foreach ( $subscriptions as $sub ) :
				$product      = function_exists( 'wc_get_product' ) ? wc_get_product( (int) $sub->product_id ) : null;
				$product_name = $product ? $product->get_name() : get_the_title( (int) $sub->product_id );
				$si           = $status_info( (string) $sub->status );
				$billing      = $format_period( (int) $sub->billing_interval, (string) $sub->billing_period );
				$amount       = function_exists( 'wc_price' )
					? wc_price( (float) $sub->recurring_amount, array( 'currency' => $sub->currency ) )
					: number_format( (float) $sub->recurring_amount, 2 ) . ' ' . $sub->currency;

				// Next payment: show trial end for trialing, next_payment_at for others.
				$next_date = 'trialing' === $sub->status
					? $format_date( $sub->trial_ends_at )
					: $format_date( $sub->next_payment_at );

				// "Paused until …" overrides the next payment column.
				if ( 'paused' === $sub->status && $sub->pause_end_date ) {
					/* translators: %s: scheduled resume date */
					$next_date = sprintf( __( 'Resumes %s', 'purecart' ), $format_date( $sub->pause_end_date ) );
				}

				if ( in_array( $sub->status, array( 'cancelled', 'expired', 'suspended' ), true ) ) {
					$next_date = '&mdash;';
				}
			?>
			<tr class="woocommerce-table__row purecart-subscription-row"
				data-sub-id="<?php echo esc_attr( (string) $sub->id ); ?>">

				<!-- Subscription ID + product name -->
				<td class="woocommerce-table__cell subscription-id"
					data-title="<?php esc_attr_e( 'Subscription', 'purecart' ); ?>">
					<a href="#">#<?php echo esc_html( (string) $sub->id ); ?></a>
					<span class="subscription-product-name">
						&mdash; <?php echo esc_html( $product_name ); ?>
					</span>
				</td>

				<!-- Status — WooCommerce mark.order-status pattern -->
				<td class="woocommerce-table__cell subscription-status"
					data-title="<?php esc_attr_e( 'Status', 'purecart' ); ?>">
					<mark class="order-status status-<?php echo esc_attr( $si['slug'] ); ?>">
						<span><?php echo esc_html( $si['label'] ); ?></span>
					</mark>
				</td>

				<!-- Billing amount + period -->
				<td class="woocommerce-table__cell subscription-billing"
					data-title="<?php esc_attr_e( 'Billing', 'purecart' ); ?>">
					<?php echo wp_kses_post( $amount ); ?>
					<span class="subscription-billing-period">/ <?php echo esc_html( $billing ); ?></span>
				</td>

				<!-- Next payment / resume date -->
				<td class="woocommerce-table__cell subscription-next-payment"
					data-title="<?php esc_attr_e( 'Next Payment', 'purecart' ); ?>">
					<?php echo wp_kses_post( $next_date ); ?>
				</td>

				<!-- Action buttons -->
				<td class="woocommerce-table__cell subscription-actions"
					data-title="<?php esc_attr_e( 'Actions', 'purecart' ); ?>">

					<div class="woocommerce-MyAccount-subscriptionActions subscription-action-buttons">
						<?php if ( 'active' === $sub->status ) : ?>
							<button type="button"
									class="button purecart-sub-action"
									data-action="skip"
									data-sub-id="<?php echo esc_attr( (string) $sub->id ); ?>"
									title="<?php esc_attr_e( 'Skip the next renewal cycle', 'purecart' ); ?>">
								<?php esc_html_e( 'Skip Next', 'purecart' ); ?>
							</button>
							<button type="button"
									class="button purecart-sub-action"
									data-action="pause"
									data-sub-id="<?php echo esc_attr( (string) $sub->id ); ?>">
								<?php esc_html_e( 'Pause', 'purecart' ); ?>
							</button>
							<button type="button"
									class="button purecart-sub-action"
									data-action="early-renewal"
									data-sub-id="<?php echo esc_attr( (string) $sub->id ); ?>"
									title="<?php esc_attr_e( 'Renew now and extend your billing cycle', 'purecart' ); ?>">
								<?php esc_html_e( 'Renew Early', 'purecart' ); ?>
							</button>
							<button type="button"
									class="button purecart-sub-action purecart-sub-action--cancel"
									data-action="cancel"
									data-sub-id="<?php echo esc_attr( (string) $sub->id ); ?>"
									data-confirm="<?php esc_attr_e( 'Are you sure you want to cancel this subscription?', 'purecart' ); ?>">
								<?php esc_html_e( 'Cancel', 'purecart' ); ?>
							</button>

						<?php elseif ( 'trialing' === $sub->status ) : ?>
							<button type="button"
									class="button purecart-sub-action purecart-sub-action--cancel"
									data-action="cancel"
									data-sub-id="<?php echo esc_attr( (string) $sub->id ); ?>"
									data-confirm="<?php esc_attr_e( 'Are you sure you want to cancel your trial?', 'purecart' ); ?>">
								<?php esc_html_e( 'Cancel Trial', 'purecart' ); ?>
							</button>

						<?php elseif ( 'paused' === $sub->status ) : ?>
							<button type="button"
									class="button purecart-sub-action"
									data-action="resume"
									data-sub-id="<?php echo esc_attr( (string) $sub->id ); ?>">
								<?php esc_html_e( 'Resume', 'purecart' ); ?>
							</button>
							<button type="button"
									class="button purecart-sub-action purecart-sub-action--cancel"
									data-action="cancel"
									data-sub-id="<?php echo esc_attr( (string) $sub->id ); ?>"
									data-confirm="<?php esc_attr_e( 'Are you sure you want to cancel this subscription?', 'purecart' ); ?>">
								<?php esc_html_e( 'Cancel', 'purecart' ); ?>
							</button>

						<?php elseif ( 'past_due' === $sub->status ) : ?>
							<a href="<?php echo esc_url( function_exists( 'wc_get_account_endpoint_url' ) ? wc_get_account_endpoint_url( 'payment-methods' ) : '#' ); ?>"
							   class="button">
								<?php esc_html_e( 'Update Payment', 'purecart' ); ?>
							</a>

						<?php elseif ( 'cancelled' === $sub->status ) : ?>
							<button type="button"
									class="button purecart-sub-action"
									data-action="resubscribe"
									data-sub-id="<?php echo esc_attr( (string) $sub->id ); ?>">
								<?php esc_html_e( 'Resubscribe', 'purecart' ); ?>
							</button>

						<?php endif; ?>
					</div>

					<!-- Per-row inline feedback (hidden until an action fires) -->
					<div class="purecart-sub-feedback" aria-live="polite" hidden></div>

				</td>
			</tr>
			<?php endforeach; ?>
		</tbody>
	</table>

<?php endif; ?>
