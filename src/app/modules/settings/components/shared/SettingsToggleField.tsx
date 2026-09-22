/**
 * SettingsToggleField component.
 *
 * Renders a label + Toggle row shared by every Settings tab, styled to
 * match SettingsField's layout. Booleans are the most common settings
 * value, so this is the most commonly used Settings* field. Scoped to the
 * Settings module - not a generic ui/ primitive, since nothing outside
 * Settings tabs uses it. Composes the real ui/Toggle switch rather than
 * reimplementing it.
 *
 * @file
 * @since 1.0.0
 */
import { M3 } from '@/theme';
import { Toggle } from '@/shared/ui/Toggle';

/**
 * Renders a label-left, toggle-right settings row.
 *
 * @since 1.0.0
 *
 * @param {Object}   props            Component props.
 * @param {string}   props.label      Field label.
 * @param {boolean}  props.checked    Current toggle state.
 * @param {Function} props.onChange   Callback invoked with the new checked value.
 * @param {string}   [props.helpText] Optional muted helper text shown under the label.
 * @param {boolean}  [props.disabled] Disables the toggle when true.
 *
 * @return {JSX.Element} The settings toggle-field row.
 */
export function SettingsToggleField( {
	label,
	checked,
	onChange,
	helpText,
	disabled = false,
}: {
	label: string;
	checked: boolean;
	onChange: ( checked: boolean ) => void;
	helpText?: string;
	disabled?: boolean;
} ) {
	return (
		<div className="flex items-center justify-between gap-4 py-2.5">
			<div>
				<div
					className="text-sm"
					style={ {
						color: M3.onSurface,
						fontFamily: 'Roboto, sans-serif',
					} }
				>
					{ label }
				</div>
				{ helpText && (
					<div
						className="text-xs mt-0.5"
						style={ {
							color: M3.onSurfaceVariant,
							fontFamily: 'Roboto, sans-serif',
						} }
					>
						{ helpText }
					</div>
				) }
			</div>
			<Toggle
				checked={ checked }
				onChange={ onChange }
				disabled={ disabled }
			/>
		</div>
	);
}
