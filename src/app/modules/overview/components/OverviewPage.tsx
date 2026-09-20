import { LayoutDashboard } from 'lucide-react';
import { __ } from '@wordpress/i18n';
import { ComingSoon } from '@/shared/ui';

/**
 * Main dashboard overview page.
 *
 * Displays KPI summary cards and quick-links to each PureCart module.
 * Data is static for now — will be replaced with REST API calls when the
 * Overview REST endpoint is implemented.
 *
 * @since 1.0.0
 */
export function OverviewPage() {
	return (
		<ComingSoon
			icon={ <LayoutDashboard size={ 32 } /> }
			title={ __( 'Overview', 'purecart' ) }
			description={ __(
				'A store-wide summary — revenue, licenses, subscriptions, and downloads at a glance, with quick links into every module. Coming soon.',
				'purecart'
			) }
		/>
	);
}
