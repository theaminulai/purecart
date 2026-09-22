/**
 * JwtTokenStatusChip component.
 *
 * Displays a license's JWT access-token status as a colored pill: valid,
 * expired, or none-issued-yet. Per docs/RND-frontend-license-manager.md's
 * spec, minus the "revoked" state — the backend's token-status query
 * (API\Licenses::jwt_status()) reports the *latest* token per type, and a
 * revoked token is simply not the latest once a fresh one is issued, so the
 * two observable states from that query are valid/expired plus "none".
 *
 * @file
 * @since 1.0.0
 */
import { ShieldCheck, ShieldOff, ShieldQuestion } from 'lucide-react';
import { __ } from '@wordpress/i18n';
import { M3 } from '@/theme';
import type { JwtTokenStatus } from '../../types';

/**
 * Renders a pill summarizing a license's current JWT access-token status.
 *
 * @since 1.0.0
 */
export function JwtTokenStatusChip( { status }: { status: JwtTokenStatus } ) {
	let bg: string;
	let color: string;
	let label: string;
	let Icon: React.ElementType;

	if ( ! status.accessTokenExpiresAt ) {
		bg = M3.surfaceContainerHigh;
		color = M3.onSurfaceVariant;
		label = __( 'No token issued', 'purecart' );
		Icon = ShieldQuestion;
	} else if ( status.accessTokenActive ) {
		bg = '#C2E7A0';
		color = M3.success;
		label = __( 'Valid', 'purecart' );
		Icon = ShieldCheck;
	} else {
		bg = '#FFDAD6';
		color = M3.error;
		label = __( 'Expired', 'purecart' );
		Icon = ShieldOff;
	}

	return (
		<span
			className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
			style={ { backgroundColor: bg, color, fontFamily: 'Roboto, sans-serif' } }
		>
			<Icon size={ 12 } />
			{ label }
		</span>
	);
}
