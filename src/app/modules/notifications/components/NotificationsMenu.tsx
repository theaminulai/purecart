/**
 * NotificationsMenu component.
 *
 * The top bar's bell: owns the feed's loading, its read state, and what a
 * row click does. Rendered by the composition root and passed into TopBar,
 * because `shared/` chrome may not import a module
 * (DEVELOPMENT_GUIDELINES.md §1) and this feed is built from module data.
 *
 * @file
 * @since 1.1.0
 */
import { useEffect } from 'react';
import { Bell } from 'lucide-react';
import { __ } from '@wordpress/i18n';
import { AnchoredMenu, IconButton } from '@/shared/ui';
import type { Page } from '@/shared/types/page';
import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import { NotificationsPanel } from './NotificationsPanel';
import {
	loadNotifications,
	markAllNotificationsRead,
	markNotificationRead,
} from '../store/notifications.slice';
import {
	selectNotificationError,
	selectNotificationItems,
	selectNotificationReadIds,
	selectNotificationStatus,
	selectNotificationsLastLoadedAt,
	selectNotificationsPartial,
	selectUnreadNotificationCount,
} from '../store/notifications.selectors';
import { persistReadNotificationIds } from '../utils';

/**
 * How long a loaded feed is trusted before opening the bell refetches it.
 * Long enough that clicking the bell twice doesn't re-query four endpoints,
 * short enough that an admin working through past-due renewals sees the
 * count fall as they clear them.
 */
const STALE_AFTER_MS = 2 * 60 * 1000;

/**
 * Renders the bell button and its notifications panel.
 *
 * @since 1.1.0
 *
 * @param {Object}   props       Component props.
 * @param {Function} props.onNav Navigates the SPA to a page when a row is clicked.
 *
 * @return {JSX.Element} The bell and its menu.
 */
export function NotificationsMenu( { onNav }: { onNav: ( p: Page ) => void } ) {
	const dispatch = useAppDispatch();
	const items = useAppSelector( selectNotificationItems );
	const readIds = useAppSelector( selectNotificationReadIds );
	const status = useAppSelector( selectNotificationStatus );
	const error = useAppSelector( selectNotificationError );
	const partial = useAppSelector( selectNotificationsPartial );
	const lastLoadedAt = useAppSelector( selectNotificationsLastLoadedAt );
	const unreadCount = useAppSelector( selectUnreadNotificationCount );

	useEffect( () => {
		if ( 'idle' === status ) {
			dispatch( loadNotifications() );
		}
	}, [ dispatch, status ] );

	// The one place read state reaches storage — reducers stay pure, and
	// every path that changes it (one row, or "Mark all read") is covered.
	useEffect( () => {
		persistReadNotificationIds( readIds );
	}, [ readIds ] );

	const refreshIfStale = () => {
		if ( 'loading' === status ) return;
		if ( null === lastLoadedAt || Date.now() - lastLoadedAt > STALE_AFTER_MS ) {
			dispatch( loadNotifications() );
		}
	};

	return (
		<AnchoredMenu
			panelWidth={ 380 }
			label={ __( 'Notifications', 'purecart' ) }
			onOpen={ refreshIfStale }
			trigger={ ( open ) => (
				<IconButton
					icon={ Bell }
					title={ __( 'Notifications', 'purecart' ) }
					active={ open }
					badgeCount={ unreadCount }
				/>
			) }
		>
			{ ( { close } ) => (
				<NotificationsPanel
					items={ items }
					readIds={ readIds }
					status={ status }
					error={ error }
					partial={ partial }
					onMarkAllRead={ () => dispatch( markAllNotificationsRead() ) }
					onSelect={ ( item ) => {
						dispatch( markNotificationRead( item.id ) );
						onNav( item.page );
						close();
					} }
				/>
			) }
		</AnchoredMenu>
	);
}
