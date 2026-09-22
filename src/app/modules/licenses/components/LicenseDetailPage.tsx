/**
 * LicenseDetailPage - full detail view for one license.
 *
 * Reads `id` from the route (`/licenses/:id`). Suspends on the true first
 * load via getOrCreateResource (same pattern as LicensesPage/UpdatesPage),
 * then keeps its own local copy of the license/activations/JWT status so a
 * mutation on this page (extend, suspend, revoke, ...) can refresh in place
 * without waiting on the list page's Redux store.
 *
 * @file
 * @since 1.0.0
 */
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, RotateCcw, PauseCircle, CheckCircle, XCircle, Bell } from 'lucide-react';
import { __, sprintf } from '@wordpress/i18n';
import { M3 } from '@/theme';
import { getOrCreateResource } from '@/shared/suspense';
import { StatusBadge } from '@/shared/ui/StatusBadge';
import { OutlinedButton } from '@/shared/ui/OutlinedButton';
import { FilledButton } from '@/shared/ui/FilledButton';
import { TonalButton } from '@/shared/ui/TonalButton';
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog';
import { Toast, type ToastProps } from '@/shared/ui/Toast';
import { Card } from '@/shared/ui/Card';
import { LicenseKeyReveal, JwtTokenStatusChip } from './shared';
import { planLabel, environmentLabel, environmentBadgeStyle } from '../constants';
import {
	fetchLicense,
	extendLicense,
	suspendLicense,
	reinstateLicense,
	revokeLicense,
	resetLicenseActivations,
} from '../api';
import { PAGE_PATHS } from '@/app/router';
import type { LicenseDetailResponse } from '../types';

interface DialogState {
	open: boolean;
	danger: boolean;
	icon: React.ElementType;
	title: string;
	body: React.ReactNode;
	confirmLabel: string;
	onConfirm: () => void;
}

const EMPTY_DIALOG: DialogState = {
	open: false, danger: false, icon: Calendar, title: '', body: null, confirmLabel: '', onConfirm: () => {},
};

/**
 * Renders the License Detail page.
 *
 * @since 1.0.0
 */
