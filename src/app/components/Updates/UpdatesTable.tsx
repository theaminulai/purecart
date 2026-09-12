import React, { useState } from 'react';
import { ChevronRight, ChevronDown, MoreVertical, FileText, ArrowUpCircle, RotateCcw, Archive, Trash2 } from 'lucide-react';
import { M3 } from '../../utils/static-data';
import { VersionBadge } from './VersionBadge';
import { PlatformChip } from './PlatformChip';
import { UpdateTokenDisplay } from './UpdateTokenDisplay';
import type { ProductVersion, UpdateChannel } from '../../types/updates';

interface UpdatesTableProps {
	items: ProductVersion[];
	loading: boolean;
	onViewChangelog: ( version: ProductVersion ) => void;
	onPromote: ( versionId: number, channel: UpdateChannel ) => void;
	onToggleStatus: ( versionId: number, status: 'active' | 'archived' ) => void;
	onRollback: ( version: ProductVersion ) => void;
	onDelete: ( versionId: number ) => void;
	onGenerateTestUrl: ( versionId: number ) => Promise<string>;
}

export function UpdatesTable( {
	items,
	loading,
	onViewChangelog,
	onPromote,
	onToggleStatus,
	onRollback,
	onDelete,
	onGenerateTestUrl,
}: UpdatesTableProps ) {
	const [ expandedRows, setExpandedRows ] = useState<number[]>( [] );
	const [ openMenuId, setOpenMenuId ] = useState<number | null>( null );

	const toggleRow = ( id: number ) => {
		setExpandedRows( ( prev ) =>
			prev.includes( id ) ? prev.filter( ( x ) => x !== id ) : [ ...prev, id ]
		);
	};

	const formatBytes = ( bytes: number ): string => {
		if ( ! bytes || bytes === 0 ) return '0 B';
		const k = 1024;
		const sizes = [ 'B', 'KB', 'MB', 'GB' ];
		const i = Math.floor( Math.log( bytes ) / Math.log( k ) );
		return `${ parseFloat( ( bytes / Math.pow( k, i ) ).toFixed( 1 ) ) } ${ sizes[ i ] }`;
	};

	if ( loading && items.length === 0 ) {
		return (
			<div
				style={ {
					padding: '48px',
					textAlign: 'center',
					backgroundColor: M3.surface,
					borderRadius: '12px',
					border: `1px solid ${ M3.outlineVariant }`,
					color: M3.onSurfaceVariant,
				} }
			>
				Loading release packages...
			</div>
		);
	}

	if ( items.length === 0 ) {
		return (
			<div
				style={ {
					padding: '48px',
					textAlign: 'center',
					backgroundColor: M3.surface,
					borderRadius: '12px',
					border: `1px solid ${ M3.outlineVariant }`,
					color: M3.onSurfaceVariant,
				} }
			>
				<p style={ { fontSize: '15px', fontWeight: 600, color: M3.onSurface, margin: '0 0 8px' } }>
					No software versions found
				</p>
				<p style={ { fontSize: '13px', margin: 0 } }>
					Click "+ New Release" above to upload your first plugin, theme, or software package.
				</p>
			</div>
		);
	}

	return (
		<div
			style={ {
				backgroundColor: M3.surface,
				borderRadius: '12px',
				border: `1px solid ${ M3.outlineVariant }`,
				overflow: 'hidden',
			} }
		>
			<table style={ { width: '100%', borderCollapse: 'collapse', textAlign: 'left' } }>
				<thead>
					<tr
						style={ {
							backgroundColor: M3.surfaceContainerLow,
							borderBottom: `1px solid ${ M3.outlineVariant }`,
							fontSize: '12px',
							fontWeight: 600,
							color: M3.onSurfaceVariant,
							textTransform: 'uppercase',
							letterSpacing: '0.04em',
						} }
					>
						<th style={ { width: '40px', padding: '12px 8px 12px 16px' } }></th>
						<th style={ { padding: '12px 16px' } }>Product & Version</th>
						<th style={ { padding: '12px 16px' } }>Channel</th>
						<th style={ { padding: '12px 16px' } }>Platform</th>
						<th style={ { padding: '12px 16px' } }>Size</th>
						<th style={ { padding: '12px 16px' } }>Downloads</th>
						<th style={ { padding: '12px 16px' } }>Released</th>
						<th style={ { width: '60px', padding: '12px 16px', textAlign: 'right' } }>Actions</th>
					</tr>
				</thead>
				<tbody>
					{ items.map( ( item ) => {
						const isExpanded = expandedRows.includes( item.id );
						const isMenuOpen = openMenuId === item.id;

						return (
							<React.Fragment key={ item.id }>
								<tr
									style={ {
										borderBottom: `1px solid ${ M3.outlineVariant }`,
										backgroundColor: isExpanded ? M3.surfaceContainerLow : 'transparent',
										transition: 'background-color 0.15s ease',
									} }
								>
									{ /* Expand Chevron */ }
									<td style={ { padding: '12px 8px 12px 16px' } }>
										<button
											onClick={ () => toggleRow( item.id ) }
											style={ {
												background: 'none',
												border: 'none',
												cursor: 'pointer',
												padding: '2px',
												display: 'flex',
												alignItems: 'center',
												color: M3.onSurfaceVariant,
											} }
										>
											{ isExpanded ? <ChevronDown size={ 16 } /> : <ChevronRight size={ 16 } /> }
										</button>
									</td>

									{ /* Product & Version */ }
									<td style={ { padding: '12px 16px' } }>
										<div style={ { display: 'flex', alignItems: 'center', gap: '8px' } }>
											<span style={ { fontSize: '13px', fontWeight: 600, color: M3.onSurface } }>
												{ item.productName }
											</span>
											<VersionBadge version={ item.version } channel={ item.channel } />
											{ item.status === 'archived' && (
												<span
													style={ {
														fontSize: '10px',
														textTransform: 'uppercase',
														fontWeight: 700,
														padding: '1px 5px',
														borderRadius: '4px',
														backgroundColor: M3.surfaceContainerHigh,
														color: M3.onSurfaceVariant,
													} }
												>
													Archived
												</span>
											) }
										</div>
									</td>

									{ /* Channel */ }
									<td style={ { padding: '12px 16px' } }>
										<span
											style={ {
												fontSize: '12px',
												textTransform: 'capitalize',
												fontWeight: 500,
												color: item.channel === 'stable' ? M3.success : item.channel === 'beta' ? M3.warning : M3.onSurfaceVariant,
											} }
										>
											{ item.channel }
										</span>
									</td>

									{ /* Platform */ }
									<td style={ { padding: '12px 16px' } }>
										<PlatformChip platform={ item.platform } />
									</td>

									{ /* File Size */ }
									<td style={ { padding: '12px 16px', fontSize: '13px', color: M3.onSurfaceVariant } }>
										{ formatBytes( item.fileSize ) }
									</td>

									{ /* Downloads */ }
									<td style={ { padding: '12px 16px', fontSize: '13px', fontWeight: 500, color: M3.onSurface } }>
										{ item.downloadCount || 0 }
									</td>

									{ /* Released Date */ }
									<td style={ { padding: '12px 16px', fontSize: '12px', color: M3.onSurfaceVariant } }>
										{ item.publishedAt ? new Date( item.publishedAt ).toLocaleDateString() : 'Draft' }
									</td>

									{ /* Actions */ }
									<td style={ { padding: '12px 16px', textAlign: 'right', position: 'relative' } }>
										<button
											onClick={ () => setOpenMenuId( isMenuOpen ? null : item.id ) }
											style={ {
												background: 'none',
												border: 'none',
												cursor: 'pointer',
												padding: '4px',
												color: M3.onSurfaceVariant,
												borderRadius: '4px',
											} }
										>
											<MoreVertical size={ 16 } />
										</button>

										{ isMenuOpen && (
											<>
												<div
													onClick={ () => setOpenMenuId( null ) }
													style={ { position: 'fixed', inset: 0, zIndex: 10 } }
												/>
												<div
													style={ {
														position: 'absolute',
														right: '16px',
														top: '40px',
														width: '180px',
														backgroundColor: M3.surface,
														borderRadius: '8px',
														boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)',
														border: `1px solid ${ M3.outlineVariant }`,
														zIndex: 20,
														padding: '4px 0',
														textAlign: 'left',
													} }
												>
													<button
														onClick={ () => { setOpenMenuId( null ); onViewChangelog( item ); } }
														style={ {
															width: '100%',
															display: 'flex',
															alignItems: 'center',
															gap: '8px',
															padding: '8px 12px',
															border: 'none',
															background: 'none',
															fontSize: '13px',
															color: M3.onSurface,
															cursor: 'pointer',
														} }
													>
														<FileText size={ 14 } color={ M3.primary } />
														<span>View Changelog</span>
													</button>

													{ item.channel !== 'stable' && (
														<button
															onClick={ () => { setOpenMenuId( null ); onPromote( item.id, 'stable' ); } }
															style={ {
																width: '100%',
																display: 'flex',
																alignItems: 'center',
																gap: '8px',
																padding: '8px 12px',
																border: 'none',
																background: 'none',
																fontSize: '13px',
																color: M3.success,
																cursor: 'pointer',
															} }
														>
															<ArrowUpCircle size={ 14 } />
															<span>Promote to Stable</span>
														</button>
													) }

													<button
														onClick={ () => {
															setOpenMenuId( null );
															onToggleStatus( item.id, item.status === 'active' ? 'archived' : 'active' );
														} }
														style={ {
															width: '100%',
															display: 'flex',
															alignItems: 'center',
															gap: '8px',
															padding: '8px 12px',
															border: 'none',
															background: 'none',
															fontSize: '13px',
															color: M3.onSurface,
															cursor: 'pointer',
														} }
													>
														<Archive size={ 14 } />
														<span>{ item.status === 'active' ? 'Archive Package' : 'Unarchive Package' }</span>
													</button>

													<button
														onClick={ () => { setOpenMenuId( null ); onRollback( item ); } }
														style={ {
															width: '100%',
															display: 'flex',
															alignItems: 'center',
															gap: '8px',
															padding: '8px 12px',
															border: 'none',
															background: 'none',
															fontSize: '13px',
															color: M3.warning,
															cursor: 'pointer',
														} }
													>
														<RotateCcw size={ 14 } />
														<span>Emergency Rollback</span>
													</button>

													<div style={ { height: '1px', backgroundColor: M3.outlineVariant, margin: '4px 0' } } />

													<button
														onClick={ () => { setOpenMenuId( null ); onDelete( item.id ); } }
														style={ {
															width: '100%',
															display: 'flex',
															alignItems: 'center',
															gap: '8px',
															padding: '8px 12px',
															border: 'none',
															background: 'none',
															fontSize: '13px',
															color: M3.error,
															cursor: 'pointer',
														} }
													>
														<Trash2 size={ 14 } />
														<span>Delete Package</span>
													</button>
												</div>
											</>
										) }
									</td>
								</tr>

								{ /* Expanded Details */ }
								{ isExpanded && (
									<tr>
										<td colSpan={ 8 } style={ { padding: '12px 24px', backgroundColor: M3.surfaceContainerLow, borderBottom: `1px solid ${ M3.outlineVariant }` } }>
											<UpdateTokenDisplay
												checksum={ item.checksumSha256 }
												versionId={ item.id }
												onGenerateTestUrl={ onGenerateTestUrl }
											/>
										</td>
									</tr>
								) }
							</React.Fragment>
						);
					} ) }
				</tbody>
			</table>
		</div>
	);
}
