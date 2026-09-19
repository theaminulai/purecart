/**
 * Named selectors for the Updates slice — see DEVELOPMENT_GUIDELINES.md §11
 * (write the selector once, name it for what it returns, reuse it instead of
 * repeating inline `useAppSelector` lambdas across components).
 *
 * @file
 * @since 1.1.0
 */
import type { RootState } from '@/app/store/store';

export const selectUpdateItems = ( state: RootState ) => state.updates.items;
export const selectUpdateStats = ( state: RootState ) => state.updates.stats;
export const selectUpdateFilters = ( state: RootState ) => state.updates.filters;
export const selectUpdateStatus = ( state: RootState ) => state.updates.status;
export const selectUpdateUploading = ( state: RootState ) => state.updates.uploading;
export const selectUpdateDrawerOpen = ( state: RootState ) => state.updates.isDrawerOpen;
