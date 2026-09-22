/**
 * SettingsTextareaField component.
 *
 * Renders a label above a <textarea> for multi-line settings values (e.g.
 * one-domain-per-line lists, notes templates). Label sits above the field
 * rather than beside it, since a textarea needs the full row width.
 * Composes the shared ui/Textarea rather than styling its own <textarea>,
 * so the field's look lives in one place. The label + row layout here is
 * scoped to Settings - not a generic ui/ primitive, since nothing outside
 * Settings tabs uses this row shape.
 *
 * @file
 * @since 1.0.0
 */
import { M3 } from '@/theme';
import { Textarea } from '@/shared/ui/Textarea';

/**
 * Renders a stacked label + textarea settings field.
 *
 * @since 1.0.0
 *
 * @param {Object}   props               Component props.
 * @param {string}   props.label         Field label.
 * @param {string}   props.value         Current textarea value.
 * @param {Function} props.onChange      Callback invoked with the new raw text on change.
 * @param {number}   [props.rows]        Visible row count, defaults to 3.
 * @param {string}   [props.placeholder] Placeholder text shown when empty.
 * @param {string}   [props.helpText]    Optional muted helper text shown under the label.
 * @param {boolean}  [props.disabled]    Disables the textarea when true.
 *
 * @return {JSX.Element} The settings textarea field.
 */
export function SettingsTextareaField( {
	label,
	value,
	onChange,
	rows = 3,
	placeholder,
	helpText,
	disabled = false,
}: {
	label: string;
	value: string;
	onChange: ( value: string ) => void;
	rows?: number;
	placeholder?: string;
	helpText?: string;
	disabled?: boolean;
} ) {
	return (
		<div className="py-3">
			<div
				className="text-sm mb-1"
				style={ {
					color: M3.onSurface,
					fontFamily: 'Roboto, sans-serif',
				} }
			>
				{ label }
			</div>
			{ helpText && (
				<div
					className="text-xs mb-2"
					style={ {
						color: M3.onSurfaceVariant,
						fontFamily: 'Roboto, sans-serif',
					} }
				>
					{ helpText }
				</div>
			) }
			<Textarea
				value={ value }
				onChange={ onChange }
				rows={ rows }
				placeholder={ placeholder }
				disabled={ disabled }
			/>
		</div>
	);
}
