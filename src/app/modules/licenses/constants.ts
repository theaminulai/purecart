/**
 * Shared display helpers for the Licenses module.
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
import { M3 } from '@/theme';
import type { LicensePlanType, LicenseEnvironment } from './types';

/** Display label for a license plan type. */
export function planLabel( planType: LicensePlanType | string ): string {
	switch ( planType ) {
		case 'single': return __( 'Single', 'purecart' );
		case 'multi': return __( 'Multi', 'purecart' );
		case 'unlimited': return __( 'Unlimited', 'purecart' );
		case 'lifetime': return __( 'Lifetime', 'purecart' );
		default: return planType;
	}
}

/** Display label for an activation's declared environment. */
export function environmentLabel( environment: LicenseEnvironment | string ): string {
	switch ( environment ) {
		case 'production': return __( 'Production', 'purecart' );
		case 'staging': return __( 'Staging', 'purecart' );
		case 'local': return __( 'Local', 'purecart' );
		default: return environment;
	}
}

/** Badge colors for an activation's declared environment. */
export function environmentBadgeStyle( environment: LicenseEnvironment | string ): { bg: string; color: string } {
	switch ( environment ) {
		case 'production': return { bg: '#C2E7A0', color: M3.success };
		case 'staging': return { bg: '#FFDEA5', color: '#5C4200' };
		default: return { bg: M3.surfaceContainerHigh, color: M3.onSurfaceVariant };
	}
}
