/**
 * DownloadsFilterBar component.
 *
 * Search box + Status/Product filter chips, a "clear all" affordance shown
 * only when a filter is active, and the Export CSV header button. Fully
 * controlled — owns no filter state itself, per
 * docs/RND-frontend-secure-downloads.md Screen 1's filter bar spec.
 *
 * @file
 * @since 1.0.0
 */
import { useState } from 'react';
import { Search, Download as DownloadIcon } from 'lucide-react';
import { __ } from '@wordpress/i18n';
import { M3 } from '@/theme';
import { FilterChip } from '@/shared/ui/FilterChip';
import { OutlinedButton } from '@/shared/ui/OutlinedButton';
import { downloadStatusLabel } from '../constants';
import type { DownloadLogStatus } from '../types';

// Not run through __() — FilterChip's `options` doubles as both the
// display label and the match value; translating these would break that
// match. Same constraint LicensesFilterBar's STATUS_OPTIONS already lives
// with. Values map back to DownloadLogStatus via STATUS_VALUE_MAP below.
// FilterChip prepends its own 'All' entry, so it's omitted here.
const STATUS_OPTIONS = [ 'Success', 'Expired', 'Limit Reached', 'Revoked' ];

const STATUS_VALUE_MAP: Record<string, DownloadLogStatus | 'All'> = {
	All: 'All',
	Success: 'success',
	Expired: 'rejected_expired',
	'Limit Reached': 'rejected_exhausted',
	Revoked: 'rejected_revoked',
};

export interface DownloadsFilterBarProps {
	search: string;
	onSearchChange: ( v: string ) => void;
	filterStatus: DownloadLogStatus | 'All';
	onFilterStatusChange: ( v: DownloadLogStatus | 'All' ) => void;
	filterProduct: string;
	onFilterProductChange: ( v: string ) => void;
	productOptions: Array<{ id: number; name: string }>;
	onClearAll: () => void;
	onExportCsv: () => void;
}

/**
 * Renders the Downloads log page's header row + filter bar.
 *
 * @since 1.0.0
 */
export function DownloadsFilterBar( {
	search,
	onSearchChange,
	filterStatus,
	onFilterStatusChange,
	filterProduct,
	onFilterProductChange,
	productOptions,
	onClearAll,
	onExportCsv,
}: DownloadsFilterBarProps ) {
	const [ openFilter, setOpenFilter ] = useState< string | null >( null );

	const handleToggle = ( name: string ) => setOpenFilter( ( prev ) => ( prev === name ? null : name ) );
	const handleClose = () => setOpenFilter( null );

	const productNameOptions = productOptions.map( ( p ) => p.name );
	const anyActive = filterStatus !== 'All' || filterProduct !== 'All';
	const statusDisplayValue = 'All' === filterStatus ? 'All' : downloadStatusLabel( filterStatus );

	return (
		<div className="flex items-center gap-2 flex-wrap">
			<div
				className="flex items-center gap-2 flex-1 max-w-xs px-3 py-2 rounded-lg"
				style={ { backgroundColor: M3.surfaceContainerHigh, border: `1px solid ${ M3.outlineVariant }` } }
			>
				<Search size={ 16 } color={ M3.onSurfaceVariant } />
				<input
					type="text"
					placeholder={ __( 'Search order, customer, file, product…', 'purecart' ) }
					value={ search }
					onChange={ ( e ) => onSearchChange( e.target.value ) }
					className="flex-1 bg-transparent outline-none text-sm"
					style={ { color: M3.onSurface, fontFamily: 'Roboto, sans-serif', border: 'none' } }
				/>
			</div>

			<FilterChip
				label={ __( 'Status', 'purecart' ) }
				value={ statusDisplayValue }
				options={ STATUS_OPTIONS }
				onChange={ ( v ) => onFilterStatusChange( STATUS_VALUE_MAP[ v ] ?? 'All' ) }
				isOpen={ openFilter === 'status' }
				onToggle={ () => handleToggle( 'status' ) }
				onClose={ handleClose }
			/>
			<FilterChip
				label={ __( 'Product', 'purecart' ) }
				value={ filterProduct }
				options={ productNameOptions }
				onChange={ onFilterProductChange }
				isOpen={ openFilter === 'product' }
				onToggle={ () => handleToggle( 'product' ) }
				onClose={ handleClose }
			/>

			{ anyActive && (
				<button
					onClick={ onClearAll }
					className="text-xs px-3 py-1.5 rounded-full"
					style={ {
						color: M3.error,
						border: `1px solid ${ M3.error }`,
						background: 'none',
						cursor: 'pointer',
						fontFamily: 'Roboto, sans-serif',
					} }
				>
					{ __( 'Clear all', 'purecart' ) }
				</button>
			) }

			<div className="ml-auto flex items-center gap-2">
				<OutlinedButton small onClick={ onExportCsv }>
					<DownloadIcon size={ 14 } /> { __( 'Export Log CSV', 'purecart' ) }
				</OutlinedButton>
			</div>
		</div>
	);
}
