/**
 * Named selectors for the notifications slice.
 *
 * @file
 * @since 1.1.0
 */
import type { RootState } from '@/app/store/store';

export const selectNotificationItems = ( state: RootState ) => state.notifications.items;
export const selectNotificationReadIds = ( state: RootState ) => state.notifications.readIds;
export const selectNotificationStatus = ( state: RootState ) => state.notifications.status;
export const selectNotificationError = ( state: RootState ) => state.notifications.error;
export const selectNotificationsPartial = ( state: RootState ) => state.notifications.partial;
export const selectNotificationsLastLoadedAt = ( state: RootState ) =>
	state.notifications.lastLoadedAt;

/**
 * How many notifications the admin hasn't seen yet — the number on the bell.
 *
 * @param state Root Redux state.
 */
export const selectUnreadNotificationCount = ( state: RootState ) =>
	state.notifications.items.filter(
		( item ) => ! state.notifications.readIds.includes( item.id )
	).length;
