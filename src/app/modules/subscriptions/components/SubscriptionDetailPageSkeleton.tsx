import { Card } from '@/shared/ui/Card';
import { Skeleton } from '@/shared/ui/Skeleton';

const TAB_COUNT = 6;

/**
 * Loading fallback for SubscriptionDetailPage, shown by the <Suspense>
 * boundary around it in AppRoutes while the initial `loadSubscriptions()`
 * fetch is in flight (this page can be reached by a direct deep link, not
 * only by drilling in from the list, so it needs its own fallback rather
 * than relying on the list page always having loaded first). Mirrors the
 * real page's shape — back link + status/action row, title block, 6-tab
 * bar, then the Overview tab's 2fr/1fr two-column layout.
 *
 * @since 1.1.0
 */
export function SubscriptionDetailPageSkeleton() {
	return (
		<div className="flex flex-col gap-5">
			{ /* Header */ }
			<div className="flex flex-col gap-3">
				<div className="flex items-center justify-between">
					<Skeleton height={ 16 } width={ 140 } />
					<div className="flex items-center gap-2">
						<Skeleton height={ 24 } width={ 70 } radius={ 12 } />
						<Skeleton height={ 32 } width={ 80 } radius={ 16 } />
						<Skeleton height={ 32 } width={ 80 } radius={ 16 } />
						<Skeleton height={ 32 } width={ 32 } radius={ 16 } />
					</div>
				</div>
				<div className="flex flex-col gap-1.5">
					<Skeleton height={ 20 } width={ 320 } />
					<Skeleton height={ 14 } width={ 200 } />
				</div>
			</div>

			{ /* Tab bar */ }
			<div className="flex items-center gap-4" style={ { paddingBottom: 12 } }>
				{ Array.from( { length: TAB_COUNT } ).map( ( _, i ) => (
					<Skeleton key={ i } height={ 14 } width={ 72 } />
				) ) }
			</div>

			{ /* Overview tab: 2fr/1fr two-column layout */ }
			<div className="grid gap-5" style={ { gridTemplateColumns: '2fr 1fr' } }>
				<div className="flex flex-col gap-4">
					<Card className="p-5 flex flex-col gap-3">
						{ Array.from( { length: 5 } ).map( ( _, i ) => (
							<div key={ i } className="flex items-center justify-between">
								<Skeleton height={ 12 } width={ 100 } />
								<Skeleton height={ 12 } width={ 80 } />
							</div>
						) ) }
					</Card>
					<Card className="p-5 flex flex-col gap-3">
						<Skeleton height={ 12 } width={ 120 } />
						<Skeleton height={ 60 } width="100%" radius={ 12 } />
					</Card>
				</div>
				<div className="flex flex-col gap-4">
					<Card className="p-5 flex flex-col gap-3">
						<Skeleton height={ 12 } width={ 90 } />
						<Skeleton height={ 80 } width="100%" radius={ 12 } />
					</Card>
				</div>
			</div>
		</div>
	);
}
