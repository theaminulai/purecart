import { configureStore } from '@reduxjs/toolkit';
import { subscriptionsReducer } from '@/modules/subscriptions';
import { updatesReducer } from '@/modules/updates';
import { downloadsReducer } from '@/modules/downloads';

export const store = configureStore( {
	reducer: {
		subscriptions: subscriptionsReducer,
		updates: updatesReducer,
		downloads: downloadsReducer,
	},
} );

export type RootState  = ReturnType< typeof store.getState >;
export type AppDispatch = typeof store.dispatch;
