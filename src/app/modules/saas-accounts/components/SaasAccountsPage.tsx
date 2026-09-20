import { Cloud } from 'lucide-react';
import { __ } from '@wordpress/i18n';
import { ComingSoon } from '@/shared/ui/ComingSoon';

/** @since 1.0.0 */
export function SaasAccountsPage() {
	return (
		<ComingSoon
			icon={ <Cloud size={ 32 } /> }
			title={ __( 'SaaS Accounts', 'purecart' ) }
			description={ __(
				'Provision SaaS tenants on purchase, manage plan tiers, send webhook events to your SaaS backend, and track account status in one place.',
				'purecart'
			) }
		/>
	);
}
