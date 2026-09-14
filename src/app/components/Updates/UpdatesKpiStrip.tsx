import React from 'react';
import { Package, CheckCircle2, FileClock, Download } from 'lucide-react';
import { M3 } from '../../utils/static-data';
import type { UpdateStats } from '../../types/updates';

interface UpdatesKpiStripProps {
	stats: UpdateStats;
}

export function UpdatesKpiStrip( { stats }: UpdatesKpiStripProps ) {
	const cards = [
		{
			label: 'Total Packages',
			value: String( stats.totalPackages || 0 ),
			icon: <Package size={ 18 } color={ M3.primary } />,
			color: M3.primary,
		},
		{
			label: 'Active Releases',
			value: String( stats.latestReleases || 0 ),
			icon: <CheckCircle2 size={ 18 } color={ M3.success } />,
			color: M3.success,
		},
		{
			label: 'Pending Drafts',
			value: String( stats.pendingDrafts || 0 ),
			icon: <FileClock size={ 18 } color={ M3.warning } />,
			color: M3.warning,
		},
		{
			label: 'Total Downloads',
			value: Number( stats.totalDownloads || 0 ).toLocaleString(),
			icon: <Download size={ 18 } color={ M3.info } />,
			color: M3.info,
		},
	];

	return (
		<div
			style={ {
				display: 'grid',
				gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
				gap: '16px',
				marginBottom: '20px',
			} }
		>
			{ cards.map( ( c ) => (
				<div
					key={ c.label }
					style={ {
						backgroundColor: M3.surface,
						padding: '16px 20px',
						borderRadius: '12px',
						border: `1px solid ${ M3.outlineVariant }`,
						display: 'flex',
						flexDirection: 'column',
						gap: '8px',
						boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
					} }
				>
					<div style={ { display: 'flex', alignItems: 'center', justifyContent: 'space-between' } }>
						<span style={ { fontSize: '13px', color: M3.onSurfaceVariant, fontWeight: 500 } }>
							{ c.label }
						</span>
						{ c.icon }
					</div>
					<div style={ { fontSize: '24px', fontWeight: 700, color: M3.onSurface } }>
						{ c.value }
					</div>
				</div>
			) ) }
		</div>
	);
}
