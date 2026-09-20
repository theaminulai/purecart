/**
 * StatusBadge UI component.
 *
 * Renders a colored pill badge representing a record status value. Maps known
 * status strings to M3 color pairs. Falls back to a neutral 'Pending' style
 * for unrecognized status values.
 *
 * @file
 * @since 1.0.0
 */
import { __ } from '@wordpress/i18n';
import { M3 } from '@/theme';

/**
 * Renders a small rounded pill badge for a given status string.
 *
 * Recognized status values: active, expired, suspended, revoked, paused,
 * cancelled, past_due (alias: past-due), pending_reauth, pending_cancel,
 * completed, trialing, pending. Unrecognized values fall back to the
 * pending style.
 *
 * @since 1.0.0
 *
 * @param {Object} props        Component props.
 * @param {string} props.status Status string used to determine badge color and label.
 *
 * @return {JSX.Element} A colored pill span element displaying the status label.
 */
export function StatusBadge( { status }: { status: string } ) {
	const styles: Record<
		string,
		{ bg: string; text: string; label: string }
	> = {
		active: { bg: '#C2E7A0', text: M3.success, label: __( 'Active', 'purecart' ) },
		// 'expired' is intentionally neutral gray, not error-red, for
		// subscriptions - it's a terminal non-error state (fixed-length
		// subscription ran its course), unlike a license expiry.
		expired: {
			bg: M3.surfaceContainerHigh,
			text: M3.onSurfaceVariant,
			label: __( 'Expired', 'purecart' ),
		},
		suspended: { bg: '#FFDEA5', text: '#5C4200', label: __( 'Suspended', 'purecart' ) },
		revoked: {
			bg: M3.surfaceContainerHigh,
			text: M3.onSurfaceVariant,
			label: __( 'Revoked', 'purecart' ),
		},
		paused: { bg: '#C8E6FF', text: M3.info, label: __( 'Paused', 'purecart' ) },
		cancelled: { bg: '#FFDAD6', text: M3.error, label: __( 'Cancelled', 'purecart' ) },
		// Backend enum uses underscores - 'past-due' kept as an alias so any
		// other, non-subscription caller still using the old hyphenated form
		// keeps working.
		past_due: { bg: '#FFDEA5', text: '#5C4200', label: __( 'Past Due', 'purecart' ) },
		'past-due': { bg: '#FFDEA5', text: '#5C4200', label: __( 'Past Due', 'purecart' ) },
		pending_reauth: {
			bg: M3.infoContainer,
			text: M3.info,
			label: __( 'Reauth Needed', 'purecart' ),
		},
		pending_cancel: {
			bg: '#FFDEA5',
			text: '#5C4200',
			label: __( 'Cancels Soon', 'purecart' ),
		},
		completed: { bg: M3.infoContainer, text: M3.info, label: __( 'Completed', 'purecart' ) },
		trialing: {
			bg: M3.primaryContainer,
			text: M3.onPrimaryContainer,
			label: __( 'Trialing', 'purecart' ),
		},
		pending: {
			bg: M3.surfaceContainer,
			text: M3.onSurfaceVariant,
			label: __( 'Pending', 'purecart' ),
		},
	};
	const s = styles[ status ] ?? styles.pending;
	return (
		<span
			className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
			style={ {
				backgroundColor: s.bg,
				color: s.text,
				fontFamily: 'Roboto, sans-serif',
			} }
		>
			{ s.label }
		</span>
	);
}
