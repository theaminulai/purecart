/**
 * Named selectors for the Subscriptions slice — see DEVELOPMENT_GUIDELINES.md
 * §11 (write the selector once, name it for what it returns, reuse it instead
 * of repeating inline `useAppSelector` lambdas across components/modules).
 *
 * @file
 * @since 1.1.0
 */
import type { RootState } from '@/app/store/store';

export const selectSubscriptionItems = ( state: RootState ) => state.subscriptions.items;
export const selectSubscriptionStatus = ( state: RootState ) => state.subscriptions.status;
export const selectSubscriptionFilters = ( state: RootState ) => state.subscriptions.filters;
export const selectSubscriptionPage = ( state: RootState ) => state.subscriptions.page;
export const selectSubscriptionPerPage = ( state: RootState ) => state.subscriptions.perPage;

export const selectSubscriptionById = ( state: RootState, id: string | undefined ) =>
	id ? state.subscriptions.items.find( ( r ) => r.id === id ) : undefined;
