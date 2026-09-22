/**
 * SubscriptionAnalyticsPage - subscription analytics dashboard.
 *
 * KPI grid, date-range toggle (only affects the revenue trend chart), charts,
 * an extended churn risk table, and a read-only revenue goals widget.
 *
 * Every dataset here now comes from real data: revenue trend / dunning
 * funnel / churn-by-reason come from GET /reports/subscriptions/summary
 * (SubscriptionReport::summary()), subscription mix / revenue-by-type are
 * computed client-side from the already-loaded real subscriptions list, and
 * revenue goals / churn risk go through their existing endpoints.
 *
 * @file
 * @since 1.0.0
 */
import { useEffect, useState } from 'react';
import {
	LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
	PieChart, Pie, Cell, BarChart, Bar, Legend,
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, Users, UserPlus, TrendingDown, DollarSign, TrendingUp, HeartPulse, AlertTriangle } from 'lucide-react';
import { M3 } from '@/theme';
import {
	fetchRevenueGoals, fetchChurnRisk, fetchSubscriptionReportSummary,
	type RevenueMonthPoint, type DunningFunnelStage, type ChurnReasonCount,
} from '../api';
import { fetchCancellationReasons } from '@/modules/subscriptions/api';
import {
	computeMRR, countNewThisMonth, computeChurnRatePct, computeAvgLtv, addBillingInterval,
	selectSubscriptionItems, loadSubscriptions,
} from '@/modules/subscriptions';
import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import { useSuspenseThunk } from '@/shared/suspense';
import { KpiCard } from '@/shared/ui/KpiCard';
import { OutlinedButton } from '@/shared/ui/OutlinedButton';
import { useSubscriptionActions } from '@/modules/subscriptions';
import { ChurnRiskTable } from './ChurnRiskTable';
import { RevenueGoalsWidget } from './RevenueGoalsWidget';
import type { RevenueGoal, ChurnRiskEntry, SubscriptionRecord, SubscriptionDeliveryType } from '@/modules/subscriptions';

const RANGE_OPTIONS = [ '30d', '3m', '6m', '12m' ] as const;
type Range = ( typeof RANGE_OPTIONS )[ number ];

const DELIVERY_TYPE_LABELS: Record< SubscriptionDeliveryType, string > = {
	software: 'Software', saas: 'SaaS', membership: 'Membership',
	download: 'Download', course: 'Course', service: 'Service',
};

const DELIVERY_TYPE_COLORS: Record< SubscriptionDeliveryType, string > = {
	software: M3.primary, saas: M3.secondary, membership: M3.info,
	download: M3.success, course: M3.warning, service: M3.onSurfaceVariant,
};

/** How many subscriptions of each delivery type, for the mix pie chart. */
function computeTypeMix( subscriptions: SubscriptionRecord[] ) {
	const counts: Partial< Record< SubscriptionDeliveryType, number > > = {};
	for ( const s of subscriptions ) counts[ s.deliveryType ] = ( counts[ s.deliveryType ] ?? 0 ) + 1;

	return Object.entries( counts ).map( ( [ type, value ] ) => ( {
		name: DELIVERY_TYPE_LABELS[ type as SubscriptionDeliveryType ],
		value,
		color: DELIVERY_TYPE_COLORS[ type as SubscriptionDeliveryType ],
	} ) );
}

/** Recurring revenue from active subscriptions, summed by delivery type. */
function computeRevenueByType( subscriptions: SubscriptionRecord[] ) {
	const totals: Partial< Record< SubscriptionDeliveryType, number > > = {};
	for ( const s of subscriptions ) {
		if ( s.status !== 'active' ) continue;
		totals[ s.deliveryType ] = ( totals[ s.deliveryType ] ?? 0 ) + s.amountRaw;
	}

	return Object.entries( totals ).map( ( [ type, revenue ] ) => ( {
		type: DELIVERY_TYPE_LABELS[ type as SubscriptionDeliveryType ],
		revenue: Math.round( revenue ),
	} ) );
}

/** "1st", "2nd", "3rd", "4th retry" ... for the dunning funnel's x-axis. */
function ordinalRetryLabel( attempt: number ): string {
	const suffix = [ 'th', 'st', 'nd', 'rd' ][ attempt % 10 > 3 || Math.floor( ( attempt % 100 ) / 10 ) === 1 ? 0 : attempt % 10 ] ?? 'th';
	return `${ attempt }${ suffix } retry`;
}

/** Short month label ('Jan', 'Feb', ...) from a 'YYYY-MM' bucket. */
function monthLabel( yyyyMm: string ): string {
	const [ year, month ] = yyyyMm.split( '-' ).map( Number );
	if ( ! year || ! month ) return yyyyMm;
	return new Date( year, month - 1, 1 ).toLocaleDateString( 'en-US', { month: 'short' } );
}

