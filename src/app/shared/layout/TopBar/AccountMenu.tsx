/**
 * AccountMenu component.
 *
 * The top bar's user chip: avatar (or initials) trigger opening a menu with
 * the signed-in user's identity and the three places an admin actually goes
 * from here — their WordPress profile, PureCart settings, and log out.
 *
 * Reads the user from the localized `purecartAdmin.currentUser` payload
 * rather than the REST API: it is already on the page before the SPA boots,
 * so the chip never renders a placeholder that then changes.
 *
 * @file
 * @since 1.1.0
 */
import { useState } from 'react';
import { LogOut, Settings, UserCog } from 'lucide-react';
import { __ } from '@wordpress/i18n';
import { M3 } from '@/theme';
import { AnchoredMenu } from '@/shared/ui';
import { getCurrentUser, getUserInitials } from '@/shared/wp';
import { AccountMenuItem } from './AccountMenuItem';
import type { Page } from '@/shared/types/page';

/**
 * Renders the avatar chip and its account menu.
 *
 * With no usable user payload the chip renders as a plain, non-interactive
 * badge — a menu whose Profile/Log out links had nowhere to point would be
 * worse than no menu.
 *
 * @since 1.1.0
 *
 * @param {Object}   props       Component props.
 * @param {Function} props.onNav Navigates the SPA to a page — used by the Settings item.
 *
 * @return {JSX.Element} The avatar chip, with a menu when a user is known.
 */
export function AccountMenu( { onNav }: { onNav: ( p: Page ) => void } ) {
	const user = getCurrentUser();
	const [ avatarFailed, setAvatarFailed ] = useState( false );

	const initials = user ? getUserInitials( user.name ) : '';
	const showAvatar = !! user?.avatarUrl && ! avatarFailed;

	const chip = ( active: boolean ) => (
		<span
			className="flex items-center justify-center w-9 h-9 rounded-full text-sm font-medium ml-1 overflow-hidden"
			style={ {
				backgroundColor: M3.primaryContainer,
				color: M3.onPrimaryContainer,
				fontFamily: 'Roboto, sans-serif',
				boxShadow: active ? `0 0 0 2px ${ M3.primary }` : 'none',
			} }
		>
			{ showAvatar ? (
				<img
					src={ user?.avatarUrl }
					alt=""
					width={ 36 }
					height={ 36 }
					className="w-full h-full object-cover"
					onError={ () => setAvatarFailed( true ) }
				/>
			) : (
				initials
			) }
		</span>
	);

	if ( ! user ) {
		return chip( false );
	}

	return (
		<AnchoredMenu
			panelWidth={ 260 }
			label={ __( 'Account', 'purecart' ) }
			trigger={ ( open ) => (
				<button
					type="button"
					title={ user.name }
					aria-label={ __( 'Account menu', 'purecart' ) }
					aria-haspopup="menu"
					aria-expanded={ open }
					className="flex items-center"
					style={ { background: 'none', border: 'none', padding: 0, cursor: 'pointer' } }
				>
					{ chip( open ) }
				</button>
			) }
		>
			{ ( { close } ) => (
				<>
					<div
						className="px-4 py-3 flex-shrink-0"
						style={ {
							backgroundColor: M3.surfaceContainerLow,
							borderBottom: `1px solid ${ M3.outlineVariant }`,
						} }
					>
						<div
							className="text-sm font-medium truncate"
							style={ { color: M3.onSurface, fontFamily: 'Roboto, sans-serif' } }
						>
							{ user.name }
						</div>
						<div
							className="text-xs truncate"
							style={ { color: M3.onSurfaceVariant, fontFamily: 'Roboto, sans-serif' } }
						>
							{ user.email }
						</div>
						{ '' !== user.roleLabel && (
							<div
								className="text-xs mt-1.5 inline-block px-2 py-0.5 rounded-full"
								style={ {
									backgroundColor: M3.secondaryContainer,
									color: M3.onSecondaryContainer,
									fontFamily: 'Roboto, sans-serif',
								} }
							>
								{ user.roleLabel }
							</div>
						) }
					</div>

					<div className="py-1">
						<AccountMenuItem
							icon={ UserCog }
							label={ __( 'Edit profile', 'purecart' ) }
							href={ user.profileUrl }
						/>
						{ user.canManageOptions && (
							<AccountMenuItem
								icon={ Settings }
								label={ __( 'PureCart settings', 'purecart' ) }
								onClick={ () => {
									onNav( 'settings' );
									close();
								} }
							/>
						) }
						<AccountMenuItem
							icon={ LogOut }
							label={ __( 'Log out', 'purecart' ) }
							href={ user.logoutUrl }
							danger
						/>
					</div>
				</>
			) }
		</AnchoredMenu>
	);
}
