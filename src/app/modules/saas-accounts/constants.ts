/**
 * Shared display helpers for the SaaS Accounts module.
 *
 * Functions, not module-level constant objects — `__()` calls inside a
 * top-level object literal would evaluate at import time, before
 * WordPress's locale data is registered, and silently ship untranslated
 * strings (see shared/layout/nav-schema.ts's docblock for the same pitfall
 * already documented there). Calling these inside a component's render
 * instead evaluates `__()` at a safe time.
 *
 * @file
 * @since 1.0.0
 */
import { __ } from '@wordpress/i18n';
import type { SaasAccountStatus } from './types';

/**
 * Display label for a plan identifier.
 *
 * Plans are free-form here, not an enum: the value comes from each
 * product's `_purecart_saas_plan` meta (AccountProvisioner::create_account()
 * falls back to 'starter'), so a merchant can name a tier anything. The
 * three tiers below are the ones PureCart's own docs use and are worth
 * translating; anything else is title-cased from its slug rather than shown
 * raw.
 */
export function saasPlanLabel( plan: string ): string {
	switch ( plan ) {
		case 'starter': return __( 'Starter', 'purecart' );
		case 'pro': return __( 'Pro', 'purecart' );
		case 'enterprise': return __( 'Enterprise', 'purecart' );
		default:
			return plan
				.split( /[-_\s]+/ )
				.filter( Boolean )
				.map( ( word ) => word.charAt( 0 ).toUpperCase() + word.slice( 1 ) )
				.join( ' ' );
	}
}

/** Display label for a SaaS account's lifecycle status. */
export function saasStatusLabel( status: SaasAccountStatus | string ): string {
	switch ( status ) {
		case 'active': return __( 'Active', 'purecart' );
		case 'suspended': return __( 'Suspended', 'purecart' );
		case 'cancelled': return __( 'Cancelled', 'purecart' );
		default: return status;
	}
}

/**
 * Formats a `provisioned_at` timestamp for display.
 *
 * The backend sends a MySQL datetime in the site's timezone, not an ISO
 * string — `new Date('2026-09-25 14:30:00')` is only reliably parsed once
 * the space becomes a 'T', so it is normalized here, and the raw value is
 * returned untouched if it still won't parse.
 *
 * @param value The raw `provisioned_at` value from the REST response.
 */
export function formatProvisionedAt( value: string ): string {
	if ( ! value ) {
		return '—';
	}
	const parsed = new Date( value.replace( ' ', 'T' ) );
	return Number.isNaN( parsed.getTime() ) ? value : parsed.toLocaleString();
}
