/**
 * SettingsField component.
 *
 * Renders a single label + text/number/password input row shared by every
 * Settings tab. The general-purpose field the other Settings* components
 * specialize. Composes the shared ui/Input rather than styling its own
 * <input>, so the input's look lives in one place. The label + row layout
 * here is scoped to Settings - not a generic ui/ primitive, since nothing
 * outside Settings tabs uses this row shape.
 *
 * @file
 * @since 1.0.0
 */
import { M3 } from '@/theme';
import { Input } from '@/shared/ui/Input';

/**
 * Renders a label-left, input-right settings row.
 *
 * @since 1.0.0
 *
 * @param {Object}                     props               Component props.
 * @param {string}                     props.label         Field label.
 * @param {string|number}              props.value         Current field value.
 * @param {Function}                   props.onChange      Callback invoked with the new raw string value on change.
 * @param {'text'|'number'|'password'} [props.type]        Input type, defaults to 'text'.
 * @param {string}                     [props.suffix]      Unit label shown after the input, e.g. 'days'.
 * @param {string}                     [props.placeholder] Placeholder text shown when the input is empty.
 * @param {string}                     [props.helpText]    Optional muted helper text shown under the label.
 * @param {boolean}                    [props.disabled]    Disables the input when true.
 *
 * @return {JSX.Element} The settings field row.
 */
export function SettingsField( {
	label,
	value,
	onChange,
	type = 'text',
	suffix,
	placeholder,
	helpText,
	disabled = false,
}: {
	label: string;
	value: string | number;
	onChange: ( value: string ) => void;
	type?: 'text' | 'number' | 'password';
	suffix?: string;
	placeholder?: string;
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
			<div className="flex items-center gap-2 flex-shrink-0">
				<Input
					type={ type }
					value={ value }
					onChange={ onChange }
					placeholder={ placeholder }
					disabled={ disabled }
				/>
				{ suffix && (
					<span
						className="text-xs"
						style={ {
							color: M3.onSurfaceVariant,
							fontFamily: 'Roboto, sans-serif',
						} }
					>
						{ suffix }
					</span>
				) }
			</div>
		</div>
	);
}
