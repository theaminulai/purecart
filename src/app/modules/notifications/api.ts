/**
 * Notifications module API client.
 *
 * There is no notifications endpoint and no notifications table: the feed is
 * derived on the client from counts other modules' endpoints already return.
 * Each source is fetched through the owning module's public API rather than
 * a second hand-rolled call to the same route (DEVELOPMENT_GUIDELINES.md §4,
 * §18), so a change to those contracts surfaces here as a type error.
 *
 * Sources deliberately left out:
 * - Updates' "pending drafts" — GET /updates/versions scans every package
 *   row and resolves each product, too heavy for a request that fires on
 *   every admin page load for a count nothing is time-critical about.
 *
 * @file
 * @since 1.1.0
 */

import { fetchSubscriptionCount } from '@/modules/subscriptions';
import { fetchLicenseReportSummary } from '@/modules/licenses';
import { fetchSaasStats } from '@/modules/saas-accounts';
import type { NotificationSignals } from './types';

/** Expiry horizon the licenses endpoint's `expiring_30d` stat is fixed to. */
export const LICENSE_EXPIRY_WINDOW_DAYS = 30;

/**
 * Fetches every signal the feed is built from, in parallel.
 *
 * Uses `allSettled`, not `all`: one module's endpoint being unavailable (a
 * capability the user lacks, a server error) must not cost the admin the
 * other notifications — the failed source contributes 0 and the caller is
 * told the result is partial.
 *
 * @since 1.1.0
 * @return {Promise<{signals: NotificationSignals, partial: boolean}>} Counts, and whether any source failed.
 */
export async function fetchNotificationSignals(): Promise< {
	signals: NotificationSignals;
	partial: boolean;
} > {
	const results = await Promise.allSettled( [
		fetchSubscriptionCount( 'past_due' ),
		fetchSubscriptionCount( 'pending_reauth' ),
		// The summary report, not GET /licenses: the list route loads and
		// prepares every license row to return a page of them, while this one
		// is aggregate SQL — and only its stats block is read here.
		fetchLicenseReportSummary().then( ( summary ) => summary.stats.expiring_30d ),
		fetchSaasStats().then( ( stats ) => stats.suspended ),
	] );

	const [ pastDue, pendingReauth, expiringLicenses, suspendedSaas ] = results;
	const valueOf = ( result: PromiseSettledResult< number > ): number =>
		'fulfilled' === result.status ? result.value : 0;

	return {
		signals: {
			pastDueSubscriptions: valueOf( pastDue ),
			pendingReauthSubscriptions: valueOf( pendingReauth ),
			expiringLicenses: valueOf( expiringLicenses ),
			suspendedSaasAccounts: valueOf( suspendedSaas ),
		},
		partial: results.some( ( result ) => 'rejected' === result.status ),
	};
}
