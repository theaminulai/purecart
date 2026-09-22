/**
 * SettingsDownloads - the "Downloads" settings tab.
 *
 * Wired to includes/API/Downloads.php's GET/POST /downloads/settings — the
 * only settings this module actually has (TokenManager's link-expiry and
 * max-download-count options). The link expiry is stored in seconds
 * backend-side but shown in minutes here, same unit-display choice
 * SettingsUpdates makes for its signed-URL lifetime field.
 *
 * Storage driver/CDN/rate-limiting fields that used to live here were
 * removed: nothing in the backend reads or stores them, so they were
 * decorative controls that silently did nothing on save.
 *
 * @file
 * @since 1.0.0
 */
import { useEffect, useState } from 'react';
import { FilledButton } from '@/shared/ui/FilledButton';
import { Toast } from '@/shared/ui/Toast';
import type { ToastProps } from '@/shared/ui';
import { fetchDownloadSettings, saveDownloadSettings } from '@/modules/downloads';
import { CollapsibleSection } from './CollapsibleSection';
import { SettingsField } from './shared';

/**
 * Renders the Downloads settings tab.
 *
 * @since 1.0.0
 *
 * @return {JSX.Element} The Downloads settings tab.
 */
export function SettingsDownloads() {
	const [ linkExpiryMinutes, setLinkExpiryMinutes ] = useState( 1440 );
	const [ maxDownloadsPerLink, setMaxDownloadsPerLink ] = useState( 3 );
	const [ isDirty, setIsDirty ] = useState( false );
	const [ isSaving, setIsSaving ] = useState( false );
	const [ toast, setToast ] = useState< ToastProps >( {
		message: '',
		type: 'success',
		visible: false,
	} );

	useEffect( () => {
		fetchDownloadSettings()
			.then( ( s ) => {
				setLinkExpiryMinutes( Math.round( s.expirySeconds / 60 ) );
				setMaxDownloadsPerLink( s.maxCount );
			} )
			.catch( () => showToast( 'Failed to load download settings', 'error' ) );
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [] );

	const showToast = (
		msg: string,
		type: ToastProps[ 'type' ] = 'success'
	) => {
		setToast( { message: msg, type, visible: true } );
		setTimeout(
			() => setToast( ( t ) => ( { ...t, visible: false } ) ),
			3000
		);
	};

	const set =
		< T, >( setter: ( v: T ) => void ) =>
		( v: T ) => {
			setter( v );
			setIsDirty( true );
		};

	const handleSave = async () => {
		setIsSaving( true );
		try {
			await saveDownloadSettings( {
				expirySeconds: linkExpiryMinutes * 60,
				maxCount: maxDownloadsPerLink,
			} );
			showToast( 'Download settings saved', 'success' );
			setIsDirty( false );
		} catch {
			showToast( 'Failed to save download settings', 'error' );
		} finally {
			setIsSaving( false );
		}
	};

	return (
		<div className="flex flex-col gap-3 pb-20">
			<CollapsibleSection
				title="Secure Link Settings"
				description="How generated download URLs are secured and expired"
				defaultOpen
			>
				<SettingsField
					label="Link Expiry"
					suffix="minutes"
					type="number"
					value={ linkExpiryMinutes }
					onChange={ ( v ) => set( setLinkExpiryMinutes )( parseInt( v, 10 ) || 0 ) }
					helpText="How long a generated download URL remains valid"
				/>
				<SettingsField
					label="Max Downloads per Link"
					type="number"
					value={ maxDownloadsPerLink }
					onChange={ ( v ) => set( setMaxDownloadsPerLink )( parseInt( v, 10 ) || 0 ) }
					helpText="Maximum number of times a single signed URL can be used (0 = unlimited)"
				/>
			</CollapsibleSection>

			<div className="fixed bottom-6 right-6">
				<FilledButton
					disabled={ ! isDirty || isSaving }
					onClick={ handleSave }
				>
					{ isSaving ? 'Saving…' : 'Save Changes' }
				</FilledButton>
			</div>
			<Toast
				message={ toast.message }
				type={ toast.type }
				visible={ toast.visible }
			/>
		</div>
	);
}
