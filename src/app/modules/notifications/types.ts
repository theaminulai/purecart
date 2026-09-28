/**
 * Notifications module TypeScript data shapes.
 *
 * @file
 * @since 1.1.0
 */
import type { Page } from '@/shared/types/page';

export type NotificationSeverity = 'critical' | 'warning' | 'info';

/**
 * What a notification is about. One kind produces at most one row — the feed
 * summarizes counts ("3 subscriptions are past due"), it does not list every
 * affected record, so the panel stays readable as a store grows.
 */
export type NotificationKind =
	| 'subscriptions-past-due'
	| 'subscriptions-pending-reauth'
	| 'licenses-expiring'
	| 'saas-accounts-suspended';

export interface NotificationItem {
	/**
	 * Kind plus the count it was built from, e.g. `licenses-expiring:4`.
	 *
	 * Read state is keyed on this, so a notification the admin has already
	 * seen returns as unread once the number behind it changes — which is
	 * exactly when it is worth their attention again.
	 */
	id: string;
	kind: NotificationKind;
	severity: NotificationSeverity;
	/** Already localized and interpolated — the store holds display-ready text. */
	title: string;
	body: string;
	count: number;
	/** Page the row navigates to when clicked. */
	page: Page;
}

/**
 * Raw counts the feed is derived from, one per source query.
 *
 * @see fetchNotificationSignals
 */
export interface NotificationSignals {
	pastDueSubscriptions: number;
	pendingReauthSubscriptions: number;
	expiringLicenses: number;
	suspendedSaasAccounts: number;
}

export interface NotificationFeed {
	items: NotificationItem[];
	/**
	 * True when at least one source query failed. The feed still renders
	 * what did load, with a note — a single failing endpoint shouldn't
	 * blank the whole panel.
	 */
	partial: boolean;
}
