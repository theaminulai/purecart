/**
 * Named selectors for the Licenses slice.
 *
 * @file
 * @since 1.0.0
 */
import type { RootState } from '@/app/store/store';

export const selectLicenseItems = ( state: RootState ) => state.licenses.items;
export const selectLicenseStats = ( state: RootState ) => state.licenses.stats;
export const selectLicenseFilters = ( state: RootState ) => state.licenses.filters;
export const selectLicenseStatus = ( state: RootState ) => state.licenses.status;
export const selectLicensePage = ( state: RootState ) => state.licenses.page;
export const selectLicensePerPage = ( state: RootState ) => state.licenses.perPage;
export const selectLicenseTotal = ( state: RootState ) => state.licenses.total;
export const selectLicenseTotalPages = ( state: RootState ) => state.licenses.totalPages;
