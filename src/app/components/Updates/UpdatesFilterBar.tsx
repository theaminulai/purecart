import React, { useState } from 'react';
import { Search, X } from 'lucide-react';
import { M3 } from '../../utils/static-data';
import { FilterChip } from '../ui/FilterChip';
import type { UpdateChannel, Platform, ProductType, PackageStatus } from '../../types/updates';

export interface UpdatesFilterBarProps {
	search: string;
	onSearchChange: ( v: string ) => void;
	channel: UpdateChannel | 'All';
	onChannelChange: ( v: UpdateChannel | 'All' ) => void;
	platform: Platform | 'All';
	onPlatformChange: ( v: Platform | 'All' ) => void;
	productType: ProductType | 'All';
	onProductTypeChange: ( v: ProductType | 'All' ) => void;
	status: PackageStatus | 'All';
	onStatusChange: ( v: PackageStatus | 'All' ) => void;
	onClearAll: () => void;
}

export function UpdatesFilterBar( {
	search,
	onSearchChange,
	channel,
	onChannelChange,
	platform,
	onPlatformChange,
	productType,
	onProductTypeChange,
	status,
	onStatusChange,
	onClearAll,
}: UpdatesFilterBarProps ) {
	const [ openFilter, setOpenFilter ] = useState<string | null>( null );

	const handleToggle = ( name: string ) => {
		setOpenFilter( ( prev ) => ( prev === name ? null : name ) );
	};

	const handleClose = () => {
		setOpenFilter( null );
	};

	const hasActiveFilters =
		channel !== 'All' || platform !== 'All' || productType !== 'All' || status !== 'All' || search !== '';

	return (
		<div
			style={ {
				display: 'flex',
				alignItems: 'center',
				gap: '12px',
				flexWrap: 'wrap',
				marginBottom: '16px',
				padding: '12px 16px',
				backgroundColor: M3.surface,
				borderRadius: '12px',
				border: `1px solid ${ M3.outlineVariant }`,
			} }
		>
			{ /* Search Input */ }
			<div
				style={ {
					display: 'flex',
					alignItems: 'center',
					gap: '8px',
					padding: '6px 12px',
					backgroundColor: M3.surfaceContainerLow,
					borderRadius: '8px',
					border: `1px solid ${ M3.outlineVariant }`,
					flex: '1 1 240px',
					minWidth: '200px',
				} }
			>
				<Search size={ 16 } color={ M3.onSurfaceVariant } />
				<input
					type="text"
					value={ search }
					onChange={ ( e ) => onSearchChange( e.target.value ) }
					placeholder="Search releases, products, versions..."
					style={ {
						border: 'none',
						background: 'transparent',
						outline: 'none',
						fontSize: '13px',
						color: M3.onSurface,
						width: '100%',
					} }
				/>
				{ search && (
					<button
						onClick={ () => onSearchChange( '' ) }
						style={ {
							background: 'none',
							border: 'none',
							cursor: 'pointer',
							padding: 0,
							display: 'flex',
							alignItems: 'center',
							color: M3.onSurfaceVariant,
						} }
					>
						<X size={ 14 } />
					</button>
				) }
			</div>

			{ /* Filter Chips */ }
			<FilterChip
				label="Channel"
				value={ channel }
				options={ [ 'All', 'stable', 'beta', 'nightly' ] }
				isOpen={ openFilter === 'channel' }
				onToggle={ () => handleToggle( 'channel' ) }
				onSelect={ ( v ) => {
					onChannelChange( v as UpdateChannel | 'All' );
					handleClose();
				} }
			/>

			<FilterChip
				label="Platform"
				value={ platform }
				options={ [
					'All',
					'universal',
					'darwin-arm64',
					'darwin-x64',
					'win-x64',
					'win-arm64',
					'linux-x86_64',
					'linux-arm64',
				] }
				isOpen={ openFilter === 'platform' }
				onToggle={ () => handleToggle( 'platform' ) }
				onSelect={ ( v ) => {
					onPlatformChange( v as Platform | 'All' );
					handleClose();
				} }
			/>

			<FilterChip
				label="Product Type"
				value={ productType }
				options={ [
					'All',
					'wp-plugin',
					'wp-theme',
					'desktop-app',
					'cli-tool',
					'mobile-app',
					'electron-app',
					'other',
				] }
				isOpen={ openFilter === 'productType' }
				onToggle={ () => handleToggle( 'productType' ) }
				onSelect={ ( v ) => {
					onProductTypeChange( v as ProductType | 'All' );
					handleClose();
				} }
			/>

			<FilterChip
				label="Status"
				value={ status }
				options={ [ 'All', 'active', 'archived' ] }
				isOpen={ openFilter === 'status' }
				onToggle={ () => handleToggle( 'status' ) }
				onSelect={ ( v ) => {
					onStatusChange( v as PackageStatus | 'All' );
					handleClose();
				} }
			/>

			{ hasActiveFilters && (
				<button
					onClick={ onClearAll }
					style={ {
						background: 'none',
						border: 'none',
						color: M3.primary,
						fontSize: '12px',
						fontWeight: 600,
						cursor: 'pointer',
						padding: '4px 8px',
					} }
				>
					Clear Filters
				</button>
			) }
		</div>
	);
}
