/**
 * Named selectors for the Downloads slice.
 *
 * @file
 * @since 1.0.0
 */
import type { RootState } from '@/app/store/store';

export const selectDownloadItems = ( state: RootState ) => state.downloads.items;
export const selectDownloadStats = ( state: RootState ) => state.downloads.stats;
export const selectDownloadFilters = ( state: RootState ) => state.downloads.filters;
export const selectDownloadStatus = ( state: RootState ) => state.downloads.status;
export const selectDownloadPage = ( state: RootState ) => state.downloads.page;
export const selectDownloadTotal = ( state: RootState ) => state.downloads.total;
export const selectDownloadTotalPages = ( state: RootState ) => state.downloads.totalPages;
