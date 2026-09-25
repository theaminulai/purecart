/**
 * Named selectors for the SaaS Accounts slice.
 *
 * @file
 * @since 1.0.0
 */
import type { RootState } from '@/app/store/store';

export const selectSaasAccountItems = ( state: RootState ) => state.saasAccounts.items;
export const selectSaasStats = ( state: RootState ) => state.saasAccounts.stats;
export const selectSaasFilters = ( state: RootState ) => state.saasAccounts.filters;
export const selectSaasLoadStatus = ( state: RootState ) => state.saasAccounts.status;
export const selectSaasError = ( state: RootState ) => state.saasAccounts.error;
export const selectSaasPage = ( state: RootState ) => state.saasAccounts.page;
export const selectSaasTotal = ( state: RootState ) => state.saasAccounts.total;
export const selectSaasTotalPages = ( state: RootState ) => state.saasAccounts.totalPages;

/**
 * One account from the page currently in state, for the detail panel.
 *
 * Returns null once that account leaves the loaded page (a re-fetch after
 * a filter change, say) — the panel closes itself rather than showing a
 * stale row.
 *
 * @param state Root Redux state.
 * @param id    Account row ID, or null when no row is selected.
 */
export const selectSaasAccountById = ( state: RootState, id: number | null ) =>
	null === id ? null : state.saasAccounts.items.find( ( account ) => account.id === id ) ?? null;
