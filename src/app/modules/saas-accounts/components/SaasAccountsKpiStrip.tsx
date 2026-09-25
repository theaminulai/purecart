/**
 * SaasAccountsKpiStrip component.
 *
 * The 4-card KPI strip above the SaaS Accounts table. Values come from
 * GET /saas-accounts/stats (AccountProvisioner::stats()), which counts
 * every account — so the numbers stay put when the table below is
 * filtered, same as the Downloads strip.
 *
 * @file
 * @since 1.0.0
 */
import { Cloud, CheckCircle, PauseCircle, Sparkles } from 'lucide-react';
import { __ } from '@wordpress/i18n';
import { KpiCard } from '@/shared/ui/KpiCard';
import { saasPlanLabel } from '../constants';
import type { SaasStats } from '../types';

/**
 * Renders 4 stat cards summarizing every provisioned SaaS account.
 *
 * @since 1.0.0
 *
 * @param {Object}    props       Component props.
 * @param {SaasStats} props.stats Server-side counters for the whole data set.
 * @return {JSX.Element} The KPI strip.
 */
export function SaasAccountsKpiStrip( { stats }: { stats: SaasStats } ) {
	const topPlan = stats.topPlans[ 0 ];

	return (
		<div className="grid grid-cols-4 gap-4">
			<KpiCard
				label={ __( 'Total Accounts', 'purecart' ) }
				value={ String( stats.total ) }
				// The busiest plan is more useful here than a literal
				// "all time", and stats.topPlans is already sorted by count.
				trend={ topPlan ? saasPlanLabel( topPlan.plan ) : __( 'All time', 'purecart' ) }
				trendUp
				icon={ Cloud }
			/>
			<KpiCard
				label={ __( 'Active', 'purecart' ) }
				value={ String( stats.active ) }
				trend={ __( 'Serving traffic', 'purecart' ) }
				trendUp
				icon={ CheckCircle }
			/>
			<KpiCard
				label={ __( 'Suspended', 'purecart' ) }
				value={ String( stats.suspended ) }
				trend={
					stats.suspended > 0
						? __( 'Access revoked', 'purecart' )
						: __( 'None suspended', 'purecart' )
				}
				trendUp={ 0 === stats.suspended }
				icon={ PauseCircle }
			/>
			<KpiCard
				label={ __( 'Provisioned Today', 'purecart' ) }
				value={ String( stats.provisionedToday ) }
				trend={ __( 'Since midnight', 'purecart' ) }
				trendUp={ stats.provisionedToday > 0 }
				icon={ Sparkles }
			/>
		</div>
	);
}
