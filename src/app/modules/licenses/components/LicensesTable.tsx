/**
 * LicensesTable component.
 *
 * Renders the Licenses list page's table — columns, row selection, the
 * per-row action menu, and pagination footer, per
 * docs/RND-frontend-license-manager.md Screen 1.
 *
 * @file
 * @since 1.0.0
 */
import React, { useState } from 'react';
import {
	MoreVertical, Eye, User, Copy, Copy as Duplicate, Calendar, RotateCcw,
	Bell, PauseCircle, CheckCircle, XCircle,
} from 'lucide-react';
import { __, sprintf } from '@wordpress/i18n';
import { M3 } from '@/theme';
import { StatusBadge } from '@/shared/ui/StatusBadge';
import { LicenseKeyReveal } from './shared';
import { planLabel } from '../constants';
import type { LicenseRecord } from '../types';

interface LicensesTableProps {
	items: LicenseRecord[];
	loading: boolean;
	selected: number[];
	onToggleSelect: ( id: number ) => void;
	onToggleSelectAll: ( checked: boolean ) => void;
	currentPage: number;
	totalPages: number;
	totalCount: number;
	onPageChange: ( page: number ) => void;
	onViewDetail: ( license: LicenseRecord ) => void;
	onViewCustomer: ( license: LicenseRecord ) => void;
	onCopyKey: ( license: LicenseRecord ) => void;
	onDuplicate: ( license: LicenseRecord ) => void;
	onExtendExpiry: ( license: LicenseRecord ) => void;
	onResetActivations: ( license: LicenseRecord ) => void;
	onSendReminder: ( license: LicenseRecord ) => void;
	onSuspend: ( license: LicenseRecord ) => void;
	onReinstate: ( license: LicenseRecord ) => void;
	onRevoke: ( license: LicenseRecord ) => void;
}

/**
 * Renders the Licenses table: header, rows, per-row action menu, pagination.
 *
 * @since 1.0.0
 */
