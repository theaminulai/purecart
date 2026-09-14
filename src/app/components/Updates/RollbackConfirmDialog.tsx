import React, { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { M3 } from '../../utils/static-data';

interface RollbackConfirmDialogProps {
	isOpen: boolean;
	onClose: () => void;
	onConfirm: ( reason: string ) => void;
	productName: string;
	fromVersion: string;
	toVersion: string;
	loading?: boolean;
}

export function RollbackConfirmDialog( {
	isOpen,
	onClose,
	onConfirm,
	productName,
	fromVersion,
	toVersion,
	loading = false,
}: RollbackConfirmDialogProps ) {
	const [ reason, setReason ] = useState( '' );

	if ( ! isOpen ) return null;

	const handleConfirm = () => {
		if ( ! reason.trim() ) return;
		onConfirm( reason.trim() );
	};

	return (
		<div
			style={ {
				position: 'fixed',
				inset: 0,
				backgroundColor: 'rgba(0, 0, 0, 0.55)',
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				zIndex: 9999,
				padding: '16px',
			} }
		>
			<div
				style={ {
					backgroundColor: M3.surface,
					borderRadius: '16px',
					width: '100%',
					maxWidth: '480px',
					overflow: 'hidden',
					boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
				} }
			>
				{ /* Header */ }
				<div
					style={ {
						padding: '16px 20px',
						backgroundColor: M3.errorContainer,
						borderBottom: `1px solid ${ M3.outlineVariant }`,
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'space-between',
					} }
				>
					<div style={ { display: 'flex', alignItems: 'center', gap: '10px' } }>
						<AlertTriangle size={ 20 } color={ M3.error } />
						<h3 style={ { margin: 0, fontSize: '16px', fontWeight: 600, color: M3.error } }>
							Emergency Rollback
						</h3>
					</div>
					<button
						onClick={ onClose }
						disabled={ loading }
						style={ {
							background: 'none',
							border: 'none',
							cursor: 'pointer',
							color: M3.onSurfaceVariant,
							padding: '4px',
						} }
					>
						<X size={ 18 } />
					</button>
				</div>

				{ /* Body */ }
				<div style={ { padding: '20px' } }>
					<p style={ { margin: '0 0 12px', fontSize: '14px', color: M3.onSurface, lineHeight: '1.5' } }>
						Are you sure you want to rollback <strong>{ productName }</strong>?
					</p>

					<div
						style={ {
							padding: '10px 14px',
							backgroundColor: M3.surfaceContainerLow,
							borderRadius: '8px',
							marginBottom: '16px',
							fontSize: '13px',
							display: 'flex',
							alignItems: 'center',
							gap: '8px',
						} }
					>
						<span style={ { color: M3.error, fontWeight: 600 } }>v{ fromVersion }</span>
						<span style={ { color: M3.onSurfaceVariant } }>➔ reverting to</span>
						<span style={ { color: M3.success, fontWeight: 600 } }>v{ toVersion }</span>
					</div>

					<p style={ { margin: '0 0 8px', fontSize: '12px', color: M3.onSurfaceVariant } }>
						Update endpoints will immediately stop offering v{ fromVersion } to connected client sites.
					</p>

					<label style={ { display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600, color: M3.onSurface } }>
						Rollback Reason (Required):
					</label>
					<textarea
						value={ reason }
						onChange={ ( e ) => setReason( e.target.value ) }
						placeholder="e.g. Critical fatal error reported on PHP 8.0 environments..."
						rows={ 3 }
						style={ {
							width: '100%',
							padding: '10px',
							borderRadius: '8px',
							border: `1px solid ${ M3.outlineVariant }`,
							fontSize: '13px',
							fontFamily: 'inherit',
							boxSizing: 'border-box',
							resize: 'vertical',
						} }
					/>
				</div>

				{ /* Footer */ }
				<div
					style={ {
						padding: '12px 20px',
						borderTop: `1px solid ${ M3.outlineVariant }`,
						display: 'flex',
						justifyContent: 'flex-end',
						gap: '10px',
						backgroundColor: M3.surfaceContainerLow,
					} }
				>
					<button
						onClick={ onClose }
						disabled={ loading }
						style={ {
							padding: '8px 16px',
							fontSize: '13px',
							fontWeight: 500,
							borderRadius: '8px',
							border: `1px solid ${ M3.outlineVariant }`,
							background: M3.surface,
							color: M3.onSurface,
							cursor: 'pointer',
						} }
					>
						Cancel
					</button>

					<button
						onClick={ handleConfirm }
						disabled={ loading || ! reason.trim() }
						style={ {
							padding: '8px 18px',
							fontSize: '13px',
							fontWeight: 600,
							borderRadius: '8px',
							border: 'none',
							backgroundColor: M3.error,
							color: '#fff',
							cursor: ( loading || ! reason.trim() ) ? 'not-allowed' : 'pointer',
							opacity: ( loading || ! reason.trim() ) ? 0.6 : 1,
						} }
					>
						{ loading ? 'Rolling back...' : 'Confirm Rollback' }
					</button>
				</div>
			</div>
		</div>
	);
}
