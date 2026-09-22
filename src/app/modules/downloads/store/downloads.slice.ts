/**
 * Downloads Redux slice.
 *
 * Same server-driven pagination shape as the Licenses module's slice: the
 * log, its KPI stats, and pagination all come from one GET /downloads/log
 * call per (filters, page, perPage) change, re-dispatched after every
 * mutation rather than patched optimistically.
 *
 * @file
 * @since 1.0.0
 */

import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import {
	fetchDownloadLogs,
	revokeDownloadToken as apiRevokeDownloadToken,
	regenerateDownloadToken as apiRegenerateDownloadToken,
	bulkRevokeDownloadTokens as apiBulkRevokeDownloadTokens,
} from '../api';
import type { DownloadLogEntry, DownloadStats, DownloadLogQueryParams, DownloadLogStatus } from '../types';

export interface DownloadFilters {
	search: string;
	status: DownloadLogStatus | 'All';
	productId: number | 'All';
}

export const DEFAULT_DOWNLOAD_FILTERS: DownloadFilters = {
	search: '',
	status: 'All',
	productId: 'All',
};

export const DEFAULT_DOWNLOAD_STATS: DownloadStats = {
	totalDownloads: 0,
	uniqueFiles: 0,
	failedAttempts: 0,
	tokensExpiringIn24h: 0,
};

interface DownloadsState {
	items: DownloadLogEntry[];
	stats: DownloadStats;
	total: number;
	totalPages: number;
	page: number;
	perPage: number;
	filters: DownloadFilters;
	status: 'idle' | 'loading' | 'succeeded' | 'failed';
	error: string | null;
}

const initialState: DownloadsState = {
	items: [],
	stats: DEFAULT_DOWNLOAD_STATS,
	total: 0,
	totalPages: 1,
	page: 1,
	perPage: 20,
	filters: DEFAULT_DOWNLOAD_FILTERS,
	status: 'idle',
	error: null,
};

/**
 * Loads one page of the download log, merging any explicit params over the
 * current filters/page/perPage in state — same "explicit override, else
 * current state" merge the Licenses module's loadLicenses() thunk uses.
 */
export const loadDownloadLogs = createAsyncThunk(
	'downloads/loadDownloadLogs',
	async (params: DownloadLogQueryParams = {}, { getState, rejectWithValue }) => {
		try {
			const state = getState() as { downloads: DownloadsState };
			const merged: DownloadLogQueryParams = {
				page: params.page ?? state.downloads.page,
				perPage: params.perPage ?? state.downloads.perPage,
				search: params.search ?? state.downloads.filters.search,
				status: params.status ?? state.downloads.filters.status,
				productId: params.productId ?? state.downloads.filters.productId,
			};
			return await fetchDownloadLogs(merged);
		} catch (err: unknown) {
			return rejectWithValue(err instanceof Error ? err.message : 'Failed to load download log');
		}
	}
);

export const revokeDownloadTokenThunk = createAsyncThunk(
	'downloads/revokeToken',
	async (downloadId: number, { dispatch, rejectWithValue }) => {
		try {
			const res = await apiRevokeDownloadToken(downloadId);
			dispatch(loadDownloadLogs({}));
			return res.token;
		} catch (err: unknown) {
			return rejectWithValue(err instanceof Error ? err.message : 'Revoke failed');
		}
	}
);

export const regenerateDownloadTokenThunk = createAsyncThunk(
	'downloads/regenerateToken',
	async (downloadId: number, { dispatch, rejectWithValue }) => {
		try {
			const res = await apiRegenerateDownloadToken(downloadId);
			dispatch(loadDownloadLogs({}));
			return res.token;
		} catch (err: unknown) {
			return rejectWithValue(err instanceof Error ? err.message : 'Regenerate failed');
		}
	}
);

export const bulkRevokeDownloadTokensThunk = createAsyncThunk(
	'downloads/bulkRevokeTokens',
	async (ids: number[], { dispatch, rejectWithValue }) => {
		try {
			const res = await apiBulkRevokeDownloadTokens(ids);
			dispatch(loadDownloadLogs({}));
			return res;
		} catch (err: unknown) {
			return rejectWithValue(err instanceof Error ? err.message : 'Bulk revoke failed');
		}
	}
);

export const downloadsSlice = createSlice({
	name: 'downloads',
	initialState,
	reducers: {
		setSearch(state, action: PayloadAction<string>) {
			state.filters.search = action.payload;
			state.page = 1;
		},
		setStatusFilter(state, action: PayloadAction<DownloadLogStatus | 'All'>) {
			state.filters.status = action.payload;
			state.page = 1;
		},
		setProductIdFilter(state, action: PayloadAction<number | 'All'>) {
			state.filters.productId = action.payload;
			state.page = 1;
		},
		clearFilters(state) {
			state.filters = DEFAULT_DOWNLOAD_FILTERS;
			state.page = 1;
		},
		setPage(state, action: PayloadAction<number>) {
			state.page = action.payload;
		},
		setPerPage(state, action: PayloadAction<number>) {
			state.perPage = action.payload;
			state.page = 1;
		},
	},
	extraReducers: (builder) => {
		builder
			.addCase(loadDownloadLogs.pending, (state) => {
				state.status = 'loading';
				state.error = null;
			})
			.addCase(loadDownloadLogs.fulfilled, (state, action) => {
				state.status = 'succeeded';
				state.items = action.payload.data;
				state.total = action.payload.total;
				state.totalPages = action.payload.totalPages;
				state.stats = action.payload.stats;
			})
			.addCase(loadDownloadLogs.rejected, (state, action) => {
				state.status = 'failed';
				state.error = action.payload as string;
			});
	},
});

export const { setSearch, setStatusFilter, setProductIdFilter, clearFilters, setPage, setPerPage } =
	downloadsSlice.actions;

export default downloadsSlice.reducer;
