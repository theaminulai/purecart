import { Suspense } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import {
	SubscriptionsPage, SubscriptionsPageSkeleton,
	SubscriptionDetailPage, SubscriptionDetailPageSkeleton,
} from '@/modules/subscriptions';
import { SubscriptionAnalyticsPage, SubscriptionAnalyticsPageSkeleton, AnalyticsPage } from '@/modules/analytics';
import { SettingsPage } from '@/modules/settings';
import { PAGE_PATHS, SUBSCRIPTION_DETAIL_PATH } from './paths';

// Overview
import { OverviewPage } from '@/modules/overview';

// Module stubs
import { LicensesPage }     from '@/modules/licenses';
import { DownloadsPage }    from '@/modules/downloads';
import { UpdatesPage, UpdatesPageSkeleton, UpdateAnalyticsPage } from '@/modules/updates';
import { SaasAccountsPage } from '@/modules/saas-accounts';
import { AffiliatesPage }   from '@/modules/affiliates';
import { AbandonedCartPage} from '@/modules/abandoned-cart';
import { SecurityPage }     from '@/modules/security';

/**
 * All routes for the app.
 *
 * Kept here rather than inline in App.tsx so route definitions, and the
 * components they map to, live in one place. React Router v6 ranks static
 * path segments above dynamic ones, so `/subscriptions/analytics` always
 * matches its own route rather than being swallowed by `/subscriptions/:id`,
 * regardless of declaration order.
 */
export function AppRoutes() {
	const navigate = useNavigate();

	return (
		<Routes>
			{ /* Default redirect to Overview */ }
			<Route
				path="/"
				element={ <Navigate to={ PAGE_PATHS.overview } replace /> }
			/>

			{ /* Overview */ }
			<Route
				path={ PAGE_PATHS.overview }
				element={
					<OverviewPage
						onNav={ ( page ) => navigate( PAGE_PATHS[ page as keyof typeof PAGE_PATHS ] ?? PAGE_PATHS.overview ) }
					/>
				}
			/>

			{ /* Licenses */ }
			<Route path={ PAGE_PATHS.licenses }               element={ <LicensesPage /> } />

			{ /* Downloads */ }
			<Route path={ PAGE_PATHS.downloads }              element={ <DownloadsPage /> } />

			{ /* Updates */ }
			<Route
				path={ PAGE_PATHS.updates }
				element={ <Suspense fallback={ <UpdatesPageSkeleton /> }><UpdatesPage /></Suspense> }
			/>
			<Route path="/updates/analytics"                  element={ <UpdateAnalyticsPage /> } />

			{ /* Subscriptions */ }
			<Route
				path={ PAGE_PATHS.subscriptions }
				element={ <Suspense fallback={ <SubscriptionsPageSkeleton /> }><SubscriptionsPage /></Suspense> }
			/>
			<Route
				path={ SUBSCRIPTION_DETAIL_PATH }
				element={ <Suspense fallback={ <SubscriptionDetailPageSkeleton /> }><SubscriptionDetailPage /></Suspense> }
			/>
			<Route
				path={ PAGE_PATHS[ 'subscription-analytics' ] }
				element={ <Suspense fallback={ <SubscriptionAnalyticsPageSkeleton /> }><SubscriptionAnalyticsPage /></Suspense> }
			/>

			{ /* SaaS Accounts */ }
			<Route path={ PAGE_PATHS[ 'saas-accounts' ] }    element={ <SaasAccountsPage /> } />

			{ /* Affiliates */ }
			<Route path={ PAGE_PATHS.affiliates }             element={ <AffiliatesPage /> } />

			{ /* Abandoned Cart */ }
			<Route path={ PAGE_PATHS[ 'abandoned-cart' ] }   element={ <AbandonedCartPage /> } />

			{ /* Security */ }
			<Route path={ PAGE_PATHS.security }               element={ <SecurityPage /> } />

			{ /* Analytics */ }
			<Route path={ PAGE_PATHS.analytics }              element={ <AnalyticsPage /> } />

			{ /* Settings */ }
			<Route path={ PAGE_PATHS.settings }               element={ <SettingsPage /> } />
		</Routes>
	);
}

