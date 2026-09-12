import React, { useState } from 'react';
import { X, Copy, Check, FileText } from 'lucide-react';
import { M3 } from '../../utils/static-data';

interface ChangelogModalProps {
	isOpen: boolean;
	onClose: () => void;
	productName: string;
	version: string;
	changelog: string;
}

export function ChangelogModal( {
	isOpen,
	onClose,
	productName,
	version,
	changelog,
}: ChangelogModalProps ) {
	const [ copied, setCopied ] = useState( false );

	if ( ! isOpen ) return null;

	const handleCopy = () => {
		navigator.clipboard.writeText( changelog );
		setCopied( true );
		setTimeout( () => setCopied( false ), 2000 );
	};

	// Simple markdown formatting helper
	const renderFormattedText = ( text: string ) => {
		if ( ! text ) {
			return <p style={ { color: M3.onSurfaceVariant, fontStyle: 'italic' } }>No changelog notes provided for this version.</p>;
		}

		return text.split( '\n' ).map( ( line, idx ) => {
			const trimmed = line.trim();
			if ( trimmed.startsWith( '### ' ) ) {
				return <h4 key={ idx } style={ { margin: '12px 0 4px', color: M3.onSurface, fontSize: '14px', fontWeight: 600 } }>{ trimmed.replace( '### ', '' ) }</h4>;
			}
			if ( trimmed.startsWith( '## ' ) ) {
				return <h3 key={ idx } style={ { margin: '14px 0 6px', color: M3.onSurface, fontSize: '15px', fontWeight: 700 } }>{ trimmed.replace( '## ', '' ) }</h3>;
			}
			if ( trimmed.startsWith( '- ' ) || trimmed.startsWith( '* ' ) ) {
				return (
					<li key={ idx } style={ { marginLeft: '16px', color: M3.onSurfaceVariant, fontSize: '13px', lineHeight: '1.6' } }>
						{ trimmed.substring( 2 ) }
					</li>
				);
			}
			return (
				<p key={ idx } style={ { margin: '4px 0', color: M3.onSurfaceVariant, fontSize: '13px', lineHeight: '1.5' } }>
					{ line }
				</p>
			);
		} );
	};

	return (
		<div
			style={ {
				position: 'fixed',
				inset: 0,
				backgroundColor: 'rgba(0, 0, 0, 0.5)',
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
					maxWidth: '560px',
					maxHeight: '85vh',
					display: 'flex',
					flexDirection: 'column',
					boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
					overflow: 'hidden',
				} }
			>
				{ /* Header */ }
				<div
					style={ {
						padding: '16px 20px',
						borderBottom: `1px solid ${ M3.outlineVariant }`,
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'space-between',
						backgroundColor: M3.surfaceContainerLow,
					} }
				>
					<div style={ { display: 'flex', alignItems: 'center', gap: '8px' } }>
						<FileText size={ 18 } color={ M3.primary } />
						<div>
							<h3 style={ { margin: 0, fontSize: '16px', fontWeight: 600, color: M3.onSurface } }>
								Release Changelog
							</h3>
							<span style={ { fontSize: '12px', color: M3.onSurfaceVariant } }>
								{ productName } • v{ version }
							</span>
						</div>
					</div>
					<button
						onClick={ onClose }
						style={ {
							background: 'none',
							border: 'none',
							cursor: 'pointer',
							color: M3.onSurfaceVariant,
							padding: '4px',
							borderRadius: '50%',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
						} }
					>
						<X size={ 18 } />
					</button>
				</div>

				{ /* Content */ }
				<div
					style={ {
						padding: '20px',
						overflowY: 'auto',
						flex: 1,
					} }
				>
					{ renderFormattedText( changelog ) }
				</div>

				{ /* Footer */ }
				<div
					style={ {
						padding: '12px 20px',
						borderTop: `1px solid ${ M3.outlineVariant }`,
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'space-between',
						backgroundColor: M3.surfaceContainerLow,
					} }
				>
					<button
						onClick={ handleCopy }
						style={ {
							display: 'inline-flex',
							alignItems: 'center',
							gap: '6px',
							padding: '6px 12px',
							fontSize: '12px',
							fontWeight: 500,
							borderRadius: '6px',
							border: `1px solid ${ M3.outlineVariant }`,
							background: M3.surface,
							color: M3.onSurface,
							cursor: 'pointer',
						} }
					>
						{ copied ? <Check size={ 14 } color={ M3.success } /> : <Copy size={ 14 } /> }
						<span>{ copied ? 'Copied' : 'Copy Changelog' }</span>
					</button>

					<button
						onClick={ onClose }
						style={ {
							padding: '6px 16px',
							fontSize: '13px',
							fontWeight: 500,
							borderRadius: '8px',
							border: 'none',
							backgroundColor: M3.primary,
							color: M3.onPrimary,
							cursor: 'pointer',
						} }
					>
						Close
					</button>
				</div>
			</div>
		</div>
	);
}
