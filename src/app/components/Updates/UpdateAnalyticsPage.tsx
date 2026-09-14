import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, TrendingUp, Users, RotateCcw, AlertTriangle } from 'lucide-react';
import { fetchUpdateAnalytics } from '../../api/modules/updates.api';
import { M3 } from '../../utils/static-data';
import type { UpdateAnalyticsData } from '../../types/updates';

export function UpdateAnalyticsPage() {
	const navigate = useNavigate();
	const [ data, setData ] = useState<UpdateAnalyticsData | null>( null );
	const [ loading, setLoading ] = useState( true );
	const [ error, setError ] = useState<string | null>( null );

	useEffect( () => {
		async function load() {
			try {
				setLoading( true );
				const res = await fetchUpdateAnalytics();
				setData( res );
			} catch ( err ) {
				setError( err instanceof Error ? err.message : 'Failed to load analytics' );
			} finally {
				setLoading( false );
			}
		}
		load();
	}, [] );

	if ( loading ) {
		return (
			<div style={ { padding: '48px', textAlign: 'center', color: M3.onSurfaceVariant } }>
				Loading update analytics and adoption metrics...
			</div>
		);
	}

	if ( error || ! data ) {
		return (
			<div style={ { padding: '24px', maxWidth: '1200px', margin: '0 auto' } }>
				<button
					onClick={ () => navigate( '/updates' ) }
					style={ {
						display: 'inline-flex',
						alignItems: 'center',
						gap: '6px',
						background: 'none',
						border: 'none',
						color: M3.primary,
						cursor: 'pointer',
						marginBottom: '16px',
						fontWeight: 600,
					} }
				>
					<ArrowLeft size={ 16 } />
					<span>Back to Updates</span>
				</button>
				<div style={ { padding: '20px', backgroundColor: M3.errorContainer, color: M3.error, borderRadius: '8px' } }>
					{ error || 'No analytics data available.' }
				</div>
			</div>
		);
	}

	const stats = [
		{
			label: 'Total Downloads',
			value: data.stats.totalDownloads.toLocaleString(),
			trend: `+${ data.stats.downloadsTrend }% this month`,
			icon: <Download size={ 18 } color={ M3.primary } />,
		},
		{
			label: 'Latest Version Adoption',
			value: `${ data.stats.adoptionRate }%`,
			trend: 'Active sites on newest release',
			icon: <TrendingUp size={ 18 } color={ M3.success } />,
		},
		{
			label: 'Unique Updaters',
			value: data.stats.uniqueUpdaters.toLocaleString(),
			trend: 'Distinct client installations',
			icon: <Users size={ 18 } color={ M3.info } />,
		},
		{
			label: 'Pending Rollbacks',
			value: String( data.stats.pendingRollbacks ),
			trend: 'Incidents recorded',
			icon: <RotateCcw size={ 18 } color={ data.stats.pendingRollbacks > 0 ? M3.warning : M3.onSurfaceVariant } />,
		},
	];

	return (
		<div style={ { padding: '24px', maxWidth: '1400px', margin: '0 auto' } }>
			{ /* Header */ }
			<div style={ { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' } }>
				<div style={ { display: 'flex', alignItems: 'center', gap: '12px' } }>
					<button
						onClick={ () => navigate( '/updates' ) }
						title="Back to Updates"
						style={ {
							background: M3.surface,
							border: `1px solid ${ M3.outlineVariant }`,
							borderRadius: '8px',
							padding: '8px',
							cursor: 'pointer',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							color: M3.onSurface,
						} }
					>
						<ArrowLeft size={ 18 } />
					</button>
					<div>
						<h1 style={ { margin: 0, fontSize: '22px', fontWeight: 700, color: M3.onSurface } }>
							Update Adoption & Analytics
						</h1>
						<span style={ { fontSize: '12px', color: M3.onSurfaceVariant } }>
							Real-time telemetry on customer update pings, distribution, and rollbacks
						</span>
					</div>
				</div>
			</div>

			{ /* KPI Cards */ }
			<div style={ { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' } }>
				{ stats.map( ( card ) => (
					<div
						key={ card.label }
						style={ {
							backgroundColor: M3.surface,
							padding: '16px 20px',
							borderRadius: '12px',
							border: `1px solid ${ M3.outlineVariant }`,
							display: 'flex',
							flexDirection: 'column',
							gap: '6px',
						} }
					>
						<div style={ { display: 'flex', alignItems: 'center', justifyContent: 'space-between' } }>
							<span style={ { fontSize: '13px', color: M3.onSurfaceVariant, fontWeight: 500 } }>{ card.label }</span>
							{ card.icon }
						</div>
						<div style={ { fontSize: '24px', fontWeight: 700, color: M3.onSurface } }>{ card.value }</div>
						<span style={ { fontSize: '11px', color: M3.onSurfaceVariant } }>{ card.trend }</span>
					</div>
				) ) }
			</div>

			{ /* 2-Column Analytics Grid */ }
			<div style={ { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '20px', marginBottom: '24px' } }>
				{ /* Version Adoption Breakdown */ }
				<div
					style={ {
						backgroundColor: M3.surface,
						padding: '20px',
						borderRadius: '12px',
						border: `1px solid ${ M3.outlineVariant }`,
					} }
				>
					<h3 style={ { margin: '0 0 16px', fontSize: '15px', fontWeight: 600, color: M3.onSurface } }>
						Version Adoption Breakdown
					</h3>
					<div style={ { display: 'flex', flexDirection: 'column', gap: '12px' } }>
						{ data.versionAdoption.map( ( item ) => (
							<div key={ item.version }>
								<div style={ { display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' } }>
									<span style={ { fontWeight: 600, fontFamily: 'monospace' } }>{ item.version }</span>
									<span style={ { color: M3.onSurfaceVariant } }>{ item.percentage }% ({ item.count } downloads)</span>
								</div>
								<div style={ { height: '8px', backgroundColor: M3.surfaceContainerLow, borderRadius: '4px', overflow: 'hidden' } }>
									<div
										style={ {
											height: '100%',
											width: `${ item.percentage }%`,
											backgroundColor: M3.primary,
											borderRadius: '4px',
										} }
									/>
								</div>
							</div>
						) ) }
					</div>
				</div>

				{ /* Channel Distribution */ }
				<div
					style={ {
						backgroundColor: M3.surface,
						padding: '20px',
						borderRadius: '12px',
						border: `1px solid ${ M3.outlineVariant }`,
					} }
				>
					<h3 style={ { margin: '0 0 16px', fontSize: '15px', fontWeight: 600, color: M3.onSurface } }>
						Downloads by Channel
					</h3>
					<div style={ { display: 'flex', flexDirection: 'column', gap: '12px' } }>
						{ data.channelDistribution.map( ( item ) => {
							const color = item.channel === 'stable' ? M3.success : item.channel === 'beta' ? M3.warning : M3.secondary;
							return (
								<div key={ item.channel }>
									<div style={ { display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' } }>
										<span style={ { fontWeight: 600, textTransform: 'capitalize', color } }>{ item.channel }</span>
										<span style={ { color: M3.onSurfaceVariant } }>{ item.percentage }% ({ item.count })</span>
									</div>
									<div style={ { height: '8px', backgroundColor: M3.surfaceContainerLow, borderRadius: '4px', overflow: 'hidden' } }>
										<div
											style={ {
												height: '100%',
												width: `${ item.percentage }%`,
												backgroundColor: color,
												borderRadius: '4px',
											} }
										/>
									</div>
								</div>
							);
						} ) }
					</div>
				</div>
			</div>

			{ /* Rollback Audit Log */ }
			<div
				style={ {
					backgroundColor: M3.surface,
					padding: '20px',
					borderRadius: '12px',
					border: `1px solid ${ M3.outlineVariant }`,
				} }
			>
				<h3 style={ { margin: '0 0 16px', fontSize: '15px', fontWeight: 600, color: M3.onSurface } }>
					Rollback Audit Log
				</h3>
				{ data.rollbacks.length === 0 ? (
					<p style={ { fontSize: '13px', color: M3.onSurfaceVariant, margin: 0 } }>
						No emergency rollbacks recorded. All releases are operating smoothly.
					</p>
				) : (
					<table style={ { width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' } }>
						<thead>
							<tr style={ { borderBottom: `1px solid ${ M3.outlineVariant }`, color: M3.onSurfaceVariant } }>
								<th style={ { padding: '8px 12px' } }>Package</th>
								<th style={ { padding: '8px 12px' } }>Product</th>
								<th style={ { padding: '8px 12px' } }>Reason</th>
								<th style={ { padding: '8px 12px' } }>Rolled Back At</th>
								<th style={ { padding: '8px 12px' } }>Rolled Back By</th>
							</tr>
						</thead>
						<tbody>
							{ data.rollbacks.map( ( r ) => (
								<tr key={ r.id } style={ { borderBottom: `1px solid ${ M3.outlineVariant }` } }>
									<td style={ { padding: '10px 12px', fontWeight: 600, fontFamily: 'monospace' } }>
										{ r.fromVersion } ➔ { r.toVersion }
									</td>
									<td style={ { padding: '10px 12px' } }>{ r.productName || `Product #${ r.productId }` }</td>
									<td style={ { padding: '10px 12px', color: M3.error } }>{ r.reason }</td>
									<td style={ { padding: '10px 12px', color: M3.onSurfaceVariant } }>{ r.rolledBackAt }</td>
									<td style={ { padding: '10px 12px' } }>{ r.rolledBackBy }</td>
								</tr>
							) ) }
						</tbody>
					</table>
				) }
			</div>
		</div>
	);
}