export function LicenseDetailPage() {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const numericId = Number( id );

	const { resource } = getOrCreateResource( `license-detail-${ numericId }`, () => fetchLicense( numericId ) );
	const initialData = resource.read();

	const [ data, setData ] = useState< LicenseDetailResponse >( initialData );
	const [ toast, setToast ] = useState< ToastProps >( { message: '', type: 'success', visible: false } );
	const [ dialog, setDialog ] = useState< DialogState >( EMPTY_DIALOG );
	const [ extendDays, setExtendDays ] = useState( 30 );

	useEffect( () => {
		setData( initialData );
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ numericId ] );

	const showToast = ( message: string, type: ToastProps[ 'type' ] = 'success' ) => {
		setToast( { message, type, visible: true } );
		setTimeout( () => setToast( ( t ) => ( { ...t, visible: false } ) ), 3000 );
	};

	const closeDialog = () => setDialog( EMPTY_DIALOG );

	const refresh = async () => setData( await fetchLicense( numericId ) );

	const { license, activations, jwtStatus } = data;

	const handleExtend = () => {
		setExtendDays( 30 );
		setDialog( {
			open: true, danger: false, icon: Calendar, title: __( 'Extend Expiry', 'purecart' ),
			body: (
				<div className="flex flex-col items-center gap-2">
					<span>{ __( "Push this license's expiry forward by", 'purecart' ) }</span>
					<input
						type="number" min={ 1 } defaultValue={ 30 }
						onChange={ ( e ) => setExtendDays( Math.max( 1, parseInt( e.target.value, 10 ) || 1 ) ) }
						style={ { width: 80, padding: '6px 10px', borderRadius: 8, border: `1px solid ${ M3.outlineVariant }`, textAlign: 'center', fontFamily: 'Roboto Mono, monospace' } }
					/>
					<span>{ __( 'days', 'purecart' ) }</span>
				</div>
			),
			confirmLabel: __( 'Extend', 'purecart' ),
			onConfirm: async () => {
				try {
					await extendLicense( license.id, extendDays );
					await refresh();
					showToast( __( 'License expiry extended', 'purecart' ), 'success' );
				} catch ( err: any ) {
					showToast(
						err?.message || __( 'Could not extend this license (lifetime plans have no expiry)', 'purecart' ),
						'error'
					);
				}
				closeDialog();
			},
		} );
	};

	const handleResetActivations = () => {
		setDialog( {
			open: true, danger: false, icon: RotateCcw, title: __( 'Reset Activations?', 'purecart' ),
			body: __( 'Clear every activated site on this license? The customer will need to re-activate each domain.', 'purecart' ),
			confirmLabel: __( 'Reset Activations', 'purecart' ),
			onConfirm: async () => {
				await resetLicenseActivations( license.id );
				await refresh();
				showToast( __( 'Activations reset', 'purecart' ), 'success' );
				closeDialog();
			},
		} );
	};

	const handleSuspend = () => {
		setDialog( {
			open: true, danger: false, icon: PauseCircle, title: __( 'Suspend License?', 'purecart' ),
			body: __( "Suspend this license? Updates and activation checks will stop working until it's reinstated.", 'purecart' ),
			confirmLabel: __( 'Suspend', 'purecart' ),
			onConfirm: async () => {
				await suspendLicense( license.id );
				await refresh();
				showToast( __( 'License suspended', 'purecart' ), 'warning' );
				closeDialog();
			},
		} );
	};

	const handleReinstate = () => {
		setDialog( {
			open: true, danger: false, icon: CheckCircle, title: __( 'Reinstate License?', 'purecart' ),
			body: __( 'Reinstate this license to active status?', 'purecart' ),
			confirmLabel: __( 'Reinstate', 'purecart' ),
			onConfirm: async () => {
				await reinstateLicense( license.id );
				await refresh();
				showToast( __( 'License reinstated', 'purecart' ), 'success' );
				closeDialog();
			},
		} );
	};

	const handleRevoke = () => {
		setDialog( {
			open: true, danger: true, icon: XCircle, title: __( 'Revoke License?', 'purecart' ),
			body: (
				<>
					{ __( 'Permanently revoke', 'purecart' ) }{ ' ' }
					<code style={ { fontFamily: 'Roboto Mono, monospace' } }>{ license.licenseKey }</code>?
					{ ' ' }{ __( 'This immediately stops all updates and activation checks. This cannot be undone.', 'purecart' ) }
				</>
			),
			confirmLabel: __( 'Revoke License', 'purecart' ),
			onConfirm: async () => {
				await revokeLicense( license.id );
				await refresh();
				showToast( __( 'License revoked', 'purecart' ), 'error' );
				closeDialog();
			},
		} );
	};

	const sitesPct = license.activationLimit > 0
		? Math.min( 100, Math.round( ( license.activatedCount / license.activationLimit ) * 100 ) )
		: 0;

	return (
		<div className="flex flex-col gap-5">
			<div className="flex items-center gap-3">
				<OutlinedButton small onClick={ () => navigate( PAGE_PATHS.licenses ) }>
					<ArrowLeft size={ 14 } /> { __( 'Back', 'purecart' ) }
				</OutlinedButton>
				<h1 style={ { margin: 0, fontSize: '20px', fontWeight: 700, color: M3.onSurface } }>{ __( 'License Detail', 'purecart' ) }</h1>
			</div>

			<div className="grid grid-cols-5 gap-5">
				<Card className="col-span-3 p-5 flex flex-col gap-4">
					<div className="flex items-center justify-between">
						<LicenseKeyReveal licenseKey={ license.licenseKey } size="large" />
						<StatusBadge status={ license.status } />
					</div>

					<div className="grid grid-cols-2 gap-4">
						<Field label={ __( 'Plan', 'purecart' ) }>
							<span
								style={ {
									fontSize: '12px', fontWeight: 600, padding: '2px 8px', borderRadius: '999px',
									backgroundColor: M3.secondaryContainer, color: M3.onSecondaryContainer,
								} }
							>
								{ planLabel( license.planType ) }
							</span>
						</Field>
						<Field label={ __( 'Product', 'purecart' ) }>
							<span style={ { fontSize: '13px', color: M3.onSurface } }>
								{ /* translators: 1: product name, 2: order id */
								sprintf( __( '%1$s (order #%2$s)', 'purecart' ), license.productName, String( license.orderId ) ) }
							</span>
						</Field>
						<Field label={ __( 'Sites Used', 'purecart' ) }>
							<div className="flex flex-col gap-1">
								<span style={ { fontFamily: 'Roboto Mono, monospace', fontSize: '13px', color: M3.onSurface } }>
									{ license.activatedCount } / { 'unlimited' === license.planType ? '∞' : license.activationLimit }
								</span>
								{ 'unlimited' !== license.planType && (
									<div style={ { width: 160, height: 6, borderRadius: 999, backgroundColor: M3.outlineVariant, overflow: 'hidden' } }>
										<div style={ { width: `${ sitesPct }%`, height: '100%', backgroundColor: sitesPct >= 100 ? M3.error : M3.primary } } />
									</div>
								) }
							</div>
						</Field>
						<Field label={ __( 'Expires', 'purecart' ) }>
							<span style={ { fontSize: '13px', color: M3.onSurface } }>
								{ license.expiresAt ? new Date( license.expiresAt ).toLocaleDateString() : __( 'Lifetime', 'purecart' ) }
							</span>
						</Field>
						<Field label={ __( 'Created', 'purecart' ) }>
							<span style={ { fontSize: '13px', color: M3.onSurfaceVariant } }>
								{ new Date( license.createdAt ).toLocaleDateString() }
							</span>
						</Field>
						<Field label={ __( 'Customer', 'purecart' ) }>
							<div>
								<div style={ { fontSize: '13px', color: M3.onSurface } }>
									{ license.customerName ||
										/* translators: %s: customer user id */
										sprintf( __( 'Customer #%s', 'purecart' ), String( license.userId ) ) }
								</div>
								<div style={ { fontSize: '12px', color: M3.onSurfaceVariant } }>{ license.customerEmail }</div>
							</div>
						</Field>
					</div>

					<div className="pt-3 flex flex-wrap gap-2" style={ { borderTop: `1px solid ${ M3.outlineVariant }` } }>
						<FilledButton small onClick={ handleExtend }><Calendar size={ 14 } /> { __( 'Extend Expiry', 'purecart' ) }</FilledButton>
						<TonalButton small onClick={ handleResetActivations }><RotateCcw size={ 14 } /> { __( 'Reset Activations', 'purecart' ) }</TonalButton>
						<OutlinedButton
							small
							onClick={ () =>
								showToast(
									/* translators: %s: customer email address */
									sprintf( __( 'Reminder sent to %s', 'purecart' ), license.customerEmail || __( 'customer', 'purecart' ) ),
									'success'
								)
							}
						>
							<Bell size={ 14 } /> { __( 'Send Reminder', 'purecart' ) }
						</OutlinedButton>
						{ license.status !== 'suspended' ? (
							<OutlinedButton small onClick={ handleSuspend }><PauseCircle size={ 14 } /> { __( 'Suspend', 'purecart' ) }</OutlinedButton>
						) : (
							<OutlinedButton small onClick={ handleReinstate }><CheckCircle size={ 14 } /> { __( 'Reinstate', 'purecart' ) }</OutlinedButton>
						) }
						<FilledButton danger small onClick={ handleRevoke }><XCircle size={ 14 } /> { __( 'Revoke License', 'purecart' ) }</FilledButton>
					</div>
				</Card>

				<Card className="col-span-2 p-5 flex flex-col gap-3">
					<div style={ { fontSize: '14px', fontWeight: 600, color: M3.onSurface } }>{ __( 'Activation Records', 'purecart' ) }</div>
					{ activations.length === 0 ? (
						<div style={ { fontSize: '13px', color: M3.onSurfaceVariant } }>{ __( 'No sites have activated this license yet.', 'purecart' ) }</div>
					) : (
						<div className="flex flex-col gap-2">
							{ activations.map( ( a ) => (
								<div
									key={ a.id }
									className="flex items-center justify-between p-2 rounded-lg"
									style={ { backgroundColor: M3.surfaceContainerLow } }
								>
									<div>
										<div style={ { fontFamily: 'Roboto Mono, monospace', fontSize: '12px', color: M3.onSurface } }>{ a.domain }</div>
										<div style={ { fontSize: '11px', color: M3.onSurfaceVariant } }>
											{
												/* translators: %s: activation date */
												sprintf( __( 'Activated %s', 'purecart' ), new Date( a.activatedAt ).toLocaleDateString() )
											}
											{ a.lastCheck &&
												/* translators: %s: last check date */
												` · ${ sprintf( __( 'Last check %s', 'purecart' ), new Date( a.lastCheck ).toLocaleDateString() ) }` }
										</div>
									</div>
									<span
										className="text-xs px-2 py-0.5 rounded-full"
										style={ { backgroundColor: environmentBadgeStyle( a.environment ).bg, color: environmentBadgeStyle( a.environment ).color } }
									>
										{ environmentLabel( a.environment ) }
									</span>
								</div>
							) ) }
						</div>
					) }

					<div className="pt-3 flex flex-col gap-2" style={ { borderTop: `1px solid ${ M3.outlineVariant }` } }>
						<div style={ { fontSize: '14px', fontWeight: 600, color: M3.onSurface } }>{ __( 'JWT Token', 'purecart' ) }</div>
						<JwtTokenStatusChip status={ jwtStatus } />
						{ jwtStatus.accessTokenExpiresAt && (
							<div style={ { fontSize: '12px', color: M3.onSurfaceVariant } }>
								{
									/* translators: %s: token expiry date/time */
									sprintf( __( 'Access token expires %s', 'purecart' ), new Date( jwtStatus.accessTokenExpiresAt ).toLocaleString() )
								}
							</div>
						) }
					</div>
				</Card>
			</div>

			<ConfirmDialog
				open={ dialog.open }
				danger={ dialog.danger }
				icon={ dialog.icon }
				title={ dialog.title }
				body={ dialog.body }
				confirmLabel={ dialog.confirmLabel }
				onConfirm={ dialog.onConfirm }
				onCancel={ closeDialog }
			/>

			<Toast { ...toast } />
		</div>
	);
}

function Field( { label, children }: { label: string; children: React.ReactNode } ) {
	return (
		<div>
			<div
				style={ {
					fontSize: '11px', fontWeight: 500, color: M3.onSurfaceVariant, textTransform: 'uppercase',
					letterSpacing: '0.5px', marginBottom: 4,
				} }
			>
				{ label }
			</div>
			{ children }
		</div>
	);
}
