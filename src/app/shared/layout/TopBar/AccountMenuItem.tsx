/**
 * AccountMenuItem component.
 *
 * One row of the top bar account menu — an anchor when it leaves the SPA
 * (wp-admin profile, log out), a button when it navigates inside it, styled
 * identically either way so the menu reads as one list.
 *
 * @file
 * @since 1.1.0
 */
import { M3 } from '@/theme';

/**
 * Renders a single account-menu row.
 *
 * @since 1.1.0
 *
 * @param {Object}            props           Component props.
 * @param {React.ElementType} props.icon      Lucide icon rendered beside the label.
 * @param {string}            props.label     Row label.
 * @param {string}            [props.href]    Destination for rows that leave the SPA.
 * @param {Function}          [props.onClick] Handler for rows that stay in the SPA.
 * @param {boolean}           [props.danger]  Renders the row in the error color.
 *
 * @return {JSX.Element} The menu row.
 */
export function AccountMenuItem( {
	icon: Icon,
	label,
	href,
	onClick,
	danger = false,
}: {
	icon: React.ElementType;
	label: string;
	href?: string;
	onClick?: () => void;
	danger?: boolean;
} ) {
	const className =
		'flex items-center gap-3 w-full px-4 py-2.5 text-sm text-left transition-colors';
	const style = {
		background: 'none',
		border: 'none',
		cursor: 'pointer',
		color: danger ? M3.error : M3.onSurface,
		fontFamily: 'Roboto, sans-serif',
		textDecoration: 'none',
	};
	const hover = {
		onMouseEnter: ( e: React.MouseEvent< HTMLElement > ) => {
			e.currentTarget.style.backgroundColor = danger
				? M3.errorContainer
				: M3.surfaceContainerHigh;
		},
		onMouseLeave: ( e: React.MouseEvent< HTMLElement > ) => {
			e.currentTarget.style.backgroundColor = 'transparent';
		},
	};
	const content = (
		<>
			<Icon size={ 15 } color={ danger ? M3.error : M3.onSurfaceVariant } />
			{ label }
		</>
	);

	return href ? (
		<a href={ href } className={ className } style={ style } { ...hover }>
			{ content }
		</a>
	) : (
		<button type="button" onClick={ onClick } className={ className } style={ style } { ...hover }>
			{ content }
		</button>
	);
}
