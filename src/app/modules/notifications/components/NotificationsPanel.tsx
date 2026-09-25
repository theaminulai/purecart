/**
 * NotificationsPanel component.
 *
 * The body of the bell menu: header with a "Mark all read" action, the rows,
 * and the loading / empty / error / partial states the derived feed can be in.
 * Presentational — NotificationsMenu owns the data and the dispatching.
 *
 * @file
 * @since 1.1.0
 */
import { BellOff } from 'lucide-react';
import { __ } from '@wordpress/i18n';
import { M3 } from '@/theme';
import { Skeleton, TextButton } from '@/shared/ui';
import { NotificationRow } from './NotificationRow';
import type { NotificationItem } from '../types';

/**
 * Renders the notifications panel.
 *
 * @since 1.1.0
 *
 * @param {Object}             props               Component props.
 * @param {NotificationItem[]} props.items         Rows to render, already ordered by severity.
 * @param {string[]}           props.readIds       IDs the admin has already seen.
 * @param {string}             props.status        Load status of the feed.
 * @param {string|null}        props.error         Error message when the load failed.
 * @param {boolean}            props.partial       True when a source failed and the feed is incomplete.
 * @param {Function}           props.onSelect      Called with a notification when its row is clicked.
 * @param {Function}           props.onMarkAllRead Called when "Mark all read" is clicked.
 *
 * @return {JSX.Element} The panel contents.
 */
export function NotificationsPanel( {
	items,
	readIds,
	status,
	error,
	partial,
	onSelect,
	onMarkAllRead,
}: {
	items: NotificationItem[];
	readIds: string[];
	status: 'idle' | 'loading' | 'succeeded' | 'failed';
	error: string | null;
	partial: boolean;
	onSelect: ( item: NotificationItem ) => void;
	onMarkAllRead: () => void;
} ) {
	const hasUnread = items.some( ( item ) => ! readIds.includes( item.id ) );
	// A refresh of an already-populated panel updates in place rather than
	// flashing skeletons over rows that are still on screen.
	const isFirstLoad = 'loading' === status && 0 === items.length;

	return (
		<>
			<div
				className="flex items-center justify-between px-4 py-2.5 flex-shrink-0"
				style={ {
					backgroundColor: M3.surfaceContainerLow,
					borderBottom: `1px solid ${ M3.outlineVariant }`,
				} }
			>
				<span
					className="text-xs font-medium"
					style={ { color: M3.onSurfaceVariant, fontFamily: 'Roboto, sans-serif' } }
				>
					{ __( 'Notifications', 'purecart' ) }
				</span>
				{ hasUnread && (
					<TextButton onClick={ onMarkAllRead } small>
						{ __( 'Mark all read', 'purecart' ) }
					</TextButton>
				) }
			</div>

			<div className="overflow-y-auto" style={ { overscrollBehavior: 'contain' } }>
				{ isFirstLoad && (
					<div className="px-4 py-3 flex flex-col gap-3">
						<Skeleton height={ 40 } />
						<Skeleton height={ 40 } />
					</div>
				) }

				{ ! isFirstLoad && 'failed' === status && (
					<p
						className="px-4 py-6 text-sm text-center"
						style={ { color: M3.error, fontFamily: 'Roboto, sans-serif', margin: 0 } }
					>
						{ error ?? __( 'Could not load notifications.', 'purecart' ) }
					</p>
				) }

				{ ! isFirstLoad && 'failed' !== status && 0 === items.length && (
					<div className="flex flex-col items-center gap-2 px-4 py-8">
						<BellOff size={ 24 } color={ M3.outline } />
						<p
							className="text-sm text-center"
							style={ {
								color: M3.onSurfaceVariant,
								fontFamily: 'Roboto, sans-serif',
								margin: 0,
							} }
						>
							{ __( 'Nothing needs your attention.', 'purecart' ) }
						</p>
					</div>
				) }

				{ items.map( ( item ) => (
					<NotificationRow
						key={ item.id }
						item={ item }
						unread={ ! readIds.includes( item.id ) }
						onSelect={ () => onSelect( item ) }
					/>
				) ) }

				{ partial && 'failed' !== status && (
					<p
						className="px-4 py-2 text-xs"
						style={ {
							color: M3.onSurfaceVariant,
							fontFamily: 'Roboto, sans-serif',
							margin: 0,
						} }
					>
						{ __( 'Some sources could not be checked, so this list may be incomplete.', 'purecart' ) }
					</p>
				) }
			</div>
		</>
	);
}
