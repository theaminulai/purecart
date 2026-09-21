/**
 * DownloadsTable component.
 *
 * Renders the Downloads log page's table — columns, row selection, the
 * per-row action menu, and pagination footer, per
 * docs/RND-frontend-secure-downloads.md Screen 1.
 *
 * @file
 * @since 1.0.0
 */
import React, { useState } from 'react';
import { MoreVertical, ExternalLink, User, RotateCcw, XCircle } from 'lucide-react';
import { __, sprintf } from '@wordpress/i18n';
import { M3 } from '@/theme';
import { DownloadStatusBadge, FileTypeChip } from './shared';
import type { DownloadLogEntry } from '../types';

interface DownloadsTableProps {
	items: DownloadLogEntry[];
	loading: boolean;
	selected: number[];
	onToggleSelect: ( id: number ) => void;
	onToggleSelectAll: ( checked: boolean ) => void;
	currentPage: number;
	totalPages: number;
	totalCount: number;
	onPageChange: ( page: number ) => void;
	onViewCustomer: ( entry: DownloadLogEntry ) => void;
	onRegenerateToken: ( entry: DownloadLogEntry ) => void;
	onRevokeToken: ( entry: DownloadLogEntry ) => void;
}

/**
 * Renders the Downloads log table: header, rows, per-row action menu, pagination.
 *
 * @since 1.0.0
 */
export function DownloadsTable( {
	items,
	loading,
	selected,
	onToggleSelect,
	onToggleSelectAll,
	currentPage,
	totalPages,
	totalCount,
	onPageChange,
	onViewCustomer,
	onRegenerateToken,
	onRevokeToken,
}: DownloadsTableProps ) {
	const [ openMenuId, setOpenMenuId ] = useState< number | null >( null );

	if ( loading && items.length === 0 ) {
		return (
			<div
				style={ {
					padding: '48px', textAlign: 'center', backgroundColor: M3.surface,
					borderRadius: '12px', border: `1px solid ${ M3.outlineVariant }`, color: M3.onSurfaceVariant,
				} }
			>
				{ __( 'Loading download log…', 'purecart' ) }
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
				<p style={ { fontSize: '15px', fontWeight: 600, color: M3.onSurface, margin: '0 0 8px' } }>{ __( 'No downloads found', 'purecart' ) }</p>
				<p style={ { fontSize: '13px', margin: 0 } }>{ __( 'Download attempts are logged automatically when a customer uses a download link.', 'purecart' ) }</p>
			</div>
		);
	}

	const allSelected = items.length > 0 && items.every( ( i ) => selected.includes( i.downloadId ) );

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
						<th style={ { padding: '12px 16px' } }>{ __( 'Time', 'purecart' ) }</th>
						<th style={ { padding: '12px 16px' } }>{ __( 'Customer', 'purecart' ) }</th>
						<th style={ { padding: '12px 16px' } }>{ __( 'Product + File', 'purecart' ) }</th>
						<th style={ { padding: '12px 16px' } }>{ __( 'File Type', 'purecart' ) }</th>
						<th style={ { padding: '12px 16px' } }>{ __( 'IP', 'purecart' ) }</th>
						<th style={ { padding: '12px 16px' } }>{ __( 'Status', 'purecart' ) }</th>
						<th style={ { width: '60px', padding: '12px 16px', textAlign: 'right' } }>{ __( 'Actions', 'purecart' ) }</th>
					</tr>
				</thead>
				<tbody>
					{ items.map( ( entry, i ) => {
						const isMenuOpen = openMenuId === entry.id;
						const isSelected = selected.includes( entry.downloadId );
						const isRejected = entry.status !== 'success';

						return (
							<tr
								key={ entry.id }
								style={ {
									borderBottom: `1px solid ${ M3.outlineVariant }`,
									borderLeft: isRejected ? `3px solid ${ M3.error }` : '3px solid transparent',
									backgroundColor: isSelected
										? `${ M3.primary }14`
										: isRejected
											? `${ M3.error }08`
											: i % 2 === 0
												? M3.surface
												: M3.surfaceContainerLow,
								} }
							>
								<td style={ { padding: '12px 8px 12px 16px' } }>
									<input type="checkbox" checked={ isSelected } onChange={ () => onToggleSelect( entry.downloadId ) } />
								</td>
								<td style={ { padding: '12px 16px', fontSize: '12px', color: M3.onSurfaceVariant } }>
									{ new Date( entry.downloadedAt ).toLocaleString() }
								</td>
								<td style={ { padding: '12px 16px' } }>
									<button
										onClick={ () => onViewCustomer( entry ) }
										style={ {
											background: 'none', border: 'none', cursor: 'pointer', padding: 0,
											fontSize: '13px', fontWeight: 500, color: M3.primary, fontFamily: 'Roboto, sans-serif',
										} }
									>
										{ entry.customerName ||
											/* translators: %s: order ID, shown when a download log entry has no resolved customer name */
											sprintf( __( 'Order #%s', 'purecart' ), String( entry.orderId ) ) }
									</button>
									<div style={ { fontSize: '12px', color: M3.onSurfaceVariant } }>{ entry.customerEmail }</div>
								</td>
								<td style={ { padding: '12px 16px' } }>
									<div style={ { fontSize: '13px', color: M3.onSurface } }>{ entry.productName }</div>
									<div style={ { fontSize: '12px', color: M3.onSurfaceVariant } }>{ entry.fileLabel }</div>
								</td>
								<td style={ { padding: '12px 16px' } }>
									<FileTypeChip extension={ entry.fileExtension } />
								</td>
								<td style={ { padding: '12px 16px', fontSize: '12px', fontFamily: 'Roboto Mono, monospace', color: M3.onSurfaceVariant } }>
									{ entry.ipAddress }
								</td>
								<td style={ { padding: '12px 16px' } }>
									<DownloadStatusBadge status={ entry.status } />
								</td>
								<td style={ { padding: '12px 16px', textAlign: 'right', position: 'relative' } }>
									<button
										onClick={ () => setOpenMenuId( isMenuOpen ? null : entry.id ) }
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
													{
														label: __( 'View Order', 'purecart' ),
														icon: ExternalLink,
														color: M3.onSurface,
														onClick: () => {
															const adminUrl = window.purecartAdmin?.adminUrl;
															if ( adminUrl ) {
																window.open( `${ adminUrl }post.php?post=${ entry.orderId }&action=edit`, '_blank' );
															}
														},
													},
													{ label: __( 'View Customer', 'purecart' ), icon: User, color: M3.onSurface, onClick: () => onViewCustomer( entry ) },
													{ label: __( 'Regenerate Token', 'purecart' ), icon: RotateCcw, color: M3.onSurface, onClick: () => onRegenerateToken( entry ) },
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

												{ 'success' === entry.status && (
													<>
														<div style={ { height: '1px', backgroundColor: M3.outlineVariant, margin: '4px 0' } } />
														<button
															onClick={ () => { setOpenMenuId( null ); onRevokeToken( entry ); } }
															style={ {
																width: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px',
																border: 'none', background: 'none', fontSize: '13px', color: M3.error, cursor: 'pointer',
															} }
														>
															<XCircle size={ 14 } />
															<span>{ __( 'Revoke Token', 'purecart' ) }</span>
														</button>
													</>
												) }
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
						/* translators: 1: number of log entries shown on this page, 2: total matching entries */
						sprintf( __( 'Showing %1$d of %2$d downloads', 'purecart' ), items.length, totalCount )
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
