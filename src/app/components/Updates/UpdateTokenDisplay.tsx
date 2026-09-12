import React, { useState } from 'react';
import { Key, Copy, Check, Download, ExternalLink } from 'lucide-react';
import { M3 } from '../../utils/static-data';

interface UpdateTokenDisplayProps {
	checksum: string;
	versionId: number;
	onGenerateTestUrl: ( versionId: number ) => Promise<string>;
}

export function UpdateTokenDisplay( {
	checksum,
	versionId,
	onGenerateTestUrl,
}: UpdateTokenDisplayProps ) {
	const [ copiedHash, setCopiedHash ] = useState( false );
	const [ generating, setGenerating ] = useState( false );
	const [ testUrl, setTestUrl ] = useState<string | null>( null );
	const [ copiedUrl, setCopiedUrl ] = useState( false );

	const handleCopyHash = () => {
		navigator.clipboard.writeText( checksum );
		setCopiedHash( true );
		setTimeout( () => setCopiedHash( false ), 2000 );
	};

	const handleGenerateUrl = async () => {
		setGenerating( true );
		try {
			const url = await onGenerateTestUrl( versionId );
			setTestUrl( url );
		} catch ( err ) {
			console.error( 'Failed to generate test URL:', err );
		} finally {
			setGenerating( false );
		}
	};

	const handleCopyUrl = () => {
		if ( ! testUrl ) return;
		navigator.clipboard.writeText( testUrl );
		setCopiedUrl( true );
		setTimeout( () => setCopiedUrl( false ), 2000 );
	};

	const truncatedHash = checksum
		? checksum.replace( /^sha256:/i, '' ).substring( 0, 16 ) + '...'
		: 'N/A';

	return (
		<div
			style={ {
				padding: '12px 16px',
				backgroundColor: M3.surfaceContainerLow,
				borderRadius: '10px',
				border: `1px solid ${ M3.outlineVariant }`,
				display: 'flex',
				flexDirection: 'column',
				gap: '10px',
				fontSize: '12px',
			} }
		>
			<div style={ { display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' } }>
				{ /* Checksum */ }
				<div style={ { display: 'flex', alignItems: 'center', gap: '8px' } }>
					<span style={ { color: M3.onSurfaceVariant, fontWeight: 500 } }>SHA-256:</span>
					<code
						style={ {
							backgroundColor: M3.surface,
							padding: '2px 8px',
							borderRadius: '4px',
							border: `1px solid ${ M3.outlineVariant }`,
							color: M3.onSurface,
							fontFamily: 'ui-monospace, monospace',
							fontSize: '11px',
						} }
					>
						{ truncatedHash }
					</code>
					<button
						onClick={ handleCopyHash }
						title="Copy full SHA-256 hash"
						style={ {
							background: 'none',
							border: 'none',
							cursor: 'pointer',
							color: copiedHash ? M3.success : M3.onSurfaceVariant,
							display: 'flex',
							alignItems: 'center',
							padding: '2px',
						} }
					>
						{ copiedHash ? <Check size={ 13 } /> : <Copy size={ 13 } /> }
					</button>
				</div>

				{ /* Test URL Generator */ }
				<div>
					{ ! testUrl ? (
						<button
							onClick={ handleGenerateUrl }
							disabled={ generating }
							style={ {
								display: 'inline-flex',
								alignItems: 'center',
								gap: '6px',
								padding: '4px 10px',
								borderRadius: '6px',
								border: `1px solid ${ M3.primary }`,
								backgroundColor: 'transparent',
								color: M3.primary,
								fontSize: '12px',
								fontWeight: 500,
								cursor: generating ? 'wait' : 'pointer',
							} }
						>
							<Key size={ 13 } />
							<span>{ generating ? 'Generating Link...' : 'Generate 15-min Test Link' }</span>
						</button>
					) : (
						<div style={ { display: 'flex', alignItems: 'center', gap: '6px' } }>
							<a
								href={ testUrl }
								target="_blank"
								rel="noreferrer"
								style={ {
									display: 'inline-flex',
									alignItems: 'center',
									gap: '4px',
									padding: '4px 10px',
									borderRadius: '6px',
									backgroundColor: M3.primary,
									color: '#fff',
									fontSize: '12px',
									textDecoration: 'none',
									fontWeight: 500,
								} }
							>
								<Download size={ 13 } />
								<span>Download Test Package</span>
								<ExternalLink size={ 11 } />
							</a>
							<button
								onClick={ handleCopyUrl }
								title="Copy test URL"
								style={ {
									padding: '4px 8px',
									borderRadius: '6px',
									border: `1px solid ${ M3.outlineVariant }`,
									backgroundColor: M3.surface,
									color: copiedUrl ? M3.success : M3.onSurface,
									cursor: 'pointer',
									display: 'flex',
									alignItems: 'center',
									gap: '4px',
									fontSize: '11px',
								} }
							>
								{ copiedUrl ? <Check size={ 12 } /> : <Copy size={ 12 } /> }
								<span>{ copiedUrl ? 'Copied' : 'Copy' }</span>
							</button>
						</div>
					) }
				</div>
			</div>
		</div>
	);
}
