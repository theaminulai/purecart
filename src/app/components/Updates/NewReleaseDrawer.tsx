import { useState, useRef, useEffect, type ChangeEvent, type DragEvent, type FormEvent } from 'react';
import { X, UploadCloud, FileArchive, CheckCircle2, AlertCircle } from 'lucide-react';
import { M3 } from '../../utils/static-data';
import type { UpdateChannel, Platform, NewReleasePayload } from '../../types/updates';

interface NewReleaseDrawerProps {
	isOpen: boolean;
	onClose: () => void;
	onSubmit: ( payload: NewReleasePayload ) => Promise<void>;
	uploading: boolean;
	productOptions: Array<{ id: number; name: string }>;
}

export function NewReleaseDrawer( {
	isOpen,
	onClose,
	onSubmit,
	uploading,
	productOptions,
}: NewReleaseDrawerProps ) {
	const [ productId, setProductId ] = useState<number>( productOptions[ 0 ]?.id || 1 );
	const [ version, setVersion ] = useState( '' );
	const [ channel, setChannel ] = useState<UpdateChannel>( 'stable' );
	const [ platform, setPlatform ] = useState<Platform>( 'universal' );
	const [ requiresVersion, setRequiresVersion ] = useState( '' );
	const [ testedVersion, setTestedVersion ] = useState( '' );
	const [ changelog, setChangelog ] = useState( '' );
	const [ notifyCustomers, setNotifyCustomers ] = useState( true );
	const [ file, setFile ] = useState<File | null>( null );
	const [ dragOver, setDragOver ] = useState( false );
	const [ error, setError ] = useState<string | null>( null );

	const fileInputRef = useRef<HTMLInputElement>( null );

	useEffect( () => {
		if ( productOptions.length > 0 && ( ! productId || ! productOptions.some( ( p ) => p.id === productId ) ) ) {
			setProductId( productOptions[ 0 ].id );
		}
	}, [ productOptions, productId ] );

	if ( ! isOpen ) return null;

	const handleFileSelect = ( e: ChangeEvent<HTMLInputElement> ) => {
		if ( e.target.files && e.target.files[ 0 ] ) {
			setFile( e.target.files[ 0 ] );
			setError( null );
		}
	};

	const handleDrop = ( e: DragEvent ) => {
		e.preventDefault();
		setDragOver( false );
		if ( e.dataTransfer.files && e.dataTransfer.files[ 0 ] ) {
			setFile( e.dataTransfer.files[ 0 ] );
			setError( null );
		}
	};

	const handleSubmit = async ( e: FormEvent ) => {
		e.preventDefault();
		if ( ! productId ) {
			setError( 'Please select a product.' );
			return;
		}
		if ( ! version.trim() ) {
			setError( 'Please enter a valid version string (e.g. 1.2.0).' );
			return;
		}
		if ( ! file ) {
			setError( 'Please upload a software package archive (.zip).' );
			return;
		}

		setError( null );
		try {
			await onSubmit( {
				productId,
				version: version.trim(),
				channel,
				platform,
				requiresVersion: requiresVersion.trim(),
				testedVersion: testedVersion.trim(),
				changelog: changelog.trim(),
				notifyCustomers,
				file,
			} );
			onClose();
		} catch ( err: unknown ) {
			const msg =
				typeof err === 'string'
					? err
					: ( err as { message?: string } )?.message || 'Failed to publish release';
			setError( msg );
		}
	};


	return (
		<div
			style={ {
				marginBottom: '24px',
				backgroundColor: M3.surface,
				borderRadius: '16px',
				border: `1px solid ${ M3.primaryContainer }`,
				boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
				overflow: 'hidden',
			} }
		>
			{ /* Header */ }
			<div
				style={ {
					padding: '16px 24px',
					backgroundColor: M3.surfaceContainerLow,
					borderBottom: `1px solid ${ M3.outlineVariant }`,
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'space-between',
				} }
			>
				<div>
					<h3 style={ { margin: 0, fontSize: '16px', fontWeight: 700, color: M3.onSurface } }>
						Publish New Software Release
					</h3>
					<span style={ { fontSize: '12px', color: M3.onSurfaceVariant } }>
						Upload a new version package and distribute updates to customer installations
					</span>
				</div>
				<button
					onClick={ onClose }
					disabled={ uploading }
					style={ {
						background: 'none',
						border: 'none',
						cursor: 'pointer',
						color: M3.onSurfaceVariant,
						padding: '4px',
					} }
				>
					<X size={ 20 } />
				</button>
			</div>

			{ /* Form */ }
			<form onSubmit={ handleSubmit } style={ { padding: '24px' } }>
				{ error && (
					<div
						style={ {
							padding: '12px 16px',
							backgroundColor: M3.errorContainer,
							color: M3.error,
							borderRadius: '8px',
							marginBottom: '18px',
							display: 'flex',
							alignItems: 'center',
							gap: '8px',
							fontSize: '13px',
						} }
					>
						<AlertCircle size={ 16 } />
						<span>{ error }</span>
					</div>
				) }

				<div style={ { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '18px' } }>
					{ /* Product */ }
					<div>
						<label style={ { display: 'block', fontSize: '13px', fontWeight: 600, color: M3.onSurface, marginBottom: '6px' } }>
							Product:
						</label>
						<select
							value={ productId }
							onChange={ ( e ) => setProductId( Number( e.target.value ) ) }
							style={ {
								width: '100%',
								padding: '8px 12px',
								borderRadius: '8px',
								border: `1px solid ${ M3.outlineVariant }`,
								backgroundColor: M3.surface,
								fontSize: '13px',
								color: M3.onSurface,
							} }
						>
							{ productOptions.map( ( p ) => (
								<option key={ p.id } value={ p.id }>{ p.name }</option>
							) ) }
						</select>
					</div>

					{ /* Version */ }
					<div>
						<label style={ { display: 'block', fontSize: '13px', fontWeight: 600, color: M3.onSurface, marginBottom: '6px' } }>
							Version Number:
						</label>
						<input
							type="text"
							value={ version }
							onChange={ ( e ) => setVersion( e.target.value ) }
							placeholder="e.g. 2.4.0"
							style={ {
								width: '100%',
								padding: '8px 12px',
								borderRadius: '8px',
								border: `1px solid ${ M3.outlineVariant }`,
								fontSize: '13px',
								fontFamily: 'ui-monospace, monospace',
								color: M3.onSurface,
								boxSizing: 'border-box',
							} }
						/>
					</div>

					{ /* Channel */ }
					<div>
						<label style={ { display: 'block', fontSize: '13px', fontWeight: 600, color: M3.onSurface, marginBottom: '6px' } }>
							Release Channel:
						</label>
						<div style={ { display: 'flex', gap: '8px' } }>
							{ ( [ 'stable', 'beta', 'nightly' ] as UpdateChannel[] ).map( ( ch ) => (
								<button
									type="button"
									key={ ch }
									onClick={ () => setChannel( ch ) }
									style={ {
										flex: 1,
										padding: '8px',
										borderRadius: '8px',
										fontSize: '12px',
										fontWeight: 600,
										textTransform: 'capitalize',
										cursor: 'pointer',
										border: channel === ch ? `2px solid ${ M3.primary }` : `1px solid ${ M3.outlineVariant }`,
										backgroundColor: channel === ch ? M3.primaryContainer : M3.surface,
										color: channel === ch ? M3.onPrimaryContainer : M3.onSurfaceVariant,
									} }
								>
									{ ch }
								</button>
							) ) }
						</div>
					</div>

					{ /* Platform */ }
					<div>
						<label style={ { display: 'block', fontSize: '13px', fontWeight: 600, color: M3.onSurface, marginBottom: '6px' } }>
							Target Platform:
						</label>
						<select
							value={ platform }
							onChange={ ( e ) => setPlatform( e.target.value as Platform ) }
							style={ {
								width: '100%',
								padding: '8px 12px',
								borderRadius: '8px',
								border: `1px solid ${ M3.outlineVariant }`,
								backgroundColor: M3.surface,
								fontSize: '13px',
								color: M3.onSurface,
							} }
						>
							<option value="universal">Universal (WordPress / Web)</option>
							<option value="darwin-arm64">macOS (Apple Silicon ARM)</option>
							<option value="darwin-x64">macOS (Intel x64)</option>
							<option value="win-x64">Windows (x64)</option>
							<option value="win-arm64">Windows (ARM64)</option>
							<option value="linux-x86_64">Linux (x64)</option>
							<option value="linux-arm64">Linux (ARM64)</option>
						</select>
					</div>
				</div>

				{ /* Drag and Drop File Upload */ }
				<div style={ { marginBottom: '18px' } }>
					<label style={ { display: 'block', fontSize: '13px', fontWeight: 600, color: M3.onSurface, marginBottom: '6px' } }>
						Package Archive (.zip, .dmg, .pkg, .exe, .tar.gz):
					</label>
					<div
						onDragOver={ ( e ) => { e.preventDefault(); setDragOver( true ); } }
						onDragLeave={ () => setDragOver( false ) }
						onDrop={ handleDrop }
						onClick={ () => fileInputRef.current?.click() }
						style={ {
							border: `2px dashed ${ dragOver ? M3.primary : M3.outlineVariant }`,
							borderRadius: '12px',
							padding: '24px',
							textAlign: 'center',
							backgroundColor: dragOver ? M3.primaryContainer : M3.surfaceContainerLow,
							cursor: 'pointer',
							transition: 'all 0.2s ease',
						} }
					>
						<input
							type="file"
							ref={ fileInputRef }
							onChange={ handleFileSelect }
							style={ { display: 'none' } }
						/>
						{ file ? (
							<div style={ { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' } }>
								<FileArchive size={ 28 } color={ M3.primary } />
								<div style={ { textAlign: 'left' } }>
									<div style={ { fontSize: '14px', fontWeight: 600, color: M3.onSurface } }>{ file.name }</div>
									<div style={ { fontSize: '12px', color: M3.onSurfaceVariant } }>{ ( file.size / ( 1024 * 1024 ) ).toFixed( 2 ) } MB</div>
								</div>
								<CheckCircle2 size={ 20 } color={ M3.success } style={ { marginLeft: '8px' } } />
							</div>
						) : (
							<div style={ { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' } }>
								<UploadCloud size={ 32 } color={ M3.primary } />
								<span style={ { fontSize: '14px', fontWeight: 600, color: M3.onSurface } }>
									Drag & drop package archive here, or click to browse
								</span>
								<span style={ { fontSize: '12px', color: M3.onSurfaceVariant } }>
									Supports .zip for plugins/themes and platform binaries up to server upload limits
								</span>
							</div>
						)}
					</div>
				</div>

				{ /* Changelog */ }
				<div style={ { marginBottom: '18px' } }>
					<label style={ { display: 'block', fontSize: '13px', fontWeight: 600, color: M3.onSurface, marginBottom: '6px' } }>
						Release Notes / Changelog (Markdown):
					</label>
					<textarea
						value={ changelog }
						onChange={ ( e ) => setChangelog( e.target.value ) }
						rows={ 4 }
						placeholder="## Features&#10;- Added automated update pipeline&#10;- Fixed WooCommerce compatibility"
						style={ {
							width: '100%',
							padding: '10px 12px',
							borderRadius: '8px',
							border: `1px solid ${ M3.outlineVariant }`,
							fontSize: '13px',
							fontFamily: 'inherit',
							boxSizing: 'border-box',
							resize: 'vertical',
						} }
					/>
				</div>

				{ /* Email Notification Toggle */ }
				<div style={ { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' } }>
					<input
						type="checkbox"
						id="notifyCustomers"
						checked={ notifyCustomers }
						onChange={ ( e ) => setNotifyCustomers( e.target.checked ) }
						style={ { width: '16px', height: '16px', cursor: 'pointer' } }
					/>
					<label htmlFor="notifyCustomers" style={ { fontSize: '13px', color: M3.onSurface, cursor: 'pointer' } }>
						Email active license holders when this release is published (Stable channel only)
					</label>
				</div>

				{ /* Footer Actions */ }
				<div style={ { display: 'flex', justifyContent: 'flex-end', gap: '12px' } }>
					<button
						type="button"
						onClick={ onClose }
						disabled={ uploading }
						style={ {
							padding: '8px 18px',
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
						type="submit"
						disabled={ uploading }
						style={ {
							padding: '8px 24px',
							fontSize: '13px',
							fontWeight: 600,
							borderRadius: '8px',
							border: 'none',
							backgroundColor: M3.primary,
							color: M3.onPrimary,
							cursor: uploading ? 'wait' : 'pointer',
							opacity: uploading ? 0.7 : 1,
						} }
					>
						{ uploading ? 'Publishing Package...' : `Publish Release ${ version ? `(v${ version })` : '' }` }
					</button>
				</div>
			</form>
		</div>
	);
}
