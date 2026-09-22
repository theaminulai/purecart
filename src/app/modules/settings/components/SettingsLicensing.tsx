/**
 * SettingsLicensing - the "Licensing" settings tab.
 *
 * Same CollapsibleSection + shared field-row shape as SettingsUpdates.
 * Local component state only, like every other Settings tab - the
 * Licenses page itself is still a ComingSoon placeholder, so there's no
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

const KEY_FORMAT_OPTIONS = [
	{ label: 'WDD-XXXX-XXXX-XXXX', value: 'wdd' },
	{ label: 'XXXX-XXXX-XXXX-XXXX', value: 'plain' },
	{ label: 'Custom', value: 'custom' },
];

/**
 * Renders the Licensing settings tab.
 *
 * @since 1.0.0
 *
 * @return {JSX.Element} The Licensing settings tab.
 */
export function SettingsLicensing() {
	const [ keyFormat, setKeyFormat ] = useState( 'wdd' );
	const [ defaultExpiry, setDefaultExpiry ] = useState( '365' );
	const [ gracePeriod, setGracePeriod ] = useState( '14' );
	const [ siteActivations, setSiteActivations ] = useState( '1' );
	const [ allowStagingActivations, setAllowStagingActivations ] =
		useState( true );
	const [ lockToIp, setLockToIp ] = useState( false );
	const [ apiBaseUrl, setApiBaseUrl ] = useState(
		'https://store.example.com/api/v1'
	);
	const [ requireHmac, setRequireHmac ] = useState( true );
	const [ hmacSecret, setHmacSecret ] = useState( '' );
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
				title="License Generation"
				description="How new license keys are issued and expired"
				defaultOpen
			>
				<SettingsSelectField
					label="Key Format"
					value={ keyFormat }
					options={ KEY_FORMAT_OPTIONS }
					onChange={ set( setKeyFormat ) }
					helpText="Pattern used when generating new license keys"
				/>
				<SettingsField
					label="Default Expiry"
					suffix="days"
					type="number"
					value={ defaultExpiry }
					onChange={ set( setDefaultExpiry ) }
					helpText="Default validity period for new licenses. Leave blank for lifetime"
				/>
				<SettingsField
					label="Grace Period"
					suffix="days"
					type="number"
					value={ gracePeriod }
					onChange={ set( setGracePeriod ) }
					helpText="Days after expiry before a license stops functioning"
				/>
			</CollapsibleSection>

			<CollapsibleSection
				title="Activation Limits"
				description="How many sites a single license key can run on"
			>
				<SettingsField
					label="Default Site Activations"
					type="number"
					value={ siteActivations }
					onChange={ set( setSiteActivations ) }
					helpText="Maximum sites a single license can activate on"
				/>
				<SettingsToggleField
					label="Allow Staging Activations"
					checked={ allowStagingActivations }
					onChange={ set( setAllowStagingActivations ) }
					helpText="Staging and local domains don't count toward the activation limit"
				/>
				<SettingsToggleField
					label="Lock to IP on First Use"
					checked={ lockToIp }
					onChange={ set( setLockToIp ) }
					helpText="Bind a license to the IP used during first activation"
				/>
			</CollapsibleSection>

			<CollapsibleSection
				title="Validation API"
				description="How connected plugins validate a license key"
			>
				<SettingsField
					label="API Endpoint Base URL"
					value={ apiBaseUrl }
					onChange={ set( setApiBaseUrl ) }
					helpText="Public URL where plugins call for license validation"
				/>
				<SettingsToggleField
					label="Require HMAC Signature"
					checked={ requireHmac }
					onChange={ set( setRequireHmac ) }
					helpText="Validate each request with a shared HMAC-SHA256 secret"
				/>
				<SettingsField
					label="HMAC Secret"
					type="password"
					value={ hmacSecret }
					onChange={ set( setHmacSecret ) }
					placeholder="••••••••••••••••••••••••••••••••"
					helpText="Rotate this regularly. Changes take effect immediately"
				/>
			</CollapsibleSection>

			<div className="fixed bottom-6 right-6">
				<FilledButton
					disabled={ ! isDirty }
					onClick={ () => {
						showToast( 'Licensing settings saved', 'success' );
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
