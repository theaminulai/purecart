<?php
/**
 * Customer My Account — My Licenses Tab Template.
 *
 * Follows WooCommerce My Account table conventions so the output is visually
 * consistent with WooCommerce's own My Orders / My Downloads pages regardless
 * of which WooCommerce-compatible theme is active.
 *
 * Override this template by copying it to:
 *   yourtheme/purecart/myaccount/purecart-licenses.php
 *
 * @package PureCart\Templates
 * @version 1.0.0
 */

defined( 'ABSPATH' ) || exit;

use PureCart\Licensing\LicenseGenerator;

$user_id  = get_current_user_id();
$licenses = ( new LicenseGenerator() )->get_by_user( $user_id );

if ( empty( $licenses ) ) {
	echo '<p>' . esc_html__( 'You have no licenses yet.', 'purecart' ) . '</p>';
	return;
}

?>
<table class="woocommerce-table shop_table purecart-licenses-table">
	<thead>
		<tr>
			<th><?php esc_html_e( 'Product', 'purecart' ); ?></th>
			<th><?php esc_html_e( 'License Key', 'purecart' ); ?></th>
			<th><?php esc_html_e( 'Status', 'purecart' ); ?></th>
			<th><?php esc_html_e( 'Sites Used', 'purecart' ); ?></th>
			<th><?php esc_html_e( 'Expires', 'purecart' ); ?></th>
			<th><?php esc_html_e( 'Activate on Domain', 'purecart' ); ?></th>
		</tr>
	</thead>
	<tbody>
		<?php foreach ( $licenses as $license ) : ?>
			<?php
			// Build expiry label — escaped at the point of output below.
			$expires_label = $license->expires_at
				? date_i18n( get_option( 'date_format' ), strtotime( $license->expires_at ) )
				: __( 'Lifetime', 'purecart' );
			?>
			<tr>
				<td><?php echo esc_html( $license->product_name ?? '' ); ?></td>

				<td>
					<?php
					// Blurred by default — click "Reveal" to show, then "Copy" to
					// copy. Prevents shoulder-surfing the raw key on page load.
					printf(
						'<code class="purecart-license-key purecart-license-key--hidden" data-key="%1$s">••••-••••-••••-••••</code> '
							. '<button type="button" class="purecart-reveal-key button-link">%2$s</button>'
							. '<button type="button" class="purecart-copy-key button-link" style="display:none">%3$s</button>',
						esc_attr( $license->license_key ),
						esc_html__( 'Reveal', 'purecart' ),
						esc_html__( 'Copy', 'purecart' )
					);
					?>
				</td>

				<td>
					<span class="purecart-status purecart-status--<?php echo esc_attr( $license->status ); ?>">
						<?php echo esc_html( ucfirst( $license->status ) ); ?>
					</span>
				</td>

				<td>
					<?php
					echo esc_html( (string) $license->activated_count )
						. ' / '
						. ( 'unlimited' === $license->plan_type
							? esc_html__( '∞', 'purecart' )
							: esc_html( (string) $license->activation_limit ) );
					?>
				</td>

				<td><?php echo esc_html( $expires_label ); ?></td>

				<td>
					<?php if ( 'active' === $license->status ) : ?>
						<form class="purecart-activate-license" data-license-key="<?php echo esc_attr( $license->license_key ); ?>">
							<input type="text" name="domain" placeholder="<?php esc_attr_e( 'example.com', 'purecart' ); ?>" required>
							<button type="submit" class="button"><?php esc_html_e( 'Activate', 'purecart' ); ?></button>
							<span class="purecart-activate-result"></span>
						</form>
					<?php else : ?>
						&mdash;
					<?php endif; ?>
				</td>
			</tr>
		<?php endforeach; ?>
	</tbody>
</table>
