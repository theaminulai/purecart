import { Users } from 'lucide-react';
import { __ } from '@wordpress/i18n';
import { ComingSoon } from '@/shared/ui/ComingSoon';

/** @since 1.0.0 */
export function AffiliatesPage() {
	return (
		<ComingSoon
			icon={ <Users size={ 32 } /> }
			title={ __( 'Affiliates', 'purecart' ) }
			description={ __(
				'Referral tracking, commission management, payout history, and affiliate performance dashboards — coming in a future release.',
				'purecart'
			) }
		/>
	);
}
