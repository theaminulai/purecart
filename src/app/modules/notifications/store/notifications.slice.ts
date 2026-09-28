/**
 * Notifications Redux slice.
 *
 * Holds the derived feed, its read state, and when it was last built. The
 * feed is rebuilt wholesale on every load rather than patched: it is a
 * summary of counts that other modules' mutations change indirectly, so
 * there is nothing meaningful to merge into.
 *
 * Read state is seeded from localStorage here and written back by
 * NotificationsMenu — reducers stay pure, and there is exactly one place
 * that touches storage on the way out.
 *
 * @file
 * @since 1.1.0
 */

import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { fetchNotificationSignals } from '../api';
import { buildNotifications, loadReadNotificationIds } from '../utils';
import type { NotificationFeed, NotificationItem } from '../types';

interface NotificationsState {
	items: NotificationItem[];
	/** IDs the admin has already seen; pruned to the current feed on each load. */
	readIds: string[];
	partial: boolean;
	status: 'idle' | 'loading' | 'succeeded' | 'failed';
	error: string | null;
	/** Epoch ms of the last successful load, for the staleness check on open. */
	lastLoadedAt: number | null;
}

const initialState: NotificationsState = {
	items: [],
	readIds: loadReadNotificationIds(),
	partial: false,
	status: 'idle',
	error: null,
	lastLoadedAt: null,
};

/**
 * Fetches every source count and rebuilds the feed from it.
 *
 * @since 1.1.0
 */
export const loadNotifications = createAsyncThunk< NotificationFeed, void, { rejectValue: string } >(
	'notifications/loadNotifications',
	async ( _arg, { rejectWithValue } ) => {
		try {
			const { signals, partial } = await fetchNotificationSignals();
			return { items: buildNotifications( signals ), partial };
		} catch ( error ) {
			const message =
				error && 'object' === typeof error && 'message' in error
					? String( ( error as { message: unknown } ).message )
					: 'Failed to load notifications';
			return rejectWithValue( message );
		}
	}
);

const notificationsSlice = createSlice( {
	name: 'notifications',
	initialState,
	reducers: {
		markNotificationRead( state, action: PayloadAction< string > ) {
			if ( ! state.readIds.includes( action.payload ) ) {
				state.readIds.push( action.payload );
			}
		},
		markAllNotificationsRead( state ) {
			state.readIds = state.items.map( ( item ) => item.id );
		},
	},
	extraReducers: ( builder ) => {
		builder
			.addCase( loadNotifications.pending, ( state ) => {
				state.status = 'loading';
				state.error = null;
			} )
			.addCase( loadNotifications.fulfilled, ( state, action ) => {
				state.status = 'succeeded';
				state.items = action.payload.items;
				state.partial = action.payload.partial;
				state.lastLoadedAt = Date.now();
				// Drop read IDs whose notification is gone: should that exact
				// count ever come back, it is news again rather than something
				// silently pre-read, and storage doesn't grow forever.
				const liveIds = new Set( action.payload.items.map( ( item ) => item.id ) );
				state.readIds = state.readIds.filter( ( id ) => liveIds.has( id ) );
			} )
			.addCase( loadNotifications.rejected, ( state, action ) => {
				state.status = 'failed';
				state.error = action.payload ?? 'Failed to load notifications';
			} );
	},
} );

export const { markNotificationRead, markAllNotificationsRead } = notificationsSlice.actions;

export default notificationsSlice.reducer;
