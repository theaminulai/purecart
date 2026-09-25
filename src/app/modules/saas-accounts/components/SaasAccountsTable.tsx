/**
 * SaasAccountsTable component.
 *
 * Renders the SaaS Accounts list — columns, the per-row ⋮ action menu, and
 * the pagination footer. Rows are clickable and open the detail panel; the
 * ⋮ menu comes from useSaasAccountActions so the table and the panel drive
 * the same actions.
 *
 * Unlike the Licenses/Downloads tables there is no row selection: the
 * backend exposes no bulk route for SaaS accounts (see
 * docs/saas-module/dev-plan-saas-frontend.md's Appendix — bulk actions are
 * deliberately out of scope until one exists).
 *
 * @file
 * @since 1.0.0
 */
import React from 'react';
import { __, sprintf } from '@wordpress/i18n';
import { M3 } from '@/theme';
import { StatusBadge } from '@/shared/ui/StatusBadge';
import { ActionDropdown } from '@/shared/ui/ActionDropdown';
import type { ActionItem } from '@/shared/ui';
import { saasPlanLabel, formatProvisionedAt } from '../constants';
import type { SaasAccountRecord } from '../types';

interface SaasAccountsTableProps {
	items: SaasAccountRecord[];
	loading: boolean;
	currentPage: number;
	totalPages: number;
	totalCount: number;
	onPageChange: ( page: number ) => void;
	onViewDetail: ( account: SaasAccountRecord ) => void;
	rowActions: ( account: SaasAccountRecord ) => ActionItem[];
}

/**
 * Renders the SaaS Accounts table: header, rows, action menu, pagination.
 *
 * @since 1.0.0
 *
 * @param {SaasAccountsTableProps} props Component props.
 * @return {JSX.Element} The table, or its loading/empty placeholder.
 */
export function SaasAccountsTable( {
	items,
	loading,
	currentPage,
	totalPages,
	totalCount,
	onPageChange,
	onViewDetail,
	rowActions,
}: SaasAccountsTableProps ) {
	if ( loading && 0 === items.length ) {
		return <Placeholder>{ __( 'Loading SaaS accounts…', 'purecart' ) }</Placeholder>;
	}

	if ( 0 === items.length ) {
		return (
			<Placeholder>
				<p style={ { fontSize: '15px', fontWeight: 600, color: M3.onSurface, margin: '0 0 8px' } }>
					{ __( 'No SaaS accounts yet', 'purecart' ) }
				</p>
				<p style={ { fontSize: '13px', margin: 0 } }>
					{ __(
						'Accounts appear here automatically once an order containing a SaaS product completes.',
						'purecart'
					) }
				</p>
			</Placeholder>
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
			{ /* Narrow viewports scroll the table sideways rather than
			     squashing the key/date columns into illegibility. */ }
			<div style={ { overflowX: 'auto' } }>
				<table style={ { width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '860px' } }>
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
							<th style={ { padding: '12px 16px' } }>{ __( 'Customer', 'purecart' ) }</th>
							<th style={ { padding: '12px 16px' } }>{ __( 'Product', 'purecart' ) }</th>
							<th style={ { padding: '12px 16px' } }>{ __( 'Plan', 'purecart' ) }</th>
							<th style={ { padding: '12px 16px' } }>{ __( 'API Key', 'purecart' ) }</th>
							<th style={ { padding: '12px 16px' } }>{ __( 'Status', 'purecart' ) }</th>
							<th style={ { padding: '12px 16px' } }>{ __( 'Provisioned', 'purecart' ) }</th>
							<th style={ { width: '60px', padding: '12px 16px', textAlign: 'right' } }>
								{ __( 'Actions', 'purecart' ) }
							</th>
						</tr>
					</thead>
					<tbody>
						{ items.map( ( account, i ) => (
							<tr
								key={ account.id }
								onClick={ () => onViewDetail( account ) }
								style={ {
									borderBottom: `1px solid ${ M3.outlineVariant }`,
									borderLeft:
										'suspended' === account.status
											? `3px solid ${ M3.warning }`
											: '3px solid transparent',
									backgroundColor: 0 === i % 2 ? M3.surface : M3.surfaceContainerLow,
									cursor: 'pointer',
								} }
							>
								<td style={ { padding: '12px 16px' } }>
									<div style={ { fontSize: '13px', fontWeight: 500, color: M3.onSurface } }>
										{ account.customerName ||
											/* translators: %s: order number, shown when an account has no resolved customer name */
											sprintf( __( 'Order #%s', 'purecart' ), account.orderNumber ) }
									</div>
									<div style={ { fontSize: '12px', color: M3.onSurfaceVariant } }>
										{ account.customerEmail }
									</div>
								</td>
								<td style={ { padding: '12px 16px' } }>
									<div style={ { fontSize: '13px', color: M3.onSurface } }>{ account.productName }</div>
									<div style={ { fontSize: '12px', color: M3.onSurfaceVariant } }>
										{
											/* translators: %s: WooCommerce order number */
											sprintf( __( 'Order #%s', 'purecart' ), account.orderNumber )
										}
									</div>
								</td>
								<td style={ { padding: '12px 16px' } }>
									<span
										className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
										style={ {
											backgroundColor: M3.secondaryContainer,
											color: M3.onSecondaryContainer,
											fontFamily: 'Roboto, sans-serif',
										} }
									>
										{ saasPlanLabel( account.plan ) }
									</span>
								</td>
								<td
									style={ {
										padding: '12px 16px',
										fontSize: '12px',
										fontFamily: 'Roboto Mono, monospace',
										color: M3.onSurfaceVariant,
										whiteSpace: 'nowrap',
									} }
								>
									{ account.apiKeyMasked }
								</td>
								<td style={ { padding: '12px 16px' } }>
									<StatusBadge status={ account.status } />
								</td>
								<td
									style={ {
										padding: '12px 16px',
										fontSize: '12px',
										color: M3.onSurfaceVariant,
										whiteSpace: 'nowrap',
									} }
								>
									{ formatProvisionedAt( account.provisionedAt ) }
								</td>
								<td style={ { padding: '12px 16px', textAlign: 'right' } }>
									<ActionDropdown actions={ rowActions( account ) } />
								</td>
							</tr>
						) ) }
					</tbody>
				</table>
			</div>

			<div
				style={ {
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'space-between',
					padding: '12px 16px',
					borderTop: `1px solid ${ M3.outlineVariant }`,
					fontSize: '12px',
					color: M3.onSurfaceVariant,
				} }
			>
				<span>
					{
						/* translators: 1: accounts shown on this page, 2: total matching accounts */
						sprintf( __( 'Showing %1$d of %2$d accounts', 'purecart' ), items.length, totalCount )
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
							<button
								key={ p }
								onClick={ () => onPageChange( p ) }
								style={ paginationButtonStyle( p === currentPage, false ) }
							>
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

/** Shared frame for the table's loading and empty states. */
function Placeholder( { children }: { children: React.ReactNode } ) {
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
			{ children }
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
