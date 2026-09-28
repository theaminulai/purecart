/**
 * Turns raw source counts into the display-ready notification rows the panel
 * renders. Pure — no fetching, no store access — so the wording and the
 * "which counts are worth an admin's attention" rules live in one place.
 *
 * @file
 * @since 1.1.0
 */
import { __, _n, sprintf } from '@wordpress/i18n';
import { LICENSE_EXPIRY_WINDOW_DAYS } from '../api';
import type { NotificationItem, NotificationSignals } from '../types';

/**
 * Builds the feed, highest severity first.
 *
 * A count of 0 produces no row at all — "nothing is past due" is not news,
 * and an empty panel is the honest way to say it.
 *
 * @since 1.1.0
 * @param {NotificationSignals} signals Counts from the source endpoints.
 * @return {NotificationItem[]} Rows to render, ordered critical → info.
 */
export function buildNotifications( signals: NotificationSignals ): NotificationItem[] {
	const items: NotificationItem[] = [];

	if ( signals.pastDueSubscriptions > 0 ) {
		const count = signals.pastDueSubscriptions;
		items.push( {
			id: `subscriptions-past-due:${ count }`,
			kind: 'subscriptions-past-due',
			severity: 'critical',
			count,
			page: 'subscriptions',
			title: sprintf(
				/* translators: %d: number of subscriptions. */
				_n(
					'%d subscription is past due',
					'%d subscriptions are past due',
					count,
					'purecart'
				),
				count
			),
			body: __(
				'A renewal payment failed. Retry the charge or ask the customer to update their card.',
				'purecart'
			),
		} );
	}

	if ( signals.pendingReauthSubscriptions > 0 ) {
		const count = signals.pendingReauthSubscriptions;
		items.push( {
			id: `subscriptions-pending-reauth:${ count }`,
			kind: 'subscriptions-pending-reauth',
			severity: 'warning',
			count,
			page: 'subscriptions',
			title: sprintf(
				/* translators: %d: number of subscriptions. */
				_n(
					'%d subscription is waiting on re-authorization',
					'%d subscriptions are waiting on re-authorization',
					count,
					'purecart'
				),
				count
			),
			body: __(
				'The bank asked the customer to confirm the payment. Nothing renews until they do.',
				'purecart'
			),
		} );
	}

	if ( signals.expiringLicenses > 0 ) {
		const count = signals.expiringLicenses;
		items.push( {
			id: `licenses-expiring:${ count }`,
			kind: 'licenses-expiring',
			severity: 'warning',
			count,
			page: 'licenses',
			title: sprintf(
				/* translators: 1: number of licenses, 2: number of days. */
				_n(
					'%1$d license expires within %2$d days',
					'%1$d licenses expire within %2$d days',
					count,
					'purecart'
				),
				count,
				LICENSE_EXPIRY_WINDOW_DAYS
			),
			body: __(
				'Their sites stop receiving updates once the key lapses.',
				'purecart'
			),
		} );
	}

	if ( signals.suspendedSaasAccounts > 0 ) {
		const count = signals.suspendedSaasAccounts;
		items.push( {
			id: `saas-accounts-suspended:${ count }`,
			kind: 'saas-accounts-suspended',
			severity: 'info',
			count,
			page: 'saas-accounts',
			title: sprintf(
				/* translators: %d: number of SaaS accounts. */
				_n(
					'%d SaaS account is suspended',
					'%d SaaS accounts are suspended',
					count,
					'purecart'
				),
				count
			),
			body: __(
				'Suspended accounts keep their data but cannot call the API.',
				'purecart'
			),
		} );
	}

	return items;
}
