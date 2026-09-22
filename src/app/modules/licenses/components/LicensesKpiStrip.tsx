/**
 * LicensesKpiStrip component.
 *
 * Renders the 4-card KPI strip at the top of the Licenses list page — see
 * docs/RND-frontend-license-manager.md Screen 1. Values come from the
 * server's stats bundle (API\Licenses::list_licenses()), not the current
 * page's rows, so they don't change when the table below is filtered.
 *
 * @file
 * @since 1.0.0
 */
import { Key, CheckCircle, Calendar, XCircle } from 'lucide-react';
import { __, sprintf } from '@wordpress/i18n';
import { KpiCard } from '@/shared/ui/KpiCard';
import type { LicenseStats } from '../types';

/**
 * Renders 4 stat cards summarizing the full license data set.
 *
 * @since 1.0.0
 */
export function LicensesKpiStrip( { stats }: { stats: LicenseStats } ) {
	const activePct = stats.total > 0 ? Math.round( ( stats.active / stats.total ) * 100 ) : 0;

	return (
		<div className="grid grid-cols-4 gap-4">
			<KpiCard label={ __( 'Total Licenses', 'purecart' ) } value={ String( stats.total ) } trend={ __( 'All time', 'purecart' ) } trendUp icon={ Key } />
			<KpiCard
				label={ __( 'Active', 'purecart' ) }
				value={ String( stats.active ) }
				/* translators: %d: percentage of licenses that are active */
				trend={ sprintf( __( '%d%% of total', 'purecart' ), activePct ) }
				trendUp
				icon={ CheckCircle }
			/>
			<KpiCard
				label={ __( 'Expiring (30d)', 'purecart' ) }
				value={ String( stats.expiring_30d ) }
				trend={ stats.expiring_30d > 0 ? __( 'Needs attention', 'purecart' ) : __( 'All clear', 'purecart' ) }
				trendUp={ stats.expiring_30d === 0 }
				icon={ Calendar }
			/>
			<KpiCard label={ __( 'Revoked', 'purecart' ) } value={ String( stats.revoked ) } trend={ __( 'All time', 'purecart' ) } trendUp={ false } icon={ XCircle } />
		</div>
	);
}
