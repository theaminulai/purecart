/**
 * SaaS Accounts Redux slice.
 *
 * Server-driven pagination, same shape as the Licenses and Downloads
 * slices: one GET /saas-accounts per (filters, page, perPage) change, and
 * every mutation re-dispatches that load rather than patching a row
 * optimistically — suspend/activate/rotate each fire a webhook to the
 * merchant's SaaS backend, so showing the row the server actually confirmed
 * is worth the extra round trip.
 *
 * KPI stats live in their own thunk because they come from their own
 * endpoint (GET /saas-accounts/stats) — unlike Licenses/Downloads, whose
 * list endpoints bundle stats into the list response.
 *
 * @file
 * @since 1.0.0
 */

import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import {
	fetchSaasAccounts,
	fetchSaasStats,
	suspendSaasAccount as apiSuspendSaasAccount,
	activateSaasAccount as apiActivateSaasAccount,
	rotateSaasApiKey as apiRotateSaasApiKey,
} from '../api';
import type {
	SaasAccountRecord,
	SaasAccountQueryParams,
	SaasAccountStatus,
	SaasStats,
} from '../types';

export interface SaasAccountFilters {
	search: string;
	status: SaasAccountStatus | 'All';
	plan: string | 'All';
	productId: number | 'All';
}

export const DEFAULT_SAAS_FILTERS: SaasAccountFilters = {
	search: '',
	status: 'All',
	plan: 'All',
	productId: 'All',
};

export const DEFAULT_SAAS_STATS: SaasStats = {
	total: 0,
	active: 0,
	suspended: 0,
	cancelled: 0,
	provisionedToday: 0,
	topPlans: [],
};

interface SaasAccountsState {
	items: SaasAccountRecord[];
	stats: SaasStats;
	total: number;
	totalPages: number;
	page: number;
	perPage: number;
	filters: SaasAccountFilters;
	status: 'idle' | 'loading' | 'succeeded' | 'failed';
	error: string | null;
}

const initialState: SaasAccountsState = {
	items: [],
	stats: DEFAULT_SAAS_STATS,
	total: 0,
	totalPages: 1,
	page: 1,
	perPage: 20,
	filters: DEFAULT_SAAS_FILTERS,
	status: 'idle',
	error: null,
};

/**
 * shared/api/client.ts rejects with a normalized `ApiError` — a plain
 * `{ message, code }` object, not an `Error` instance — so an
 * `err instanceof Error` check would throw away the message the REST
 * endpoint actually sent (e.g. the 409 "Account already in that state."
 * that suspend/activate return, which the UI surfaces verbatim in a toast).
 *
 * @param err      The rejected value from a shared/api call.
 * @param fallback Message to use when the rejection carries none.
 */
function toErrorMessage( err: unknown, fallback: string ): string {
	if ( err && 'object' === typeof err && 'message' in err ) {
		const { message } = err as { message: unknown };
		if ( 'string' === typeof message && '' !== message ) {
			return message;
		}
	}
	return fallback;
}

/**
 * Loads one page of accounts, merging any explicit params over the current
 * filters/page/perPage in state — the same "explicit override, else current
 * state" merge the Licenses and Downloads load thunks use, so a caller can
 * re-fetch with just the one filter that changed.
 */
export const loadSaasAccounts = createAsyncThunk(
	'saasAccounts/loadSaasAccounts',
	async ( params: SaasAccountQueryParams = {}, { getState, rejectWithValue } ) => {
		try {
			const state = getState() as { saasAccounts: SaasAccountsState };
			const merged: SaasAccountQueryParams = {
				page: params.page ?? state.saasAccounts.page,
				perPage: params.perPage ?? state.saasAccounts.perPage,
				search: params.search ?? state.saasAccounts.filters.search,
				status: params.status ?? state.saasAccounts.filters.status,
				plan: params.plan ?? state.saasAccounts.filters.plan,
				productId: params.productId ?? state.saasAccounts.filters.productId,
			};
			return await fetchSaasAccounts( merged );
		} catch ( err: unknown ) {
			return rejectWithValue( toErrorMessage( err, 'Failed to load SaaS accounts' ) );
		}
	}
);

