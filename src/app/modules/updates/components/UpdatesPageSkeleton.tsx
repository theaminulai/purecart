import { Card } from '@/shared/ui/Card';
import { Skeleton } from '@/shared/ui/Skeleton';

const KPI_COUNT = 4;
const FILTER_CHIP_COUNT = 4;
const COLUMN_COUNT = 8;
const ROW_COUNT = 6;

/** One table cell: flexes to fill its column's share of the row's full width. */
function Cell({ grow = 1, fill = '65%' }: { grow?: number; fill?: number | string }) {
	return (
		<div style={{ flex: grow, minWidth: 0 }}>
			<Skeleton height={14} width={fill} />
		</div>
	);
}

/**
 * Loading fallback for UpdatesPage, shown by the <Suspense> boundary around
 * it in AppRoutes for the true first load this session only (later visits
 * keep the page's existing "refetch in the background, table shows its own
 * inline loading state" behavior — see UpdatesPage.tsx). Mirrors the real
 * page's shape — header row, 4-card KPI strip, filter bar, 8-column table —
 * stretched to the page's full width like the real table, not a fixed size.
 *
 * @since 1.1.0
 */
export function UpdatesPageSkeleton() {
	return (
		<div className="flex flex-col gap-5">
			{ /* Header */ }
			<div className="flex items-center justify-between">
				<Skeleton height={ 22 } width={ 160 } />
				<div className="flex items-center gap-2">
					<Skeleton height={ 34 } width={ 150 } radius={ 8 } />
					<Skeleton height={ 34 } width={ 130 } radius={ 8 } />
				</div>
			</div>

			{ /* KPI strip */ }
			<div className="grid grid-cols-4 gap-3">
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
			</div>

			{ /* Table */ }
			<Card className="p-0 overflow-hidden">
				<div className="flex items-center gap-4 px-4" style={ { height: 44 } }>
					{ Array.from( { length: COLUMN_COUNT } ).map( ( _, i ) => (
						<Cell key={ i } grow={ i === 0 ? 0.3 : 1 } fill="45%" />
					) ) }
				</div>
				{ Array.from( { length: ROW_COUNT } ).map( ( _, row ) => (
					<div
						key={ row }
						className="flex items-center gap-4 px-4"
						style={ { height: 56, borderTop: '1px solid rgba(0,0,0,0.06)' } }
					>
						{ Array.from( { length: COLUMN_COUNT } ).map( ( _, col ) => (
							<Cell key={ col } grow={ col === 0 ? 0.3 : 1 } />
						) ) }
					</div>
				) ) }
			</Card>
		</div>
	);
}
