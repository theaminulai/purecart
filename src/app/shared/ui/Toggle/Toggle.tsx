/**
 * Toggle UI component.
 *
 * Renders a Material Design 3 on/off switch: an outlined track with a small
 * dot when off, filling solid with a larger thumb when on - the real M3
 * switch shape, not a generic iOS-style pill. Purely controlled - visibility
 * of the "on" state is driven entirely by the checked prop.
 *
 * @file
 * @since 1.0.0
 */
import { M3 } from '@/theme';

/**
 * Renders an M3 switch with a growing/shrinking thumb and an outlined
 * track in the "off" state.
 *
 * @since 1.0.0
 *
 * @param {Object}            props            Component props.
 * @param {boolean}           props.checked    Whether the toggle is in the "on" state.
 * @param {Function}          props.onChange   Callback invoked with the new checked value on click.
 * @param {boolean}           [props.disabled] Disables interaction and dims the toggle when true.
 * @param {'default'|'small'} [props.size]     Renders a scaled-down variant when 'small'.
 *
 * @return {JSX.Element} A clickable switch element.
 */
export function Toggle( {
	checked,
	onChange,
	disabled = false,
	size = 'default',
}: {
	checked: boolean;
	onChange: ( checked: boolean ) => void;
	disabled?: boolean;
	size?: 'default' | 'small';
} ) {
	const scale = size === 'small' ? 0.72 : 1;
	const width = Math.round( 52 * scale );
	const height = Math.round( 32 * scale );
	const thumbOff = Math.round( 16 * scale );
	const thumbOn = Math.round( 24 * scale );
	const edgeInset = Math.round( 6 * scale );
	const onInset = Math.round( 4 * scale );
	const thumbSize = checked ? thumbOn : thumbOff;

	return (
		<button
			type="button"
			role="switch"
			aria-checked={ checked }
			disabled={ disabled }
			onClick={ () => ! disabled && onChange( ! checked ) }
			className="relative inline-flex items-center flex-shrink-0 rounded-full transition-all"
			style={ {
				width,
				height,
				padding: 0,
				backgroundColor: checked ? M3.primary : M3.outlineVariant,
				border: checked ? 'none' : `2px solid ${ M3.outline }`,
				cursor: disabled ? 'not-allowed' : 'pointer',
				opacity: disabled ? 0.4 : 1,
			} }
		>
			<span
				className="absolute rounded-full transition-all"
				style={ {
					width: thumbSize,
					height: thumbSize,
					backgroundColor: checked ? M3.onPrimary : M3.outline,
					left: checked
						? `calc(100% - ${ thumbOn + onInset }px)`
						: edgeInset,
					top: '50%',
					transform: 'translateY(-50%)',
					transitionDuration: '150ms',
				} }
			/>
		</button>
	);
}
