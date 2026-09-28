/**
 * NotificationRow component.
 *
 * One row of the notifications panel: a severity-tinted icon, the summary
 * line, a sentence of context, and an unread dot. The whole row is the
 * button — clicking it opens the page the notification is about.
 *
 * @file
 * @since 1.1.0
 */
import { CreditCard, KeyRound, ServerCog, ShieldAlert } from 'lucide-react';
import { M3 } from '@/theme';
import type { NotificationItem, NotificationKind, NotificationSeverity } from '../types';

const KIND_ICONS: Record< NotificationKind, React.ElementType > = {
	'subscriptions-past-due': CreditCard,
	'subscriptions-pending-reauth': ShieldAlert,
	'licenses-expiring': KeyRound,
	'saas-accounts-suspended': ServerCog,
};

const SEVERITY_COLORS: Record< NotificationSeverity, { fg: string; bg: string } > = {
	critical: { fg: M3.error, bg: M3.errorContainer },
	warning: { fg: M3.warning, bg: M3.warningContainer },
	info: { fg: M3.info, bg: M3.infoContainer },
};

/**
 * Renders one notification.
 *
 * @since 1.1.0
 *
 * @param {Object}           props          Component props.
 * @param {NotificationItem} props.item     The notification to render.
 * @param {boolean}          props.unread   Shows the unread dot and a tinted background.
 * @param {Function}         props.onSelect Called when the row is clicked.
 *
 * @return {JSX.Element} The row element.
 */
export function NotificationRow( {
	item,
	unread,
	onSelect,
}: {
	item: NotificationItem;
	unread: boolean;
	onSelect: () => void;
} ) {
	const Icon = KIND_ICONS[ item.kind ];
	const colors = SEVERITY_COLORS[ item.severity ];
	const restingBackground = unread ? M3.surfaceContainerLow : 'transparent';

	return (
		<button
			type="button"
			onClick={ onSelect }
			className="flex items-start gap-3 w-full px-4 py-3 text-left transition-colors"
			style={ {
				background: restingBackground,
				border: 'none',
				borderBottom: `1px solid ${ M3.outlineVariant }`,
				cursor: 'pointer',
				fontFamily: 'Roboto, sans-serif',
			} }
			onMouseEnter={ ( e ) => {
				e.currentTarget.style.backgroundColor = M3.surfaceContainerHigh;
			} }
			onMouseLeave={ ( e ) => {
				e.currentTarget.style.backgroundColor = restingBackground;
			} }
		>
			<span
				className="flex items-center justify-center rounded-full flex-shrink-0"
				style={ { width: 32, height: 32, backgroundColor: colors.bg } }
			>
				<Icon size={ 16 } color={ colors.fg } />
			</span>

			<span className="flex-1 min-w-0">
				<span
					className="block text-sm"
					style={ { color: M3.onSurface, fontWeight: unread ? 500 : 400 } }
				>
					{ item.title }
				</span>
				<span className="block text-xs mt-0.5" style={ { color: M3.onSurfaceVariant } }>
					{ item.body }
				</span>
			</span>

			{ unread && (
				<span
					className="rounded-full flex-shrink-0 mt-1.5"
					style={ { width: 8, height: 8, backgroundColor: M3.primary } }
				/>
			) }
		</button>
	);
}
