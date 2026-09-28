/**
 * Contextual help text for each admin page, shown by the top bar's Help
 * button.
 *
 * Written as a function rather than a module-level constant map — unlike
 * `nav-schema.ts`'s labels, which are deliberately untranslated because a
 * constant evaluated at import time can run before WordPress registers its
 * locale data. Building the record inside a call solves that: `__()` runs
 * at render time, when the locale is in place.
 *
 * The text describes what each page actually does today. A page whose
 * module isn't built yet says so instead of describing a plan.
 *
 * @file
 * @since 1.1.0
 */
import { __ } from '@wordpress/i18n';
import type { Page } from '@/shared/types/page';

export interface PageHelp {
	/** One sentence on what the page is for. */
	description: string;
	/** Short, concrete things the admin can do here. */
	tips: string[];
}

/**
 * Help content for one page.
 *
 * @since 1.1.0
 * @param {Page} page The page to describe.
 * @return {PageHelp} Its description and tips.
 */
export function getPageHelp( page: Page ): PageHelp {
	const notBuiltYet = ( description: string ): PageHelp => ( {
		description,
		tips: [
			__(
				'This module is not built yet — nothing here to manage for now.',
				'purecart'
			),
		],
	} );

	const help: Record< Page, PageHelp > = {
		'overview': notBuiltYet(
			__( 'A store-wide summary of revenue, licenses, subscriptions and downloads.', 'purecart' )
		),
		'licenses': {
			description: __(
				'Every license key PureCart has issued, with its plan, activation count and expiry.',
				'purecart'
			),
			tips: [
				__(
					'Row actions extend expiry, reset activations, suspend, reinstate, revoke or duplicate a key.',
					'purecart'
				),
				__(
					'Revoking is permanent: it stops that key\'s updates and activation checks immediately.',
					'purecart'
				),
			],
		},
		'license-detail': {
			description: __(
				'One license — the domains it is activated on, its JWT token status, and every action available for it.',
				'purecart'
			),
			tips: [
				__(
					'Resetting activations clears every activated site; the customer re-activates each domain afterwards.',
					'purecart'
				),
			],
		},
		'license-summary': {
			description: __(
				'Licensing totals: keys issued per day, and the split by plan, status and product.',
				'purecart'
			),
			tips: [
				__( 'Counts cover every license in the store, not a filtered view.', 'purecart' ),
			],
		},
		'downloads': {
			description: __(
				'The download log — which file each signed token served, to whom, and whether the attempt succeeded.',
				'purecart'
			),
			tips: [
				__( 'Regenerate a token when a customer\'s download link has expired.', 'purecart' ),
				__( 'Select rows to revoke several tokens at once.', 'purecart' ),
			],
		},
		'updates': {
			description: __(
				'Package versions per product, channel and platform — what your customers\' update checks are served.',
				'purecart'
			),
			tips: [
				__( 'Upload a release as a draft, then publish it when it is ready to ship.', 'purecart' ),
				__( 'A rollback re-serves an earlier version to everyone still on the bad one.', 'purecart' ),
			],
		},
		'subscriptions': {
			description: __(
				'Recurring and split-payment plans, their billing schedule, next payment and delivery type.',
				'purecart'
			),
			tips: [
				__(
					'Row actions pause, resume, skip, renew early, retry a failed payment, change plan or cancel.',
					'purecart'
				),
				__( 'Past due means a renewal charge failed — retry it, or ask for a new card.', 'purecart' ),
			],
		},
		'subscription-detail': {
			description: __(
				'One subscription, tab by tab: overview, its delivery type, payment log, status history, emails sent and retention.',
				'purecart'
			),
			tips: [
				__(
					'The delivery-type tab shows what the plan actually grants — a license, a SaaS account, a membership role, and so on.',
					'purecart'
				),
			],
		},
		'subscription-analytics': {
			description: __(
				'Subscription performance: MRR, churn, retention and revenue goals.',
				'purecart'
			),
			tips: [
				__( 'Figures cover every subscription, independent of the list page\'s filters.', 'purecart' ),
			],
		},
		'saas-accounts': {
			description: __(
				'Accounts provisioned by completed PureCart SaaS orders, with their plan, masked API key and status.',
				'purecart'
			),
			tips: [
				__( 'Suspend keeps an account\'s data but blocks its API calls; activate restores it.', 'purecart' ),
				__(
					'Rotating an API key invalidates the old one at once — the customer must update their integration.',
					'purecart'
				),
				__( 'The webhook URL, secret and JWT expiry live in Settings → SaaS.', 'purecart' ),
			],
		},
		'affiliates': notBuiltYet(
			__( 'Referral tracking, commissions, payouts and affiliate performance.', 'purecart' )
		),
		'abandoned-cart': notBuiltYet(
			__( 'Recovery emails and conversion analytics for carts left behind.', 'purecart' )
		),
		'security': notBuiltYet(
			__( 'Download-abuse detection, rate limiting, fraud alerts and admin audit logs.', 'purecart' )
		),
		'analytics': notBuiltYet(
			__( 'Cross-module reporting in one dashboard: revenue, churn, downloads and customer value.', 'purecart' )
		),
		'settings': {
			description: __(
				'Configuration for each PureCart module — licensing, downloads, updates, subscriptions and SaaS.',
				'purecart'
			),
			tips: [
				__(
					'The Modules tab\'s toggles are display-only for now — they do not switch a module off yet.',
					'purecart'
				),
				__( 'Each tab has its own URL, so a settings screen can be linked to directly.', 'purecart' ),
			],
		},
	};

	return help[ page ];
}
