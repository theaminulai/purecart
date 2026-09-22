/**
 * Licenses Redux slice.
 *
 * Same server-driven pagination shape as the Updates module's slice: the
 * list, its KPI stats, and pagination all come from one GET /licenses call
 * per (filters, page, perPage) change, re-dispatched after every mutation
 * rather than patched optimistically — license status/expiry/activation
 * counts are security-relevant enough that showing the server's confirmed
 * state is worth the extra round trip.
 *
 * @file
 * @since 1.0.0
 */

import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import {
	fetchLicenses,
	extendLicense as apiExtendLicense,
	suspendLicense as apiSuspendLicense,
	reinstateLicense as apiReinstateLicense,
	revokeLicense as apiRevokeLicense,
	bulkRevokeLicenses as apiBulkRevokeLicenses,
	resetLicenseActivations as apiResetLicenseActivations,
	duplicateLicense as apiDuplicateLicense,
} from '../api';
import type { LicenseRecord, LicenseStats, LicenseQueryParams, LicenseStatus } from '../types';

export interface LicenseFilters {
	search: string;
	status: LicenseStatus | 'All';
	productId: number | 'All';
}

export const DEFAULT_LICENSE_FILTERS: LicenseFilters = {
	search: '',
	status: 'All',
	productId: 'All',
};

export const DEFAULT_LICENSE_STATS: LicenseStats = {
	total: 0,
	active: 0,
	expiring_30d: 0,
	revoked: 0,
};

interface LicensesState {
	items: LicenseRecord[];
	stats: LicenseStats;
	total: number;
	totalPages: number;
	page: number;
	perPage: number;
	filters: LicenseFilters;
	status: 'idle' | 'loading' | 'succeeded' | 'failed';
	error: string | null;
	selectedLicenseId: number | null;
}

const initialState: LicensesState = {
	items: [],
	stats: DEFAULT_LICENSE_STATS,
	total: 0,
	totalPages: 1,
	page: 1,
	perPage: 20,
	filters: DEFAULT_LICENSE_FILTERS,
	status: 'idle',
	error: null,
	selectedLicenseId: null,
};

/**
 * Loads one page of licenses, merging any explicit params over the current
 * filters/page/perPage in state — same "explicit override, else current
 * state" merge the Updates module's loadVersions() thunk uses, so callers
 * can re-fetch with just the one filter that changed.
 */
export const loadLicenses = createAsyncThunk(
	'licenses/loadLicenses',
	async (params: LicenseQueryParams = {}, { getState, rejectWithValue }) => {
		try {
			const state = getState() as { licenses: LicensesState };
			const merged: LicenseQueryParams = {
				page: params.page ?? state.licenses.page,
				perPage: params.perPage ?? state.licenses.perPage,
				search: params.search ?? state.licenses.filters.search,
				status: params.status ?? state.licenses.filters.status,
				productId: params.productId ?? state.licenses.filters.productId,
			};
			return await fetchLicenses(merged);
		} catch (err: unknown) {
			return rejectWithValue(err instanceof Error ? err.message : 'Failed to load licenses');
		}
	}
);

/** Shared body for every mutation thunk below: call the API, then re-fetch the current page. */
function mutationThunk<Arg>(name: string, call: (arg: Arg) => Promise<{ success: boolean; license: LicenseRecord }>) {
	return createAsyncThunk(name, async (arg: Arg, { dispatch, rejectWithValue }) => {
		try {
			const res = await call(arg);
			dispatch(loadLicenses({}));
			return res.license;
		} catch (err: unknown) {
			return rejectWithValue(err instanceof Error ? err.message : 'Action failed');
		}
	});
}

export const extendLicenseThunk = mutationThunk<{ id: number; days: number }>('licenses/extend', ({ id, days }) =>
	apiExtendLicense(id, days)
);
export const suspendLicenseThunk = mutationThunk<number>('licenses/suspend', (id) => apiSuspendLicense(id));
export const reinstateLicenseThunk = mutationThunk<number>('licenses/reinstate', (id) => apiReinstateLicense(id));
export const revokeLicenseThunk = mutationThunk<number>('licenses/revoke', (id) => apiRevokeLicense(id));
export const resetLicenseActivationsThunk = mutationThunk<number>('licenses/resetActivations', (id) =>
	apiResetLicenseActivations(id)
);
export const duplicateLicenseThunk = mutationThunk<number>('licenses/duplicate', (id) => apiDuplicateLicense(id));

export const bulkRevokeLicensesThunk = createAsyncThunk(
	'licenses/bulkRevoke',
	async (ids: number[], { dispatch, rejectWithValue }) => {
		try {
			const res = await apiBulkRevokeLicenses(ids);
			dispatch(loadLicenses({}));
			return res;
		} catch (err: unknown) {
			return rejectWithValue(err instanceof Error ? err.message : 'Bulk revoke failed');
		}
	}
);

export const licensesSlice = createSlice({
	name: 'licenses',
	initialState,
	reducers: {
		setSearch(state, action: PayloadAction<string>) {
			state.filters.search = action.payload;
			state.page = 1;
		},
		setStatusFilter(state, action: PayloadAction<LicenseStatus | 'All'>) {
			state.filters.status = action.payload;
			state.page = 1;
		},
		setProductIdFilter(state, action: PayloadAction<number | 'All'>) {
			state.filters.productId = action.payload;
			state.page = 1;
		},
		clearFilters(state) {
			state.filters = DEFAULT_LICENSE_FILTERS;
			state.page = 1;
		},
		setPage(state, action: PayloadAction<number>) {
			state.page = action.payload;
		},
		setPerPage(state, action: PayloadAction<number>) {
			state.perPage = action.payload;
			state.page = 1;
		},
		setSelectedLicenseId(state, action: PayloadAction<number | null>) {
			state.selectedLicenseId = action.payload;
		},
	},
	extraReducers: (builder) => {
		builder
			.addCase(loadLicenses.pending, (state) => {
				state.status = 'loading';
				state.error = null;
			})
			.addCase(loadLicenses.fulfilled, (state, action) => {
				state.status = 'succeeded';
				state.items = action.payload.data;
				state.total = action.payload.total;
				state.totalPages = action.payload.totalPages;
				state.stats = action.payload.stats;
			})
			.addCase(loadLicenses.rejected, (state, action) => {
				state.status = 'failed';
				state.error = action.payload as string;
			});
	},
});

export const {
	setSearch,
	setStatusFilter,
	setProductIdFilter,
	clearFilters,
	setPage,
	setPerPage,
	setSelectedLicenseId,
} = licensesSlice.actions;

export default licensesSlice.reducer;
