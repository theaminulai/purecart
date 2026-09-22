/**
 * SettingsSaas - the "SaaS" settings tab.
 *
 * Single-section version of the CollapsibleSection + shared field-row
 * shape used elsewhere in Settings - SaaS only has one config group, so a
 * whole accordion for it isn't worth it. Local component state only, like
 * every other Settings tab - the SaaS Accounts page itself is still a
 * ComingSoon placeholder, so there's no real endpoint to save these to yet.
 *
 * @file
 * @since 1.0.0
 */
import { useState } from 'react';
import { M3 } from '@/theme';
import { Card } from '@/shared/ui/Card';
import { FilledButton } from '@/shared/ui/FilledButton';
import { Toast } from '@/shared/ui/Toast';
import type { ToastProps } from '@/shared/ui';
import { SettingsField, SettingsToggleField } from './shared';

/**
 * Renders the SaaS settings tab.
 *
 * @since 1.0.0
 *
 * @return {JSX.Element} The SaaS settings tab.
 */
export function SettingsSaas() {
	const [ trialPeriod, setTrialPeriod ] = useState( '14' );
	const [ requireCardOnTrial, setRequireCardOnTrial ] = useState( false );
	const [ seatOverProvisioning, setSeatOverProvisioning ] = useState( '10' );
	const [ autoSuspendOnNonPayment, setAutoSuspendOnNonPayment ] =
		useState( true );
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
					Trial and account provisioning defaults for the SaaS
					Accounts module.
				</p>
			</div>
			<Card
				className="p-4 flex flex-col divide-y"
				style={ { color: M3.outlineVariant } }
			>
				<SettingsField
					label="Trial Period"
					suffix="days"
					type="number"
					value={ trialPeriod }
					onChange={ set( setTrialPeriod ) }
					helpText="Length of free trial for new SaaS accounts"
				/>
				<SettingsToggleField
					label="Require Credit Card on Trial"
					checked={ requireCardOnTrial }
					onChange={ set( setRequireCardOnTrial ) }
					helpText="Require payment details before starting a trial"
				/>
				<SettingsField
					label="Seat Over-Provisioning"
					suffix="%"
					type="number"
					value={ seatOverProvisioning }
					onChange={ set( setSeatOverProvisioning ) }
					helpText="Allow accounts to exceed their seat limit by this %"
				/>
				<SettingsToggleField
					label="Auto-Suspend on Non-Payment"
					checked={ autoSuspendOnNonPayment }
					onChange={ set( setAutoSuspendOnNonPayment ) }
					helpText="Suspend account immediately if payment fails after dunning"
				/>
			</Card>

			<div className="fixed bottom-6 right-6">
				<FilledButton
					disabled={ ! isDirty }
					onClick={ () => {
						showToast( 'SaaS settings saved', 'success' );
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
