import { Card } from '@/shared/ui/Card';
import { Skeleton } from '@/shared/ui/Skeleton';

const KPI_COUNT = 8;
const CHART_COUNT = 6; // 5 charts + the revenue goals widget, same 2-col grid
const CHURN_ROW_COUNT = 5;
const CHURN_COLUMN_COUNT = 6;

/** One table cell: flexes to fill its column's share of the row's full width. */
function Cell({ grow = 1, fill = '65%' }: { grow?: number; fill?: number | string }) {
	return (
		<div style={{ flex: grow, minWidth: 0 }}>
			<Skeleton height={14} width={fill} />
		</div>
	);
}

/**
 * Loading fallback for SubscriptionAnalyticsPage, shown by the <Suspense>
 * boundary around it in AppRoutes while the initial `loadSubscriptions()`
 * fetch is in flight. Mirrors the real page's shape — range toggle, 8-card
 * KPI grid, a 2-column grid of 6 chart/widget cards, then the churn risk
 * table.
 *
 * @since 1.1.0
 */
export function SubscriptionAnalyticsPageSkeleton() {
	return (
		<div className="flex flex-col gap-6">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-1">
					<Skeleton height={ 28 } width={ 200 } radius={ 16 } />
				</div>
				<Skeleton height={ 32 } width={ 90 } radius={ 16 } />
			</div>

			{ /* KPI grid */ }
			<div className="grid grid-cols-4 gap-4">
				{ Array.from( { length: KPI_COUNT } ).map( ( _, i ) => (
					<Card key={ i } className="p-4 flex flex-col gap-2">
						<Skeleton height={ 12 } width="70%" />
						<Skeleton height={ 22 } width="45%" />
					</Card>
				) ) }
			</div>

			{ /* Charts + revenue goals */ }
			<div className="grid grid-cols-2 gap-5">
				{ Array.from( { length: CHART_COUNT } ).map( ( _, i ) => (
					<Card key={ i } className="p-5 flex flex-col gap-3">
						<Skeleton height={ 14 } width="40%" />
						<Skeleton height={ 240 } width="100%" radius={ 12 } />
					</Card>
				) ) }
			</div>

			{ /* Churn risk table */ }
			<Card className="p-0 overflow-hidden">
				<div className="flex items-center gap-4 px-4" style={ { height: 44 } }>
					{ Array.from( { length: CHURN_COLUMN_COUNT } ).map( ( _, i ) => (
						<Cell key={ i } fill="45%" />
					) ) }
				</div>
				{ Array.from( { length: CHURN_ROW_COUNT } ).map( ( _, row ) => (
					<div
						key={ row }
						className="flex items-center gap-4 px-4"
						style={ { height: 52, borderTop: '1px solid rgba(0,0,0,0.06)' } }
					>
						{ Array.from( { length: CHURN_COLUMN_COUNT } ).map( ( _, col ) => (
							<Cell key={ col } />
						) ) }
					</div>
				) ) }
			</Card>
		</div>
	);
}
