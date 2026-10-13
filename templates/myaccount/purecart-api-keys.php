<?php
/**
 * Customer My Account — API Keys Tab Template.
 *
 * Follows WooCommerce My Account table conventions so the output is visually
 * consistent with WooCommerce's own My Orders / My Downloads pages regardless
 * of which WooCommerce-compatible theme is active.
 *
 * Override this template by copying it to:
 *   yourtheme/purecart/myaccount/purecart-api-keys.php
 *
 * @package PureCart\Templates
 * @version 1.0.0
 */

defined( 'ABSPATH' ) || exit;

use PureCart\SaaS\AccountProvisioner;

$user_id  = get_current_user_id();
$accounts = ( new AccountProvisioner() )->get_by_user( $user_id );

if ( empty( $accounts ) ) {
	echo '<p>' . esc_html__( 'No API keys found.', 'purecart' ) . '</p>';
	return;
}

?>
<table class="woocommerce-table shop_table purecart-api-keys-table">
	<thead>
		<tr>
			<th><?php esc_html_e( 'Product', 'purecart' ); ?></th>
			<th><?php esc_html_e( 'Plan', 'purecart' ); ?></th>
			<th><?php esc_html_e( 'API Key', 'purecart' ); ?></th>
			<th><?php esc_html_e( 'Status', 'purecart' ); ?></th>
		</tr>
	</thead>
	<tbody>
		<?php foreach ( $accounts as $account ) : ?>
			<tr>
				<td data-label="<?php esc_attr_e( 'Product', 'purecart' ); ?>"><?php echo esc_html( $account->product_name ?? '' ); ?></td>
				<td data-label="<?php esc_attr_e( 'Plan', 'purecart' ); ?>"><?php echo esc_html( ucfirst( $account->plan ) ); ?></td>
				<td data-label="<?php esc_attr_e( 'API Key', 'purecart' ); ?>"><code class="purecart-api-key" title="<?php echo esc_attr( $account->api_key ); ?>"><?php echo esc_html( $account->api_key ); ?></code></td>
				<td data-label="<?php esc_attr_e( 'Status', 'purecart' ); ?>">
					<span class="purecart-status purecart-status--<?php echo esc_attr( $account->status ); ?>">
						<?php echo esc_html( ucfirst( $account->status ) ); ?>
					</span>
				</td>
			</tr>
		<?php endforeach; ?>
	</tbody>
</table>
