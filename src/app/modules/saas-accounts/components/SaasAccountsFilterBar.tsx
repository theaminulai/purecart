/**
 * SaasAccountsFilterBar component.
 *
 * Search box + Status/Plan/Product filter chips, a "clear all" affordance
 * shown only when a filter is active, and the link across to the SaaS
 * settings tab. Fully controlled — owns no filter state itself, same
 * contract as DownloadsFilterBar.
 *
 * @file
 * @since 1.0.0
 */
import { useState } from 'react';
import { Search, Settings } from 'lucide-react';
import { __ } from '@wordpress/i18n';
import { M3 } from '@/theme';
import { FilterChip } from '@/shared/ui/FilterChip';
import { OutlinedButton } from '@/shared/ui/OutlinedButton';
import { saasStatusLabel, saasPlanLabel } from '../constants';
import type { SaasAccountStatus } from '../types';

// Not run through __() — FilterChip's `options` doubles as the display
// label and the match value, so translating these would break the match.
// Same constraint DownloadsFilterBar's STATUS_OPTIONS already lives with.
// FilterChip prepends its own 'All' entry, so it's omitted here.
const STATUS_OPTIONS = [ 'Active', 'Suspended', 'Cancelled' ];

const STATUS_VALUE_MAP: Record< string, SaasAccountStatus | 'All' > = {
	All: 'All',
	Active: 'active',
	Suspended: 'suspended',
	Cancelled: 'cancelled',
};

export interface SaasAccountsFilterBarProps {
	search: string;
	onSearchChange: ( v: string ) => void;
	filterStatus: SaasAccountStatus | 'All';
	onFilterStatusChange: ( v: SaasAccountStatus | 'All' ) => void;
	filterPlan: string | 'All';
	onFilterPlanChange: ( v: string | 'All' ) => void;
	/** Plan identifiers (not labels) known to the backend, from the stats endpoint. */
	planOptions: string[];
	filterProduct: string;
	onFilterProductChange: ( v: string ) => void;
	productOptions: Array< { id: number; name: string } >;
	onClearAll: () => void;
	onOpenSettings: () => void;
}

/**
 * Renders the SaaS Accounts page's filter bar.
 *
 * @since 1.0.0
 *
 * @param {SaasAccountsFilterBarProps} props Component props.
 * @return {JSX.Element} The filter bar.
 */
export function SaasAccountsFilterBar( {
	search,
	onSearchChange,
	filterStatus,
	onFilterStatusChange,
	filterPlan,
	onFilterPlanChange,
	planOptions,
	filterProduct,
	onFilterProductChange,
	productOptions,
	onClearAll,
	onOpenSettings,
}: SaasAccountsFilterBarProps ) {
	const [ openFilter, setOpenFilter ] = useState< string | null >( null );

	const handleToggle = ( name: string ) => setOpenFilter( ( prev ) => ( prev === name ? null : name ) );
	const handleClose = () => setOpenFilter( null );

	const anyActive = 'All' !== filterStatus || 'All' !== filterPlan || 'All' !== filterProduct;
	const statusDisplayValue = 'All' === filterStatus ? 'All' : saasStatusLabel( filterStatus );
	const planDisplayValue = 'All' === filterPlan ? 'All' : saasPlanLabel( filterPlan );

	return (
		<div className="flex items-center gap-2 flex-wrap">
			<div
				className="flex items-center gap-2 flex-1 max-w-xs px-3 py-2 rounded-lg"
				style={ { backgroundColor: M3.surfaceContainerHigh, border: `1px solid ${ M3.outlineVariant }` } }
			>
				<Search size={ 16 } color={ M3.onSurfaceVariant } />
				<input
					type="text"
					placeholder={ __( 'Search customer, product, plan, key…', 'purecart' ) }
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
				isOpen={ 'status' === openFilter }
				onToggle={ () => handleToggle( 'status' ) }
				onClose={ handleClose }
			/>
			<FilterChip
				label={ __( 'Plan', 'purecart' ) }
				value={ planDisplayValue }
				options={ planOptions.map( saasPlanLabel ) }
				// The chip hands back a label; map it to the plan identifier
				// the REST endpoint filters on (they differ for the three
				// translated tiers — see constants.ts).
				onChange={ ( v ) =>
					onFilterPlanChange( planOptions.find( ( plan ) => saasPlanLabel( plan ) === v ) ?? 'All' )
				}
				isOpen={ 'plan' === openFilter }
				onToggle={ () => handleToggle( 'plan' ) }
				onClose={ handleClose }
			/>
			<FilterChip
				label={ __( 'Product', 'purecart' ) }
				value={ filterProduct }
				options={ productOptions.map( ( p ) => p.name ) }
				onChange={ onFilterProductChange }
				isOpen={ 'product' === openFilter }
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
				<OutlinedButton small onClick={ onOpenSettings }>
					<Settings size={ 14 } /> { __( 'SaaS Settings', 'purecart' ) }
				</OutlinedButton>
			</div>
		</div>
	);
}
