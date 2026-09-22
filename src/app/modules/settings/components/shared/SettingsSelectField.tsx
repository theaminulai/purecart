/**
 * SettingsSelectField component.
 *
 * Renders a label + dropdown row shared by every Settings tab, matching
 * SettingsField's layout. Composes the shared ui/Select rather than
 * styling its own <select>, so the dropdown's look lives in one place. The
 * label + row layout here is scoped to Settings - not a generic ui/
 * primitive, since nothing outside Settings tabs uses this row shape.
 *
 * @file
 * @since 1.0.0
 */
import { M3 } from '@/theme';
import { Select } from '@/shared/ui/Select';

/**
 * Renders a label-left, dropdown-right settings row.
 *
 * @since 1.0.0
 *
 * @param {Object}   props            Component props.
 * @param {string}   props.label      Field label.
 * @param {string}   props.value      Currently selected option value.
 * @param {Array}    props.options    Selectable { label, value } options.
 * @param {Function} props.onChange   Callback invoked with the newly selected value.
 * @param {string}   [props.helpText] Optional muted helper text shown under the label.
 * @param {boolean}  [props.disabled] Disables the select when true.
 *
 * @return {JSX.Element} The settings select-field row.
 */
export function SettingsSelectField( {
	label,
	value,
	options,
	onChange,
	helpText,
	disabled = false,
}: {
	label: string;
	value: string;
	options: { label: string; value: string }[];
	onChange: ( value: string ) => void;
	helpText?: string;
	disabled?: boolean;
} ) {
	return (
		<div className="flex items-start justify-between gap-4 py-3">
			<div className="flex-1">
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
			<Select
				value={ value }
				options={ options }
				onChange={ onChange }
				disabled={ disabled }
			/>
		</div>
	);
}
