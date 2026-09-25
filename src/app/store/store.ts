import { configureStore } from '@reduxjs/toolkit';
import { subscriptionsReducer } from '@/modules/subscriptions';
import { updatesReducer } from '@/modules/updates';
import { downloadsReducer } from '@/modules/downloads';
import { licensesReducer } from '@/modules/licenses';
import { saasAccountsReducer } from '@/modules/saas-accounts';
import { notificationsReducer } from '@/modules/notifications';

export const store = configureStore( {
	reducer: {
		subscriptions: subscriptionsReducer,
		updates: updatesReducer,
		downloads: downloadsReducer,
		licenses: licensesReducer,
		saasAccounts: saasAccountsReducer,
		notifications: notificationsReducer,
	},
} );

export type RootState  = ReturnType< typeof store.getState >;
export type AppDispatch = typeof store.dispatch;
