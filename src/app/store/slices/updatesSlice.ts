/**
 * Software Updates Redux slice.
 *
 * Centralized state management for software versions, KPI statistics,
 * active filters, drawer forms, and async API operations.
 *
 * @file
 * @since 1.0.0
 */

import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import {
	fetchVersions,
	uploadPackage as apiUploadPackage,
	publishVersion as apiPublishVersion,
	setVersionStatus as apiSetVersionStatus,
	deleteVersion as apiDeleteVersion,
	rollbackVersion as apiRollbackVersion,
	generateTestUrl as apiGenerateTestUrl,
} from '../../api/modules/updates.api';
import type {
	ProductVersion,
	UpdateStats,
	VersionQueryParams,
	UpdateChannel,
	Platform,
	ProductType,
	PackageStatus,
	NewReleasePayload,
	RollbackRecord,
} from '../../types/updates';

export interface UpdateFilters {
	search: string;
	channel: UpdateChannel | 'All';
	platform: Platform | 'All';
	productType: ProductType | 'All';
	productId: number | 'All';
	status: PackageStatus | 'All';
}

export const DEFAULT_UPDATE_FILTERS: UpdateFilters = {
	search: '',
	channel: 'All',
	platform: 'All',
	productType: 'All',
	productId: 'All',
	status: 'All',
};

export const DEFAULT_UPDATE_STATS: UpdateStats = {
	totalPackages: 0,
	latestReleases: 0,
	pendingDrafts: 0,
	totalDownloads: 0,
};

interface UpdatesState {
	items: ProductVersion[];
	stats: UpdateStats;
	total: number;
	totalPages: number;
	page: number;
	perPage: number;
	filters: UpdateFilters;
	status: 'idle' | 'loading' | 'succeeded' | 'failed';
	uploading: boolean;
	error: string | null;
	selectedVersionId: number | null;
	isDrawerOpen: boolean;
	activeDrawerMode: 'create' | 'edit';
	testUrl: string | null;
}

const initialState: UpdatesState = {
	items: [],
	stats: DEFAULT_UPDATE_STATS,
	total: 0,
	totalPages: 1,
	page: 1,
	perPage: 10,
	filters: DEFAULT_UPDATE_FILTERS,
	status: 'idle',
	uploading: false,
	error: null,
	selectedVersionId: null,
	isDrawerOpen: false,
	activeDrawerMode: 'create',
	testUrl: null,
};

export const loadVersions = createAsyncThunk(
	'updates/loadVersions',
	async (params: VersionQueryParams = {}, { getState, rejectWithValue }) => {
		try {
			const state = getState() as { updates: UpdatesState };
			const mergedParams: VersionQueryParams = {
				page: params.page ?? state.updates.page,
				perPage: params.perPage ?? state.updates.perPage,
				search: params.search ?? state.updates.filters.search,
				channel: params.channel ?? state.updates.filters.channel,
				platform: params.platform ?? state.updates.filters.platform,
				productType: params.productType ?? state.updates.filters.productType,
				productId: params.productId ?? state.updates.filters.productId,
				status: params.status ?? state.updates.filters.status,
			};
			const res = await fetchVersions(mergedParams);
			return res;
		} catch (err: unknown) {
			return rejectWithValue(err instanceof Error ? err.message : 'Failed to load software packages');
		}
	}
);

export const uploadRelease = createAsyncThunk(
	'updates/uploadRelease',
	async (payload: NewReleasePayload, { dispatch, rejectWithValue }) => {
		try {
			const res = await apiUploadPackage(payload);
			dispatch(loadVersions());
			return res.version;
		} catch (err: unknown) {
			return rejectWithValue(err instanceof Error ? err.message : 'Package upload failed');
		}
	}
);

export const promoteVersion = createAsyncThunk(
	'updates/promoteVersion',
	async (
		{ versionId, channel }: { versionId: number; channel: UpdateChannel },
		{ dispatch, rejectWithValue }
	) => {
		try {
			await apiPublishVersion(versionId, channel);
			dispatch(loadVersions());
			return { versionId, channel };
		} catch (err: unknown) {
			return rejectWithValue(err instanceof Error ? err.message : 'Failed to publish version');
		}
	}
);

export const toggleVersionStatus = createAsyncThunk(
	'updates/toggleVersionStatus',
	async (
		{ versionId, status }: { versionId: number; status: 'active' | 'archived' },
		{ dispatch, rejectWithValue }
	) => {
		try {
			await apiSetVersionStatus(versionId, status);
			dispatch(loadVersions());
			return { versionId, status };
		} catch (err: unknown) {
			return rejectWithValue(err instanceof Error ? err.message : 'Failed to update status');
		}
	}
);

