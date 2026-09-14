import React, { useState } from 'react';
import { Key, Eye, RefreshCw, Mail } from 'lucide-react';
import { M3 } from '../../utils/static-data';
import { fetchEmailPreview } from '../../api/modules/updates.api';

export function SettingsUpdates() {
	const [ defaultChannel, setDefaultChannel ] = useState( 'stable' );
	const [ requireLicense, setRequireLicense ] = useState( true );
	const [ allowRollback, setAllowRollback ] = useState( true );
	const [ tokenTtl, setTokenTtl ] = useState( 15 );
	const [ emailNotifications, setEmailNotifications ] = useState( true );
	const [ previewHtml, setPreviewHtml ] = useState<string | null>( null );
	const [ previewLoading, setPreviewLoading ] = useState( false );
	const [ saved, setSaved ] = useState( false );

	const handlePreviewEmail = async () => {
		setPreviewLoading( true );
		try {
			const res = await fetchEmailPreview();
			setPreviewHtml( res.html );
		} catch ( err ) {
			console.error( 'Failed to load preview:', err );
		} finally {
			setPreviewLoading( false );
		}
	};

	const handleSave = () => {
		setSaved( true );
		setTimeout( () => setSaved( false ), 3000 );
	};

	return (
		<div style={ { display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '800px' } }>
			{ /* General Settings */ }
			<div
				style={ {
					backgroundColor: M3.surface,
					padding: '24px',
					borderRadius: '12px',
					border: `1px solid ${ M3.outlineVariant }`,
				} }
			>
				<h3 style={ { margin: '0 0 16px', fontSize: '16px', fontWeight: 600, color: M3.onSurface } }>
					General Update Policies
				</h3>

				<div style={ { display: 'flex', flexDirection: 'column', gap: '16px' } }>
					<div>
						<label style={ { display: 'block', fontSize: '13px', fontWeight: 600, color: M3.onSurface, marginBottom: '6px' } }>
							Default Update Channel:
						</label>
						<select
							value={ defaultChannel }
							onChange={ ( e ) => setDefaultChannel( e.target.value ) }
							style={ {
								padding: '8px 12px',
								borderRadius: '8px',
								border: `1px solid ${ M3.outlineVariant }`,
								backgroundColor: M3.surface,
								fontSize: '13px',
								color: M3.onSurface,
								width: '240px',
							} }
						>
							<option value="stable">Stable (Production Releases)</option>
							<option value="beta">Beta (Pre-release testing)</option>
							<option value="nightly">Nightly (Bleeding Edge)</option>
						</select>
					</div>

					<div style={ { display: 'flex', alignItems: 'center', gap: '10px' } }>
						<input
							type="checkbox"
							id="requireLicense"
							checked={ requireLicense }
							onChange={ ( e ) => setRequireLicense( e.target.checked ) }
							style={ { width: '16px', height: '16px', cursor: 'pointer' } }
						/>
						<label htmlFor="requireLicense" style={ { fontSize: '13px', color: M3.onSurface, cursor: 'pointer' } }>
							Require active, unexpired license key to download package updates
						</label>
					</div>

					<div style={ { display: 'flex', alignItems: 'center', gap: '10px' } }>
						<input
							type="checkbox"
							id="allowRollback"
							checked={ allowRollback }
							onChange={ ( e ) => setAllowRollback( e.target.checked ) }
							style={ { width: '16px', height: '16px', cursor: 'pointer' } }
						/>
						<label htmlFor="allowRollback" style={ { fontSize: '13px', color: M3.onSurface, cursor: 'pointer' } }>
							Allow customers to manually download previous versions from their account
						</label>
					</div>
				</div>
			</div>

			{ /* Security & Signed Tokens */ }
			<div
				style={ {
					backgroundColor: M3.surface,
					padding: '24px',
					borderRadius: '12px',
					border: `1px solid ${ M3.outlineVariant }`,
				} }
			>
				<h3 style={ { margin: '0 0 16px', fontSize: '16px', fontWeight: 600, color: M3.onSurface } }>
					Signed Download URL & Token Security
				</h3>

				<div style={ { display: 'flex', flexDirection: 'column', gap: '16px' } }>
					<div>
						<label style={ { display: 'block', fontSize: '13px', fontWeight: 600, color: M3.onSurface, marginBottom: '6px' } }>
							HMAC Signing Secret:
						</label>
						<div style={ { display: 'flex', alignItems: 'center', gap: '8px' } }>
							<input
								type="password"
								value="••••••••••••••••••••••••••••••••"
								readOnly
								style={ {
									padding: '8px 12px',
									borderRadius: '8px',
									border: `1px solid ${ M3.outlineVariant }`,
									backgroundColor: M3.surfaceContainerLow,
									fontSize: '13px',
									fontFamily: 'monospace',
									color: M3.onSurface,
									width: '320px',
								} }
							/>
							<button
								type="button"
								onClick={ () => alert( 'Secret regeneration will invalidate all current download links.' ) }
								style={ {
									display: 'inline-flex',
									alignItems: 'center',
									gap: '6px',
									padding: '8px 12px',
									borderRadius: '8px',
									border: `1px solid ${ M3.error }`,
									background: 'none',
									color: M3.error,
									fontSize: '12px',
									fontWeight: 600,
									cursor: 'pointer',
								} }
							>
								<RefreshCw size={ 13 } />
								<span>Regenerate Secret</span>
							</button>
						</div>
						<span style={ { fontSize: '12px', color: M3.onSurfaceVariant, display: 'block', marginTop: '4px' } }>
							Used to create cryptographic HMAC-SHA256 tokens for 1-click update links.
						</span>
					</div>

					<div>
						<label style={ { display: 'block', fontSize: '13px', fontWeight: 600, color: M3.onSurface, marginBottom: '6px' } }>
							Signed URL Lifetime (Minutes):
						</label>
						<input
							type="number"
							value={ tokenTtl }
							onChange={ ( e ) => setTokenTtl( Number( e.target.value ) ) }
							min={ 5 }
							max={ 1440 }
							style={ {
								padding: '8px 12px',
								borderRadius: '8px',
								border: `1px solid ${ M3.outlineVariant }`,
								backgroundColor: M3.surface,
								fontSize: '13px',
								color: M3.onSurface,
								width: '120px',
							} }
						/>
						<span style={ { fontSize: '12px', color: M3.onSurfaceVariant, display: 'block', marginTop: '4px' } }>
							Download links auto-expire after this duration (default: 15 minutes).
						</span>
					</div>
				</div>
			</div>

			{ /* Customer Notification Emails */ }
			<div
				style={ {
					backgroundColor: M3.surface,
					padding: '24px',
					borderRadius: '12px',
					border: `1px solid ${ M3.outlineVariant }`,
				} }
			>
				<h3 style={ { margin: '0 0 16px', fontSize: '16px', fontWeight: 600, color: M3.onSurface } }>
					Release Announcement Emails
				</h3>

				<div style={ { display: 'flex', flexDirection: 'column', gap: '16px' } }>
					<div style={ { display: 'flex', alignItems: 'center', gap: '10px' } }>
						<input
							type="checkbox"
							id="emailNotifications"
							checked={ emailNotifications }
							onChange={ ( e ) => setEmailNotifications( e.target.checked ) }
							style={ { width: '16px', height: '16px', cursor: 'pointer' } }
						/>
						<label htmlFor="emailNotifications" style={ { fontSize: '13px', color: M3.onSurface, cursor: 'pointer' } }>
							Send automated announcement email to active license holders when a stable version is released
						</label>
					</div>

					<div>
						<button
							type="button"
							onClick={ handlePreviewEmail }
							disabled={ previewLoading }
							style={ {
								display: 'inline-flex',
								alignItems: 'center',
								gap: '6px',
								padding: '8px 14px',
								borderRadius: '8px',
								border: `1px solid ${ M3.outlineVariant }`,
								backgroundColor: M3.surfaceContainerLow,
								color: M3.onSurface,
								fontSize: '12px',
								fontWeight: 500,
								cursor: 'pointer',
							} }
						>
							<Mail size={ 14 } />
							<span>{ previewLoading ? 'Loading Preview...' : 'Preview Email Template' }</span>
						</button>
					</div>

					{ previewHtml && (
						<div
							style={ {
								marginTop: '12px',
								padding: '16px',
								borderRadius: '8px',
								border: `1px solid ${ M3.outlineVariant }`,
								backgroundColor: '#fff',
							} }
						>
							<div style={ { display: 'flex', justifyContent: 'space-between', marginBottom: '8px' } }>
								<span style={ { fontSize: '12px', fontWeight: 600, color: M3.onSurfaceVariant } }>
									Sandboxed Preview:
								</span>
								<button
									onClick={ () => setPreviewHtml( null ) }
									style={ { background: 'none', border: 'none', color: M3.primary, fontSize: '12px', cursor: 'pointer' } }
								>
									Hide Preview
								</button>
							</div>
							<div dangerouslySetInnerHTML={ { __html: previewHtml } } />
						</div>
					) }
				</div>
			</div>

			{ /* Save Button */ }
			<div style={ { display: 'flex', alignItems: 'center', gap: '12px' } }>
				<button
					type="button"
					onClick={ handleSave }
					style={ {
						padding: '10px 24px',
						fontSize: '13px',
						fontWeight: 600,
						borderRadius: '8px',
						border: 'none',
						backgroundColor: M3.primary,
						color: M3.onPrimary,
						cursor: 'pointer',
					} }
				>
					Save Changes
				</button>
				{ saved && (
					<span style={ { fontSize: '13px', color: M3.success, fontWeight: 500 } }>
						✓ Settings saved successfully
					</span>
				) }
			</div>
		</div>
	);
}
