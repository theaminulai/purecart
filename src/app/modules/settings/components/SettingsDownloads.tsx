/**
 * SettingsDownloads - the "Downloads" settings tab.
 *
 * Same CollapsibleSection + shared field-row shape as SettingsUpdates.
 * Local component state only, like every other Settings tab - the
 * Downloads page itself is still a ComingSoon placeholder, so there's no
 * real endpoint to save these to yet.
 *
 * @file
 * @since 1.0.0
 */
import { useState } from 'react';
import { FilledButton } from '@/shared/ui/FilledButton';
import { Toast } from '@/shared/ui/Toast';
import type { ToastProps } from '@/shared/ui';
import { CollapsibleSection } from './CollapsibleSection';
import {
	SettingsField,
	SettingsToggleField,
	SettingsSelectField,
} from './shared';

const STORAGE_OPTIONS = [
	{ label: 'Local (filesystem)', value: 'local' },
	{ label: 'Amazon S3', value: 's3' },
	{ label: 'Cloudflare R2', value: 'r2' },
	{ label: 'DigitalOcean Spaces', value: 'spaces' },
];

/**
 * Renders the Downloads settings tab.
 *
 * @since 1.0.0
 *
 * @return {JSX.Element} The Downloads settings tab.
 */
export function SettingsDownloads() {
	const [ linkExpiry, setLinkExpiry ] = useState( '60' );
	const [ maxDownloadsPerLink, setMaxDownloadsPerLink ] = useState( '3' );
	const [ bindLinkToIp, setBindLinkToIp ] = useState( false );
	const [ storageDriver, setStorageDriver ] = useState( 's3' );
	const [ cdnBaseUrl, setCdnBaseUrl ] = useState(
		'https://cdn.example.com/downloads'
	);
	const [ maxDownloadsPerHour, setMaxDownloadsPerHour ] = useState( '10' );
	const [ blockTorExitNodes, setBlockTorExitNodes ] = useState( true );
	const [ isDirty, setIsDirty ] = useState( false );
	const [ toast, setToast ] = useState< ToastProps >( {
		message: '',
		type: 'success',
		visible: false,
	} );

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
					value={ linkExpiry }
					onChange={ set( setLinkExpiry ) }
					helpText="How long a generated download URL remains valid"
				/>
				<SettingsField
					label="Max Downloads per Link"
					type="number"
					value={ maxDownloadsPerLink }
					onChange={ set( setMaxDownloadsPerLink ) }
					helpText="Maximum number of times a single signed URL can be used"
				/>
				<SettingsToggleField
					label="Bind Link to IP"
					checked={ bindLinkToIp }
					onChange={ set( setBindLinkToIp ) }
					helpText="Download links are only valid from the IP that requested them"
				/>
			</CollapsibleSection>

			<CollapsibleSection
				title="Storage"
				description="Where package files are stored and served from"
			>
				<SettingsSelectField
					label="Storage Driver"
					value={ storageDriver }
					options={ STORAGE_OPTIONS }
					onChange={ set( setStorageDriver ) }
					helpText="Where package files are stored"
				/>
				<SettingsField
					label="CDN Base URL"
					value={ cdnBaseUrl }
					onChange={ set( setCdnBaseUrl ) }
					helpText="Public CDN domain used to serve download files"
				/>
			</CollapsibleSection>

			<CollapsibleSection
				title="Rate Limiting"
				description="Abuse controls for high-volume download requests"
			>
				<SettingsField
					label="Max Downloads / IP / Hour"
					type="number"
					value={ maxDownloadsPerHour }
					onChange={ set( setMaxDownloadsPerHour ) }
					helpText="Set 0 to disable IP-level rate limiting"
				/>
				<SettingsToggleField
					label="Block Tor Exit Nodes"
					checked={ blockTorExitNodes }
					onChange={ set( setBlockTorExitNodes ) }
					helpText="Automatically block download requests from known Tor IPs"
				/>
			</CollapsibleSection>

			<div className="fixed bottom-6 right-6">
				<FilledButton
					disabled={ ! isDirty }
					onClick={ () => {
						showToast( 'Download settings saved', 'success' );
						setIsDirty( false );
					} }
				>
					Save Changes
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
