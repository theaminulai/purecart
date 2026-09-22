/**
 * SettingsLicensing - the "Licensing" settings tab.
 *
 * Wired to includes/API/Licenses.php's GET/POST /licenses/settings.
 * `OptionKeys` (includes/Settings/OptionKeys.php) only defines two global
 * Licensing settings — delivery status and the JWT signing secret — so
 * that's what this tab shows. Per-license expiry, grace period, and
 * activation limits (the fields this tab used to mock up) are set per
 * product/license, not as a plugin-wide default, and have no `OptionKeys`
 * entry to back a global control here.
 *
 * @file
 * @since 1.0.0
 */
import { useEffect, useState } from 'react';
import { FilledButton } from '@/shared/ui/FilledButton';
import { Toast } from '@/shared/ui/Toast';
import type { ToastProps } from '@/shared/ui';
import { fetchLicenseSettings, saveLicenseSettings, type LicenseSettings } from '@/modules/licenses';
import { CollapsibleSection } from './CollapsibleSection';
import { SettingsField, SettingsSelectField } from './shared';

const DELIVERY_STATUS_OPTIONS = [
	{ label: 'Order marked Completed', value: 'completed' },
	{ label: 'Order marked Processing', value: 'processing' },
	{ label: 'Either Processing or Completed', value: 'both' },
];

const EMPTY_SETTINGS: LicenseSettings = { deliveryStatus: 'completed', jwtSecret: '' };

/**
 * Renders the Licensing settings tab.
 *
 * @since 1.0.0
 *
 * @return {JSX.Element} The Licensing settings tab.
 */
export function SettingsLicensing() {
	const [ settings, setSettings ] = useState< LicenseSettings >( EMPTY_SETTINGS );
	const [ isDirty, setIsDirty ] = useState( false );
	const [ isSaving, setIsSaving ] = useState( false );
	const [ toast, setToast ] = useState< ToastProps >( {
		message: '',
		type: 'success',
		visible: false,
	} );

	useEffect( () => {
		fetchLicenseSettings()
			.then( setSettings )
			.catch( () => showToast( 'Failed to load licensing settings', 'error' ) );
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

	const handleSave = async () => {
		setIsSaving( true );
		try {
			await saveLicenseSettings( { deliveryStatus: settings.deliveryStatus } );
			showToast( 'Licensing settings saved', 'success' );
			setIsDirty( false );
		} catch {
			showToast( 'Failed to save licensing settings', 'error' );
		} finally {
			setIsSaving( false );
		}
	};

	return (
		<div className="flex flex-col gap-3 pb-20">
			<CollapsibleSection
				title="Provisioning"
				description="When a license key is issued and delivered for an order"
				defaultOpen
			>
				<SettingsSelectField
					label="Deliver On"
					value={ settings.deliveryStatus }
					options={ DELIVERY_STATUS_OPTIONS }
					onChange={ ( v ) => {
						setSettings( ( s ) => ( { ...s, deliveryStatus: v as LicenseSettings[ 'deliveryStatus' ] } ) );
						setIsDirty( true );
					} }
					helpText="Order status that triggers license (and download/SaaS) provisioning"
				/>
			</CollapsibleSection>

			<CollapsibleSection
				title="Token Signing"
				description="HS256 secret used to sign license JWTs"
			>
				<SettingsField
					label="JWT Secret"
					type="password"
					value={ settings.jwtSecret }
					onChange={ () => {} }
					disabled
					placeholder="Auto-generated on first use"
					helpText="Signs license JWTs. Auto-generated — not editable here"
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
