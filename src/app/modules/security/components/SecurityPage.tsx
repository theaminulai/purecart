import { Shield } from 'lucide-react';
import { __ } from '@wordpress/i18n';
import { ComingSoon } from '@/shared/ui/ComingSoon';

/** @since 1.0.0 */
export function SecurityPage() {
	return (
		<ComingSoon
			icon={ <Shield size={ 32 } /> }
			title={ __( 'Security', 'purecart' ) }
			description={ __(
				'Download abuse detection, IP-based rate limiting, license fraud alerts, and audit logs for all sensitive admin actions — coming in a future release.',
				'purecart'
			) }
		/>
	);
}