export const loadSaasStats = createAsyncThunk(
	'saasAccounts/loadSaasStats',
	async ( _arg: void, { rejectWithValue } ) => {
		try {
			return await fetchSaasStats();
		} catch ( err: unknown ) {
			return rejectWithValue( toErrorMessage( err, 'Failed to load SaaS stats' ) );
		}
	}
);

/**
 * Shared body for every row-action thunk: call the API, then re-fetch both
 * the current page and the KPI stats (suspend/activate move an account
 * between status counters, so the strip is stale otherwise).
 *
 * @param name          Redux action type prefix.
 * @param call          The api.ts function this thunk wraps.
 * @param fallbackError Message used when the rejection carries none.
 */
function mutationThunk(
	name: string,
	call: ( id: number ) => Promise< SaasAccountRecord >,
	fallbackError: string
) {
	return createAsyncThunk( name, async ( id: number, { dispatch, rejectWithValue } ) => {
		try {
			const account = await call( id );
			dispatch( loadSaasAccounts( {} ) );
			dispatch( loadSaasStats() );
			return account;
		} catch ( err: unknown ) {
			return rejectWithValue( toErrorMessage( err, fallbackError ) );
		}
	} );
}

export const suspendSaasAccountThunk = mutationThunk(
	'saasAccounts/suspend',
	( id ) => apiSuspendSaasAccount( id ),
	'Could not suspend this account'
);

export const activateSaasAccountThunk = mutationThunk(
	'saasAccounts/activate',
	( id ) => apiActivateSaasAccount( id ),
	'Could not activate this account'
);

export const rotateSaasApiKeyThunk = mutationThunk(
	'saasAccounts/rotateKey',
	( id ) => apiRotateSaasApiKey( id ),
	'Could not rotate the API key'
);

export const saasAccountsSlice = createSlice( {
	name: 'saasAccounts',
	initialState,
	reducers: {
		setSearch( state, action: PayloadAction< string > ) {
			state.filters.search = action.payload;
			state.page = 1;
		},
		setStatusFilter( state, action: PayloadAction< SaasAccountStatus | 'All' > ) {
			state.filters.status = action.payload;
			state.page = 1;
		},
		setPlanFilter( state, action: PayloadAction< string | 'All' > ) {
			state.filters.plan = action.payload;
			state.page = 1;
		},
		setProductIdFilter( state, action: PayloadAction< number | 'All' > ) {
			state.filters.productId = action.payload;
			state.page = 1;
		},
		clearFilters( state ) {
			state.filters = DEFAULT_SAAS_FILTERS;
			state.page = 1;
		},
		setPage( state, action: PayloadAction< number > ) {
			state.page = action.payload;
		},
		setPerPage( state, action: PayloadAction< number > ) {
			state.perPage = action.payload;
			state.page = 1;
		},
	},
	extraReducers: ( builder ) => {
		builder
			.addCase( loadSaasAccounts.pending, ( state ) => {
				state.status = 'loading';
				state.error = null;
			} )
			.addCase( loadSaasAccounts.fulfilled, ( state, action ) => {
				state.status = 'succeeded';
				state.items = action.payload.data;
				state.total = action.payload.total;
				state.totalPages = action.payload.totalPages;
			} )
			.addCase( loadSaasAccounts.rejected, ( state, action ) => {
				state.status = 'failed';
				state.error = action.payload as string;
			} )
			// A failed stats call is not a page-level failure — the table
			// still renders; only the KPI strip keeps its last known values.
			.addCase( loadSaasStats.fulfilled, ( state, action ) => {
				state.stats = action.payload;
			} );
	},
} );

export const {
	setSearch,
	setStatusFilter,
	setPlanFilter,
	setProductIdFilter,
	clearFilters,
	setPage,
	setPerPage,
} = saasAccountsSlice.actions;

export default saasAccountsSlice.reducer;
