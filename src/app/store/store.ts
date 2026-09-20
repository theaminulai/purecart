import { configureStore } from '@reduxjs/toolkit';
import { subscriptionsReducer } from '@/modules/subscriptions';
import { updatesReducer } from '@/modules/updates';

export const store = configureStore( {
	reducer: {
		subscriptions: subscriptionsReducer,
		updates: updatesReducer,
	},
} );

export type RootState  = ReturnType< typeof store.getState >;
export type AppDispatch = typeof store.dispatch;