export function LicensesTable( {
	items,
	loading,
	selected,
	onToggleSelect,
	onToggleSelectAll,
	currentPage,
	totalPages,
	totalCount,
	onPageChange,
	onViewDetail,
	onViewCustomer,
	onCopyKey,
	onDuplicate,
	onExtendExpiry,
	onResetActivations,
	onSendReminder,
	onSuspend,
	onReinstate,
	onRevoke,
}: LicensesTableProps ) {
	const [ openMenuId, setOpenMenuId ] = useState< number | null >( null );

	if ( loading && items.length === 0 ) {
		return (
			<div
				style={ {
					padding: '48px', textAlign: 'center', backgroundColor: M3.surface,
					borderRadius: '12px', border: `1px solid ${ M3.outlineVariant }`, color: M3.onSurfaceVariant,
				} }
			>
				{ __( 'Loading licenses…', 'purecart' ) }
			</div>
		);
	}

	if ( items.length === 0 ) {
		return (
			<div
				style={ {
					padding: '48px', textAlign: 'center', backgroundColor: M3.surface,
					borderRadius: '12px', border: `1px solid ${ M3.outlineVariant }`, color: M3.onSurfaceVariant,
				} }
			>
				<p style={ { fontSize: '15px', fontWeight: 600, color: M3.onSurface, margin: '0 0 8px' } }>{ __( 'No licenses found', 'purecart' ) }</p>
				<p style={ { fontSize: '13px', margin: 0 } }>{ __( 'Licenses are issued automatically when a licensed product order completes.', 'purecart' ) }</p>
			</div>
		);
	}

	const allSelected = items.length > 0 && items.every( ( i ) => selected.includes( i.id ) );

	return (
		<div style={ { backgroundColor: M3.surface, borderRadius: '12px', border: `1px solid ${ M3.outlineVariant }`, overflow: 'hidden' } }>
			<table style={ { width: '100%', borderCollapse: 'collapse', textAlign: 'left' } }>
				<thead>
					<tr
						style={ {
							backgroundColor: M3.surfaceContainerLow, borderBottom: `1px solid ${ M3.outlineVariant }`,
							fontSize: '12px', fontWeight: 600, color: M3.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: '0.04em',
						} }
					>
						<th style={ { width: '36px', padding: '12px 8px 12px 16px' } }>
							<input type="checkbox" checked={ allSelected } onChange={ ( e ) => onToggleSelectAll( e.target.checked ) } />
						</th>
						<th style={ { padding: '12px 16px' } }>{ __( 'License Key', 'purecart' ) }</th>
						<th style={ { padding: '12px 16px' } }>{ __( 'Customer', 'purecart' ) }</th>
						<th style={ { padding: '12px 16px' } }>{ __( 'Product', 'purecart' ) }</th>
						<th style={ { padding: '12px 16px' } }>{ __( 'Plan', 'purecart' ) }</th>
						<th style={ { padding: '12px 16px' } }>{ __( 'Sites', 'purecart' ) }</th>
						<th style={ { padding: '12px 16px' } }>{ __( 'Status', 'purecart' ) }</th>
						<th style={ { padding: '12px 16px' } }>{ __( 'Expires', 'purecart' ) }</th>
						<th style={ { width: '60px', padding: '12px 16px', textAlign: 'right' } }>{ __( 'Actions', 'purecart' ) }</th>
					</tr>
				</thead>
				<tbody>
					{ items.map( ( license, i ) => {
						const isMenuOpen = openMenuId === license.id;
						const isSelected = selected.includes( license.id );
						const sitesPct = license.activationLimit > 0
							? Math.min( 100, Math.round( ( license.activatedCount / license.activationLimit ) * 100 ) )
							: 0;

						return (
							<tr
								key={ license.id }
								style={ {
									borderBottom: `1px solid ${ M3.outlineVariant }`,
									backgroundColor: isSelected ? `${ M3.primary }14` : i % 2 === 0 ? M3.surface : M3.surfaceContainerLow,
								} }
							>
								<td style={ { padding: '12px 8px 12px 16px' } }>
									<input type="checkbox" checked={ isSelected } onChange={ () => onToggleSelect( license.id ) } />
								</td>
								<td style={ { padding: '12px 16px' } }>
									<LicenseKeyReveal licenseKey={ license.licenseKey } />
								</td>
								<td style={ { padding: '12px 16px' } }>
									<button
										onClick={ () => onViewCustomer( license ) }
										style={ {
											background: 'none', border: 'none', cursor: 'pointer', padding: 0,
											fontSize: '13px', fontWeight: 500, color: M3.primary, fontFamily: 'Roboto, sans-serif',
										} }
									>
										{ license.customerName ||
											/* translators: %d: WordPress user ID, shown when a license has no resolved customer name */
											sprintf( __( 'Customer #%d', 'purecart' ), license.userId ) }
									</button>
									<div style={ { fontSize: '12px', color: M3.onSurfaceVariant } }>{ license.customerEmail }</div>
								</td>
								<td style={ { padding: '12px 16px', fontSize: '13px', color: M3.onSurface } }>{ license.productName }</td>
								<td style={ { padding: '12px 16px' } }>
									<span
										style={ {
											fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '999px',
											backgroundColor: M3.secondaryContainer, color: M3.onSecondaryContainer, fontFamily: 'Roboto, sans-serif',
										} }
									>
										{ planLabel( license.planType ) }
									</span>
								</td>
								<td style={ { padding: '12px 16px' } }>
									<div style={ { fontSize: '12px', fontFamily: 'Roboto Mono, monospace', color: M3.onSurface, marginBottom: 4 } }>
										{ license.activatedCount } / { 'unlimited' === license.planType ? '∞' : license.activationLimit }
									</div>
									{ 'unlimited' !== license.planType && (
										<div style={ { width: 48, height: 4, borderRadius: 999, backgroundColor: M3.outlineVariant, overflow: 'hidden' } }>
											<div style={ { width: `${ sitesPct }%`, height: '100%', backgroundColor: sitesPct >= 100 ? M3.error : M3.primary } } />
										</div>
									) }
								</td>
								<td style={ { padding: '12px 16px' } }>
									<StatusBadge status={ license.status } />
								</td>
								<td style={ { padding: '12px 16px', fontSize: '12px', color: M3.onSurfaceVariant } }>
									{ license.expiresAt ? new Date( license.expiresAt ).toLocaleDateString() : __( 'Lifetime', 'purecart' ) }
								</td>
								<td style={ { padding: '12px 16px', textAlign: 'right', position: 'relative' } }>
									<button
										onClick={ () => setOpenMenuId( isMenuOpen ? null : license.id ) }
										style={ { background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: M3.onSurfaceVariant, borderRadius: '4px' } }
									>
										<MoreVertical size={ 16 } />
									</button>

									{ isMenuOpen && (
										<>
											<div onClick={ () => setOpenMenuId( null ) } style={ { position: 'fixed', inset: 0, zIndex: 10 } } />
											<div
												style={ {
													position: 'absolute', right: '16px', top: '40px', width: '200px',
													backgroundColor: M3.surface, borderRadius: '8px',
													boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)',
													border: `1px solid ${ M3.outlineVariant }`, zIndex: 20, padding: '4px 0', textAlign: 'left',
												} }
											>
												{ [
													{ label: __( 'View License Detail', 'purecart' ), icon: Eye, color: M3.onSurface, onClick: () => onViewDetail( license ) },
													{ label: __( 'View Customer', 'purecart' ), icon: User, color: M3.onSurface, onClick: () => onViewCustomer( license ) },
													{ label: __( 'Copy License Key', 'purecart' ), icon: Copy, color: M3.onSurface, onClick: () => onCopyKey( license ) },
													{ label: __( 'Duplicate License', 'purecart' ), icon: Duplicate, color: M3.onSurface, onClick: () => onDuplicate( license ) },
													{ label: __( 'Extend Expiry', 'purecart' ), icon: Calendar, color: M3.onSurface, onClick: () => onExtendExpiry( license ) },
													{ label: __( 'Reset Activations', 'purecart' ), icon: RotateCcw, color: M3.onSurface, onClick: () => onResetActivations( license ) },
													{ label: __( 'Send Reminder', 'purecart' ), icon: Bell, color: M3.onSurface, onClick: () => onSendReminder( license ) },
													...( license.status !== 'suspended'
														? [ { label: __( 'Suspend', 'purecart' ), icon: PauseCircle, color: M3.warning, onClick: () => onSuspend( license ) } ]
														: [ { label: __( 'Reinstate', 'purecart' ), icon: CheckCircle, color: M3.success, onClick: () => onReinstate( license ) } ] ),
												].map( ( action ) => (
													<button
														key={ action.label }
														onClick={ () => { setOpenMenuId( null ); action.onClick(); } }
														style={ {
															width: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px',
															border: 'none', background: 'none', fontSize: '13px', color: action.color, cursor: 'pointer',
														} }
													>
														<action.icon size={ 14 } />
														<span>{ action.label }</span>
													</button>
												) ) }

												<div style={ { height: '1px', backgroundColor: M3.outlineVariant, margin: '4px 0' } } />

												<button
													onClick={ () => { setOpenMenuId( null ); onRevoke( license ); } }
													style={ {
														width: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px',
														border: 'none', background: 'none', fontSize: '13px', color: M3.error, cursor: 'pointer',
													} }
												>
													<XCircle size={ 14 } />
													<span>{ __( 'Revoke', 'purecart' ) }</span>
												</button>
											</div>
										</>
									) }
								</td>
							</tr>
						);
					} ) }
				</tbody>
			</table>

			<div
				style={ {
					display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px',
					borderTop: `1px solid ${ M3.outlineVariant }`, fontSize: '12px', color: M3.onSurfaceVariant,
				} }
			>
				<span>
					{
						/* translators: 1: number of licenses shown on this page, 2: total matching licenses */
						sprintf( __( 'Showing %1$d of %2$d licenses', 'purecart' ), items.length, totalCount )
					}
				</span>
				<div style={ { display: 'flex', gap: '4px' } }>
					<button
						disabled={ currentPage <= 1 }
						onClick={ () => onPageChange( currentPage - 1 ) }
						style={ paginationButtonStyle( false, currentPage <= 1 ) }
					>
						{ __( 'Previous', 'purecart' ) }
					</button>
					{ Array.from( { length: totalPages }, ( _, i ) => i + 1 )
						.slice( Math.max( 0, currentPage - 3 ), Math.max( 0, currentPage - 3 ) + 5 )
						.map( ( p ) => (
							<button key={ p } onClick={ () => onPageChange( p ) } style={ paginationButtonStyle( p === currentPage, false ) }>
								{ p }
							</button>
						) ) }
					<button
						disabled={ currentPage >= totalPages }
						onClick={ () => onPageChange( currentPage + 1 ) }
						style={ paginationButtonStyle( false, currentPage >= totalPages ) }
					>
						{ __( 'Next', 'purecart' ) }
					</button>
				</div>
			</div>
		</div>
	);
}

function paginationButtonStyle( active: boolean, disabled: boolean ): React.CSSProperties {
	return {
		padding: '4px 10px',
		borderRadius: '6px',
		fontSize: '12px',
		cursor: disabled ? 'default' : 'pointer',
		opacity: disabled ? 0.4 : 1,
		backgroundColor: active ? M3.primary : 'transparent',
		color: active ? M3.onPrimary : M3.onSurfaceVariant,
		border: active ? 'none' : `1px solid ${ M3.outline }`,
	};
}
