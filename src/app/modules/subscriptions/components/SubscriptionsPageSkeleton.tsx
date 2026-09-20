import { Card } from '@/shared/ui/Card';
import { Skeleton } from '@/shared/ui/Skeleton';

const KPI_COUNT = 6;
const FILTER_CHIP_COUNT = 6;
const COLUMN_COUNT = 12;
const ROW_COUNT = 8;

/** One table cell: flexes to fill its column's share of the row's full width, narrower than its own cell so it reads as text rather than a filled block. */
function Cell({ grow = 1, fill = '70%' }: { grow?: number; fill?: number | string }) {
	return (
		<div style={{ flex: grow, minWidth: 0 }}>
			<Skeleton height={14} width={fill} />
		</div>
	);
}

/**
 * Loading fallback for SubscriptionsPage, shown by the <Suspense> boundary
 * around it in AppRoutes while the initial `loadSubscriptions()` fetch is
 * in flight. Mirrors the real page's shape — KPI strip (6 cards), filter
 * bar (search + 6 chips + export button), 12-column table — and, like the
 * real table, stretches to fill the page's full width rather than a fixed
 * pixel size, so the layout doesn't visibly narrow while loading and then
 * jump wider once real content swaps in.
 *
 * @since 1.1.0
 */
export function SubscriptionsPageSkeleton() {
	return (
		<div className="flex flex-col gap-5">
			{ /* KPI strip */ }
			<div className="grid grid-cols-6 gap-3">
				{ Array.from( { length: KPI_COUNT } ).map( ( _, i ) => (
					<Card key={ i } className="p-4 flex flex-col gap-2">
						<Skeleton height={ 12 } width="60%" />
						<Skeleton height={ 24 } width="40%" />
					</Card>
				) ) }
			</div>

			{ /* Filter bar */ }
			<div className="flex items-center gap-2 flex-wrap">
				<div style={ { flex: '1 1 240px', maxWidth: 320 } }>
					<Skeleton height={ 36 } width="100%" radius={ 18 } />
				</div>
				{ Array.from( { length: FILTER_CHIP_COUNT } ).map( ( _, i ) => (
					<Skeleton key={ i } height={ 32 } width={ 96 } radius={ 16 } />
				) ) }
				<div className="ml-auto">
					<Skeleton height={ 36 } width={ 120 } radius={ 18 } />
				</div>
			</div>

			{ /* Table */ }
			<Card className="p-0 overflow-hidden">
				<div className="flex items-center gap-4 px-4" style={ { height: 44 } }>
					{ Array.from( { length: COLUMN_COUNT } ).map( ( _, i ) => (
						<Cell key={ i } grow={ i === 0 ? 0.4 : 1 } fill="50%" />
					) ) }
				</div>
				{ Array.from( { length: ROW_COUNT } ).map( ( _, row ) => (
					<div
						key={ row }
						className="flex items-center gap-4 px-4"
						style={ { height: 52, borderTop: '1px solid rgba(0,0,0,0.06)' } }
					>
						{ Array.from( { length: COLUMN_COUNT } ).map( ( _, col ) => (
							<Cell key={ col } grow={ col === 0 ? 0.4 : 1 } />
						) ) }
					</div>
				) ) }
			</Card>
		</div>
	);
}
