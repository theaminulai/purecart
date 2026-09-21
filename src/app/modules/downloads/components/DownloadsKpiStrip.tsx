/**
 * DownloadsKpiStrip component.
 *
 * Renders the 4-card KPI strip at the top of the Downloads log page — see
 * docs/RND-frontend-secure-downloads.md Screen 1. Values come from the
 * server's stats bundle (API\Downloads::list_logs()), not the current
 * page's rows, so they don't change when the table below is filtered.
 *
 * @file
 * @since 1.0.0
 */
import { Download, FileBox, AlertTriangle, Clock } from 'lucide-react';
import { __ } from '@wordpress/i18n';
import { KpiCard } from '@/shared/ui/KpiCard';
import type { DownloadStats } from '../types';

/**
 * Renders 4 stat cards summarizing the full download log data set.
 *
 * @since 1.0.0
 */
export function DownloadsKpiStrip( { stats }: { stats: DownloadStats } ) {
	return (
		<div className="grid grid-cols-4 gap-4">
			<KpiCard
				label={ __( 'Total Downloads', 'purecart' ) }
				value={ String( stats.totalDownloads ) }
				trend={ __( 'All time', 'purecart' ) }
				trendUp
				icon={ Download }
			/>
			<KpiCard
				label={ __( 'Unique Files', 'purecart' ) }
				value={ String( stats.uniqueFiles ) }
				trend={ __( 'Across all orders', 'purecart' ) }
				trendUp
				icon={ FileBox }
			/>
			<KpiCard
				label={ __( 'Failed Attempts', 'purecart' ) }
				value={ String( stats.failedAttempts ) }
				trend={ stats.failedAttempts > 0 ? __( 'Needs attention', 'purecart' ) : __( 'All clear', 'purecart' ) }
				trendUp={ stats.failedAttempts === 0 }
				icon={ AlertTriangle }
			/>
			<KpiCard
				label={ __( 'Tokens Expiring', 'purecart' ) }
				value={ String( stats.tokensExpiringIn24h ) }
				trend={ __( 'In next 24h', 'purecart' ) }
				trendUp={ false }
				icon={ Clock }
			/>
		</div>
	);
}
