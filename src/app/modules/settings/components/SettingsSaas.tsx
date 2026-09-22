/**
 * SettingsSaas - the "SaaS" settings tab.
 *
 * Single-section version of the CollapsibleSection + shared field-row
 * shape used elsewhere in Settings - SaaS only has one config group, so a
 * whole accordion for it isn't worth it.
 *
 * Wired to includes/API/SaaS.php's GET/POST /saas-accounts/settings — the
 * one real settings endpoint this module has. `webhookSecret` is read-only:
 * the backend deliberately doesn't accept it in the save request (see
 * SaaS::save_settings()'s own docblock — rotating it isn't a side effect of
 * saving this form, since that would silently break signature verification
 * on the merchant's SaaS backend).
 *
 * @file
 * @since 1.0.0
 */
import { useEffect, useState } from 'react';
import { M3 } from '@/theme';
import { Card } from '@/shared/ui/Card';
import { FilledButton } from '@/shared/ui/FilledButton';
import { Toast } from '@/shared/ui/Toast';
import type { ToastProps } from '@/shared/ui';
import { fetchSaasSettings, saveSaasSettings, type SaasSettings } from '@/modules/saas-accounts';
import { SettingsField } from './shared';

const EMPTY_SETTINGS: SaasSettings = {
	webhookUrl: '',
	webhookSecret: '',
	jwtExpirySeconds: 600,
	jwtRefreshSeconds: 30 * 24 * 60 * 60,
};

/**
 * Renders the SaaS settings tab.
 *
 * @since 1.0.0
 *
 * @return {JSX.Element} The SaaS settings tab.
 */
export function SettingsSaas() {
	const [ settings, setSettings ] = useState< SaasSettings >( EMPTY_SETTINGS );
	const [ isDirty, setIsDirty ] = useState( false );
	const [ isSaving, setIsSaving ] = useState( false );
	const [ toast, setToast ] = useState< ToastProps >( {
		message: '',
		type: 'success',
		visible: false,
	} );

	useEffect( () => {
		fetchSaasSettings()
			.then( setSettings )
			.catch( () => showToast( 'Failed to load SaaS settings', 'error' ) );
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

	const update = < K extends keyof SaasSettings >( key: K, value: SaasSettings[ K ] ) => {
		setSettings( ( s ) => ( { ...s, [ key ]: value } ) );
		setIsDirty( true );
	};

	const handleSave = async () => {
		setIsSaving( true );
		try {
			await saveSaasSettings( settings );
			showToast( 'SaaS settings saved', 'success' );
			setIsDirty( false );
		} catch {
			showToast( 'Failed to save SaaS settings', 'error' );
		} finally {
			setIsSaving( false );
		}
	};

	return (
		<div className="flex flex-col gap-3 pb-20">
			<div className="mb-2">
				<h2
					className="font-medium text-lg"
					style={ {
						color: M3.onSurface,
						fontFamily: 'Roboto, sans-serif',
					} }
				>
					SaaS Settings
				</h2>
				<p
					className="text-sm mt-1"
					style={ {
						color: M3.onSurfaceVariant,
						fontFamily: 'Roboto, sans-serif',
					} }
				>
					Webhook delivery and login-token settings for SaaS account
					provisioning.
				</p>
			</div>
			<Card
				className="p-4 flex flex-col divide-y"
				style={ { color: M3.outlineVariant } }
			>
				<SettingsField
					label="Webhook URL"
					value={ settings.webhookUrl }
					onChange={ ( v ) => update( 'webhookUrl', v ) }
					placeholder="https://your-saas-platform.example.com/webhooks/purecart"
					helpText="Merchant's SaaS platform endpoint that receives provisioning events"
				/>
				<SettingsField
					label="Webhook Secret"
					type="password"
					value={ settings.webhookSecret }
					onChange={ () => {} }
					disabled
					placeholder="Auto-generated on first webhook send"
					helpText="Signs outbound webhooks (HMAC-SHA256). Auto-generated — not editable here"
				/>
				<SettingsField
					label="JWT Access Token Expiry"
					type="number"
					suffix="seconds"
					value={ settings.jwtExpirySeconds }
					onChange={ ( v ) =>
						update( 'jwtExpirySeconds', parseInt( v, 10 ) || 0 )
					}
					helpText="How long a SaaS login access token stays valid"
				/>
				<SettingsField
					label="JWT Refresh Token Expiry"
					type="number"
					suffix="seconds"
					value={ settings.jwtRefreshSeconds }
					onChange={ ( v ) =>
						update( 'jwtRefreshSeconds', parseInt( v, 10 ) || 0 )
					}
					helpText="How long a SaaS login refresh token stays valid"
				/>
			</Card>

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
