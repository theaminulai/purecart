<?php
/**
 * Customer My Account - Software Updates Tab Template.
 *
 * Override this template by copying it to yourtheme/purecart/myaccount/purecart-updates.php
 *
 * @package PureCart\Templates
 * @version 1.0.0
 */

defined( 'ABSPATH' ) || exit;

use PureCart\Updates\PackageRepository;
use PureCart\Updates\UpdateDelivery;

$packages_repo = new PackageRepository();
$delivery      = new UpdateDelivery();
$user_id       = get_current_user_id();

// Query customer licensed products
$products = array();
if ( function_exists( 'wc_get_orders' ) ) {
	$orders = wc_get_orders( array(
		'customer' => $user_id,
		'status'   => array( 'wc-completed', 'wc-processing' ),
		'limit'    => -1,
	) );

	foreach ( $orders as $order ) {
		foreach ( $order->get_items() as $item ) {
			$product_id = $item->get_product_id();
			if ( $product_id && ! isset( $products[ $product_id ] ) ) {
				$product = wc_get_product( $product_id );
				if ( $product ) {
					$latest = $packages_repo->get_latest( $product_id, 'stable' );
					if ( $latest ) {
						$history = $packages_repo->find_by_product( $product_id, true );
						$products[ $product_id ] = array(
							'product' => $product,
							'latest'  => $latest,
							'history' => $history,
						);
					}
				}
			}
		}
	}
}

// If admin and no personal orders placed yet, display all store releases for preview
if ( empty( $products ) && current_user_can( 'manage_woocommerce' ) ) {
	global $wpdb;
	$table = $wpdb->prefix . 'purecart_product_versions';
	// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
	$distinct_ids = $wpdb->get_col( "SELECT DISTINCT product_id FROM {$table} WHERE is_active = 1" );

	if ( ! empty( $distinct_ids ) ) {
		foreach ( $distinct_ids as $pid ) {
			$product_id = (int) $pid;
			$product    = function_exists( 'wc_get_product' ) ? wc_get_product( $product_id ) : null;
			$latest     = $packages_repo->get_latest( $product_id, 'stable' );
			if ( $latest ) {
				$history = $packages_repo->find_by_product( $product_id, true );
				$products[ $product_id ] = array(
					'product' => $product,
					'latest'  => $latest,
					'history' => $history,
				);
			}
		}
	}
}

?>

<div class="purecart-updates-container">
	<h2 class="purecart-updates-title"><?php esc_html_e( 'Software Updates & Downloads', 'purecart' ); ?></h2>
	<p class="purecart-updates-desc">
		<?php esc_html_e( 'Access the latest releases, download packages, and read version changelogs for your licensed products.', 'purecart' ); ?>
	</p>

	<?php if ( empty( $products ) ) : ?>
		<div class="purecart-notice purecart-notice--info">
			<p><?php esc_html_e( 'You do not have any update-enabled software products associated with your account yet.', 'purecart' ); ?></p>
		</div>
	<?php else : ?>
		<div class="purecart-product-cards-list">
			<?php foreach ( $products as $product_id => $data ) :
				$product = $data['product'];
				$latest  = $data['latest'];
				$history = $data['history'];
				$download_url = $delivery->download_url( (int) $latest->id );
			?>
				<div class="purecart-product-update-card">
					<div class="purecart-product-update-card__header">
						<div class="purecart-product-update-card__info">
							<h3 class="purecart-product-update-card__name"><?php echo esc_html( $product->get_name() ); ?></h3>
							<div class="purecart-product-update-card__meta">
								<span><strong><?php esc_html_e( 'Latest Version:', 'purecart' ); ?></strong> <code class="purecart-version-code">v<?php echo esc_html( $latest->version ); ?></code></span>
								<span class="purecart-badge purecart-badge--<?php echo esc_attr( $latest->channel ); ?>">
									<?php echo esc_html( ucfirst( $latest->channel ) ); ?>
								</span>
								<span><strong><?php esc_html_e( 'Released:', 'purecart' ); ?></strong> <?php echo esc_html( gmdate( 'M j, Y', strtotime( (string) $latest->released_at ) ) ); ?></span>
							</div>
						</div>
						<div class="purecart-product-update-card__actions">
							<a href="<?php echo esc_url( $download_url ); ?>" class="button purecart-btn purecart-btn--primary">
								<?php esc_html_e( 'Download Package', 'purecart' ); ?> (v<?php echo esc_html( $latest->version ); ?>)
							</a>
						</div>
					</div>

					<?php if ( ! empty( $latest->changelog ) ) : ?>
						<details class="purecart-changelog-details">
							<summary class="purecart-changelog-summary"><?php esc_html_e( 'View What\'s New in this Release', 'purecart' ); ?></summary>
							<div class="purecart-changelog-content">
								<?php echo wp_kses_post( nl2br( esc_html( $latest->changelog ) ) ); ?>
							</div>
						</details>
					<?php endif; ?>

					<?php if ( count( $history ) > 1 ) : ?>
						<details class="purecart-update-history">
							<summary class="purecart-history-summary"><?php esc_html_e( 'Previous Versions History', 'purecart' ); ?></summary>
							<ul class="purecart-update-history__list">
								<?php foreach ( $history as $row ) :
									$prev_url = $delivery->download_url( (int) $row->id );
								?>
									<li class="purecart-update-history__item">
										<code class="purecart-version-code">v<?php echo esc_html( $row->version ); ?></code>
										<span class="purecart-history-date"><?php echo esc_html( gmdate( 'M j, Y', strtotime( (string) $row->released_at ) ) ); ?></span>
										<span class="purecart-history-platform"><?php echo esc_html( $row->platform ); ?></span>
										<a href="<?php echo esc_url( $prev_url ); ?>" class="purecart-history-download">
											<?php esc_html_e( 'Download', 'purecart' ); ?>
										</a>
									</li>
								<?php endforeach; ?>
							</ul>
						</details>
					<?php endif; ?>
				</div>
			<?php endforeach; ?>
		</div>
	<?php endif; ?>
</div>
