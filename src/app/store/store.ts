import { configureStore } from '@reduxjs/toolkit';
import { subscriptionsReducer } from '@/modules/subscriptions';
import { updatesReducer } from '@/modules/updates';
import { licensesReducer } from '@/modules/licenses';

export const store = configureStore( {
	reducer: {
		subscriptions: subscriptionsReducer,
		updates: updatesReducer,
		licenses: licensesReducer,
	},
} );

export type RootState  = ReturnType< typeof store.getState >;
export type AppDispatch = typeof store.dispatch;
