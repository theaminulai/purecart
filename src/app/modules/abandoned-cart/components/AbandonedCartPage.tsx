import { ShoppingCart } from 'lucide-react';
import { __ } from '@wordpress/i18n';
import { ComingSoon } from '@/shared/ui/ComingSoon';

/** @since 1.0.0 */
export function AbandonedCartPage() {
	return (
		<ComingSoon
			icon={ <ShoppingCart size={ 32 } /> }
			title={ __( 'Abandoned Cart', 'purecart' ) }
			description={ __(
				'Recover lost revenue with automated follow-up emails, cart recovery links, and conversion funnel analytics — coming in a future release.',
				'purecart'
			) }
		/>
	);
}
