import { configureStore } from '@reduxjs/toolkit';
import subscriptionsReducer from './slices/subscriptionsSlice';
import updatesReducer from './slices/updatesSlice';

export const store = configureStore( {
	reducer: {
		subscriptions: subscriptionsReducer,
		updates: updatesReducer,
	},
} );

export type RootState  = ReturnType< typeof store.getState >;
export type AppDispatch = typeof store.dispatch;
