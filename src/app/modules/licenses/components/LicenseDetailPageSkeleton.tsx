import { Card } from '@/shared/ui/Card';
import { Skeleton } from '@/shared/ui/Skeleton';

/**
 * Loading fallback for LicenseDetailPage, shown by the <Suspense> boundary
 * around it in AppRoutes on this license's true first load this session.
 *
 * @since 1.0.0
 */
export function LicenseDetailPageSkeleton() {
	return (
		<div className="flex flex-col gap-5">
			<div className="flex items-center gap-3">
				<Skeleton height={ 32 } width={ 80 } radius={ 8 } />
				<Skeleton height={ 22 } width={ 160 } />
			</div>

			<div className="grid grid-cols-5 gap-5">
				<Card className="col-span-3 p-5 flex flex-col gap-4">
					<div className="flex items-center justify-between">
						<Skeleton height={ 18 } width={ 220 } />
						<Skeleton height={ 22 } width={ 70 } radius={ 999 } />
					</div>
					<div className="grid grid-cols-2 gap-4">
						{ Array.from( { length: 6 } ).map( ( _, i ) => (
							<div key={ i } className="flex flex-col gap-2">
								<Skeleton height={ 10 } width="40%" />
								<Skeleton height={ 14 } width="70%" />
							</div>
						) ) }
					</div>
					<div className="pt-3 flex gap-2" style={ { borderTop: '1px solid rgba(0,0,0,0.06)' } }>
						{ Array.from( { length: 5 } ).map( ( _, i ) => (
							<Skeleton key={ i } height={ 32 } width={ 110 } radius={ 8 } />
						) ) }
					</div>
				</Card>

				<Card className="col-span-2 p-5 flex flex-col gap-3">
					<Skeleton height={ 16 } width={ 160 } />
					{ Array.from( { length: 3 } ).map( ( _, i ) => (
						<Skeleton key={ i } height={ 44 } width="100%" radius={ 8 } />
					) ) }
				</Card>
			</div>
		</div>
	);
}