/** Slices the revenue trend per the selected date-range toggle. */
function sliceTrend( data: RevenueMonthPoint[], range: Range ) {
	if ( range === '30d' ) return data.slice( -1 );
	if ( range === '3m' ) return data.slice( -3 );
	if ( range === '6m' ) return data.slice( -6 );
	return data;
}

/**
 * Renders the Subscription Analytics page.
 *
 * @since 1.0.0
 *
 * @return {JSX.Element} The analytics page.
 */
export function SubscriptionAnalyticsPage() {
	const navigate = useNavigate();
	const dispatch = useAppDispatch();
	useSuspenseThunk( 'subscriptions', () => dispatch( loadSubscriptions() ).unwrap() );

	const subscriptions = useAppSelector( selectSubscriptionItems );
	const [ range, setRange ] = useState< Range >( '6m' );
	const [ goals, setGoals ] = useState< RevenueGoal[] >( [] );
	const [ churnRisk, setChurnRisk ] = useState< ChurnRiskEntry[] >( [] );
	const [ revenueByMonth, setRevenueByMonth ] = useState< RevenueMonthPoint[] >( [] );
	const [ dunningFunnel, setDunningFunnel ] = useState< DunningFunnelStage[] >( [] );
	const [ churnByReason, setChurnByReason ] = useState< ChurnReasonCount[] >( [] );
	const [ reasonLabels, setReasonLabels ] = useState< Record< string, string > >( {} );
	const { showToast, openDialog, closeDialog, openBulkDiscount, updateRow, modals } = useSubscriptionActions();

	useEffect( () => {
		fetchRevenueGoals().then( setGoals );
		fetchChurnRisk().then( setChurnRisk );
		fetchCancellationReasons().then( setReasonLabels );
		fetchSubscriptionReportSummary().then( ( summary ) => {
			setRevenueByMonth( summary.revenue_by_month );
			setDunningFunnel( summary.dunning_funnel );
			setChurnByReason( summary.churn_by_reason );
		} );
	}, [] );

	const mrr = computeMRR( subscriptions );
	const arr = mrr * 12;
	const activeSubs = subscriptions.filter( ( r ) => r.status === 'active' ).length;
	const newThisMonth = countNewThisMonth( subscriptions );
	const churnRatePct = computeChurnRatePct( subscriptions );
	const avgLtv = computeAvgLtv( subscriptions );
	const atRiskCount = subscriptions.filter( ( r ) => r.churnRiskScore > 50 ).length;

	const trendData = sliceTrend( revenueByMonth, range ).map( ( p ) => ( { month: monthLabel( p.month ), revenue: p.total } ) );
	const typeMix = computeTypeMix( subscriptions );
	const revenueByType = computeRevenueByType( subscriptions );
	const funnelData = dunningFunnel.map( ( f ) => ( { attempt: ordinalRetryLabel( f.attempt ), recovered: f.recovered } ) );
	const reasonData = churnByReason.map( ( r ) => ( { label: reasonLabels[ r.reason ] ?? r.reason, count: r.count } ) );

	return (
		<div className="flex flex-col gap-6">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-1">
					{ RANGE_OPTIONS.map( ( r ) => (
						<button
							key={ r }
							onClick={ () => setRange( r ) }
							className="px-3 py-1.5 rounded-full text-xs"
							style={ {
								backgroundColor: range === r ? M3.primary : M3.surfaceContainerHigh,
								color: range === r ? M3.onPrimary : M3.onSurfaceVariant,
								border: 'none',
								cursor: 'pointer',
								fontFamily: 'Roboto, sans-serif',
							} }
						>
							{ r }
						</button>
					) ) }
				</div>
				<OutlinedButton small onClick={ () => navigate( -1 ) }>← Back</OutlinedButton>
			</div>

			{ /* ── KPI grid ─────────────────────────────────────────────────────── */ }
			<div className="grid grid-cols-4 gap-4">
				<KpiCard label="Active Subs" value={ String( activeSubs ) } trend="live" trendUp icon={ Users } />
				<KpiCard label="New This Month" value={ String( newThisMonth ) } trend="live" trendUp icon={ UserPlus } />
				<KpiCard label="Churn Rate" value={ `${ churnRatePct.toFixed( 1 ) }%` } trend="live" trendUp={ false } icon={ TrendingDown } />
				<KpiCard label="Sub MRR" value={ `$${ Math.round( mrr ).toLocaleString() }` } trend="live" trendUp icon={ DollarSign } />
				<KpiCard label="ARR" value={ `$${ Math.round( arr ).toLocaleString() }` } trend="live" trendUp icon={ TrendingUp } />
				<KpiCard label="Avg LTV" value={ `$${ Math.round( avgLtv ).toLocaleString() }` } trend="live" trendUp icon={ HeartPulse } />
				<KpiCard label="At-Risk Subs" value={ String( atRiskCount ) } trend="live" trendUp={ false } icon={ AlertTriangle } />
			</div>

			{ /* ── Charts ───────────────────────────────────────────────────────── */ }
			<div className="grid grid-cols-2 gap-5">
				<div className="p-5 rounded-xl" style={ { backgroundColor: M3.surface } }>
					<div className="text-sm font-semibold mb-3" style={ { color: M3.onSurface, fontFamily: 'Roboto, sans-serif' } }>
						Revenue Trend
					</div>
					<ResponsiveContainer width="100%" height={ 240 }>
						<LineChart data={ trendData }>
							<CartesianGrid strokeDasharray="3 3" stroke={ M3.outlineVariant } />
							<XAxis dataKey="month" tick={ { fontSize: 11 } } />
							<YAxis tick={ { fontSize: 11 } } />
							<Tooltip />
							<Legend />
							<Line type="monotone" dataKey="revenue" stroke={ M3.primary } name="Recognized Revenue" />
						</LineChart>
					</ResponsiveContainer>
				</div>

				<div className="p-5 rounded-xl" style={ { backgroundColor: M3.surface } }>
					<div className="text-sm font-semibold mb-3" style={ { color: M3.onSurface, fontFamily: 'Roboto, sans-serif' } }>
						Subscription Mix by Type
					</div>
					<ResponsiveContainer width="100%" height={ 240 }>
						<PieChart>
							<Pie data={ typeMix } dataKey="value" nameKey="name" outerRadius={ 90 } label>
								{ typeMix.map( ( d, i ) => <Cell key={ i } fill={ d.color } /> ) }
							</Pie>
							<Tooltip />
							<Legend />
						</PieChart>
					</ResponsiveContainer>
				</div>

				<div className="p-5 rounded-xl" style={ { backgroundColor: M3.surface } }>
					<div className="text-sm font-semibold mb-3" style={ { color: M3.onSurface, fontFamily: 'Roboto, sans-serif' } }>
						Revenue by Type
					</div>
					<ResponsiveContainer width="100%" height={ 240 }>
						<BarChart data={ revenueByType } layout="vertical">
							<CartesianGrid strokeDasharray="3 3" stroke={ M3.outlineVariant } />
							<XAxis type="number" tick={ { fontSize: 11 } } />
							<YAxis type="category" dataKey="type" tick={ { fontSize: 11 } } width={ 80 } />
							<Tooltip />
							<Bar dataKey="revenue" fill={ M3.primary } />
						</BarChart>
					</ResponsiveContainer>
				</div>

				<div className="p-5 rounded-xl" style={ { backgroundColor: M3.surface } }>
					<div className="text-sm font-semibold mb-3" style={ { color: M3.onSurface, fontFamily: 'Roboto, sans-serif' } }>
						Dunning Funnel
					</div>
					<ResponsiveContainer width="100%" height={ 240 }>
						<BarChart data={ funnelData }>
							<CartesianGrid strokeDasharray="3 3" stroke={ M3.outlineVariant } />
							<XAxis dataKey="attempt" tick={ { fontSize: 11 } } />
							<YAxis tick={ { fontSize: 11 } } />
							<Tooltip />
							<Bar dataKey="recovered" fill={ M3.warning } />
						</BarChart>
					</ResponsiveContainer>
				</div>

				<div className="p-5 rounded-xl" style={ { backgroundColor: M3.surface } }>
					<div className="text-sm font-semibold mb-3" style={ { color: M3.onSurface, fontFamily: 'Roboto, sans-serif' } }>
						Churn by Reason
					</div>
					<ResponsiveContainer width="100%" height={ 240 }>
						<PieChart>
							<Pie data={ reasonData } dataKey="count" nameKey="label" outerRadius={ 90 } label>
								{ reasonData.map( ( _, i ) => (
									<Cell key={ i } fill={ [ M3.primary, M3.secondary, M3.info, M3.warning, M3.onSurfaceVariant ][ i % 5 ] } />
								) ) }
							</Pie>
							<Tooltip />
							<Legend />
						</PieChart>
					</ResponsiveContainer>
				</div>

				<RevenueGoalsWidget goals={ goals } />
			</div>

			<ChurnRiskTable
				entries={ churnRisk }
				onSendReminder={ ( e ) => showToast( `Renewal reminder sent to ${ e.customer }`, 'success' ) }
				onApplyDiscount={ ( e ) => {
					const record = subscriptions.find( ( r ) => r.id === e.subscriptionId );
					if ( record ) openBulkDiscount( [ record ] );
				} }
				onRetryPayment={ ( e ) => {
					const record = subscriptions.find( ( r ) => r.id === e.subscriptionId );
					if ( ! record ) return;
					openDialog( {
						danger: false, icon: RefreshCw, title: 'Retry Payment?',
						body: `Attempt to charge ${ record.amount } from ${ record.customer }'s payment method on file immediately?`,
						confirmLabel: 'Retry Payment',
						onConfirm: () => {
							updateRow( record.id, { status: 'active', nextPayment: addBillingInterval( null, record.billing ) } );
							showToast( `Payment retried successfully for ${ record.customer }`, 'success' );
							closeDialog();
						},
					} );
				} }
			/>

			{ modals }
		</div>
	);
}
