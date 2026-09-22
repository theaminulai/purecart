/**
 * LicensesFilterBar component.
 *
 * Search box + Status/Product filter chips, a "clear all" affordance shown
 * only when a filter is active, and the Summary / Export CSV header buttons.
 * Fully controlled — owns no filter state itself, per
 * docs/RND-frontend-license-manager.md Screen 1's filter bar spec.
 *
 * @file
 * @since 1.0.0
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Download as DownloadIcon, BarChart2 } from 'lucide-react';
import { __ } from '@wordpress/i18n';
import { M3 } from '@/theme';
import { FilterChip } from '@/shared/ui/FilterChip';
import { OutlinedButton } from '@/shared/ui/OutlinedButton';
import { TonalButton } from '@/shared/ui/TonalButton';
import { PAGE_PATHS } from '@/app/router';
import type { LicenseStatus } from '../types';

// Not run through __() — FilterChip's `options` doubles as both the
// display label and the match value (.toLowerCase() below maps it back to
// the LicenseStatus enum); translating these would break that match. Same
// constraint SubscriptionsFilterBar's STATUS_OPTIONS already lives with.
const STATUS_OPTIONS = [ 'Active', 'Expired', 'Suspended', 'Revoked' ];

export interface LicensesFilterBarProps {
	search: string;
	onSearchChange: ( v: string ) => void;
	filterStatus: LicenseStatus | 'All';
	onFilterStatusChange: ( v: LicenseStatus | 'All' ) => void;
	filterProduct: string;
	onFilterProductChange: ( v: string ) => void;
	productOptions: Array<{ id: number; name: string }>;
	onClearAll: () => void;
	onExportCsv: () => void;
}

/**
 * Renders the Licenses list page's header row + filter bar.
 *
 * @since 1.0.0
 */
export function LicensesFilterBar( {
	search,
	onSearchChange,
	filterStatus,
	onFilterStatusChange,
	filterProduct,
	onFilterProductChange,
	productOptions,
	onClearAll,
	onExportCsv,
}: LicensesFilterBarProps ) {
	const navigate = useNavigate();
	const [ openFilter, setOpenFilter ] = useState< string | null >( null );

	const handleToggle = ( name: string ) => setOpenFilter( ( prev ) => ( prev === name ? null : name ) );
	const handleClose = () => setOpenFilter( null );

	const productNameOptions = productOptions.map( ( p ) => p.name );
	const anyActive = filterStatus !== 'All' || filterProduct !== 'All';

	return (
		<div className="flex items-center gap-2 flex-wrap">
			<div
				className="flex items-center gap-2 flex-1 max-w-xs px-3 py-2 rounded-lg"
				style={ { backgroundColor: M3.surfaceContainerHigh, border: `1px solid ${ M3.outlineVariant }` } }
			>
				<Search size={ 16 } color={ M3.onSurfaceVariant } />
				<input
					type="text"
					placeholder={ __( 'Search licenses, keys, customers…', 'purecart' ) }
					value={ search }
					onChange={ ( e ) => onSearchChange( e.target.value ) }
					className="flex-1 bg-transparent outline-none text-sm"
					style={ { color: M3.onSurface, fontFamily: 'Roboto, sans-serif', border: 'none' } }
				/>
			</div>

			<FilterChip
				label={ __( 'Status', 'purecart' ) }
				value={ filterStatus }
				options={ STATUS_OPTIONS }
				onChange={ ( v ) => onFilterStatusChange( ( v === 'All' ? 'All' : v.toLowerCase() ) as LicenseStatus | 'All' ) }
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
				<TonalButton small onClick={ () => navigate( PAGE_PATHS[ 'license-summary' ] ) }>
					<BarChart2 size={ 14 } /> { __( 'Summary', 'purecart' ) }
				</TonalButton>
				<OutlinedButton small onClick={ onExportCsv }>
					<DownloadIcon size={ 14 } /> { __( 'Export CSV', 'purecart' ) }
				</OutlinedButton>
			</div>
		</div>
	);
}