export const removeVersion = createAsyncThunk(
	'updates/removeVersion',
	async (versionId: number, { dispatch, rejectWithValue }) => {
		try {
			await apiDeleteVersion(versionId);
			dispatch(loadVersions());
			return versionId;
		} catch (err: unknown) {
			return rejectWithValue(err instanceof Error ? err.message : 'Failed to delete package');
		}
	}
);

export const executeRollback = createAsyncThunk(
	'updates/executeRollback',
	async (
		payload: { productId: number; version: string; reason: string },
		{ dispatch, rejectWithValue }
	) => {
		try {
			const res = await apiRollbackVersion(payload);
			dispatch(loadVersions());
			return res.record;
		} catch (err: unknown) {
			return rejectWithValue(err instanceof Error ? err.message : 'Rollback operation failed');
		}
	}
);

export const fetchTestUrl = createAsyncThunk(
	'updates/fetchTestUrl',
	async (versionId: number, { rejectWithValue }) => {
		try {
			const res = await apiGenerateTestUrl(versionId);
			return res.url;
		} catch (err: unknown) {
			return rejectWithValue(err instanceof Error ? err.message : 'Failed to generate test URL');
		}
	}
);

export const updatesSlice = createSlice({
	name: 'updates',
	initialState,
	reducers: {
		setSearch(state, action: PayloadAction<string>) {
			state.filters.search = action.payload;
			state.page = 1;
		},
		setChannelFilter(state, action: PayloadAction<UpdateChannel | 'All'>) {
			state.filters.channel = action.payload;
			state.page = 1;
		},
		setPlatformFilter(state, action: PayloadAction<Platform | 'All'>) {
			state.filters.platform = action.payload;
			state.page = 1;
		},
		setProductTypeFilter(state, action: PayloadAction<ProductType | 'All'>) {
			state.filters.productType = action.payload;
			state.page = 1;
		},
		setProductIdFilter(state, action: PayloadAction<number | 'All'>) {
			state.filters.productId = action.payload;
			state.page = 1;
		},
		setStatusFilter(state, action: PayloadAction<PackageStatus | 'All'>) {
			state.filters.status = action.payload;
			state.page = 1;
		},
		clearFilters(state) {
			state.filters = DEFAULT_UPDATE_FILTERS;
			state.page = 1;
		},
		setPage(state, action: PayloadAction<number>) {
			state.page = action.payload;
		},
		setPerPage(state, action: PayloadAction<number>) {
			state.perPage = action.payload;
			state.page = 1;
		},
		setSelectedVersionId(state, action: PayloadAction<number | null>) {
			state.selectedVersionId = action.payload;
		},
		openNewReleaseDrawer(state) {
			state.isDrawerOpen = true;
			state.activeDrawerMode = 'create';
		},
		closeDrawer(state) {
			state.isDrawerOpen = false;
		},
		clearTestUrl(state) {
			state.testUrl = null;
		},
	},
	extraReducers: (builder) => {
		builder
			.addCase(loadVersions.pending, (state) => {
				state.status = 'loading';
				state.error = null;
			})
			.addCase(loadVersions.fulfilled, (state, action) => {
				state.status = 'succeeded';
				state.items = action.payload.data;
				state.total = action.payload.total;
				state.totalPages = action.payload.totalPages;
				state.stats = action.payload.stats;
			})
			.addCase(loadVersions.rejected, (state, action) => {
				state.status = 'failed';
				state.error = action.payload as string;
			})
			.addCase(uploadRelease.pending, (state) => {
				state.uploading = true;
				state.error = null;
			})
			.addCase(uploadRelease.fulfilled, (state) => {
				state.uploading = false;
				state.isDrawerOpen = false;
			})
			.addCase(uploadRelease.rejected, (state, action) => {
				state.uploading = false;
				state.error = action.payload as string;
			})
			.addCase(fetchTestUrl.fulfilled, (state, action) => {
				state.testUrl = action.payload;
			});
	},
});

export const {
	setSearch,
	setChannelFilter,
	setPlatformFilter,
	setProductTypeFilter,
	setProductIdFilter,
	setStatusFilter,
	clearFilters,
	setPage,
	setPerPage,
	setSelectedVersionId,
	openNewReleaseDrawer,
	closeDrawer,
	clearTestUrl,
} = updatesSlice.actions;

export default updatesSlice.reducer;
