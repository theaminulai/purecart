import { Key } from 'lucide-react';
import { __ } from '@wordpress/i18n';
import { ComingSoon } from '@/shared/ui/ComingSoon';

/**
 * Licenses module page (stub).
 *
 * Full spec: docs/RND-frontend-license-manager.md
 *
 * @since 1.0.0
 */
export function LicensesPage() {
	return (
		<ComingSoon
			icon={ <Key size={ 32 } /> }
			title={ __( 'License Manager', 'purecart' ) }
			description={ __(
				'Generate, activate, revoke, and track license keys across all your products. JWT token management and per-domain activation controls coming soon.',
				'purecart'
			) }
		/>
	);
}
