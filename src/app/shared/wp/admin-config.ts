/**
 * Typed access to `window.purecartAdmin` — the config WordPress localizes
 * onto the page in `includes/Admin/Admin.php::enqueue_assets()`.
 *
 * The global is declared exactly once, here, rather than in each consumer:
 * two `declare global` blocks describing the same property must agree
 * field-for-field or TypeScript errors, which is a trap when a new field is
 * added on the PHP side and only one declaration is updated.
 *
 * This file is module-independent by design (§5) — it knows about WordPress,
 * not about licenses, subscriptions, or any other business capability.
 *
 * @file
 * @since 1.1.0
 */

/**
 * The signed-in WordPress user, as localized for the top bar account menu.
 *
 * `canManageOptions` decides whether the menu renders its Settings link and
 * nothing else — it is not an authorization source; the REST API re-checks
 * every capability server-side.
 */
export interface PurecartCurrentUser {
	id: number;
	name: string;
	email: string;
	/** Gravatar (or filtered avatar) URL; empty when avatars are disabled. */
	avatarUrl: string;
	/** Translated label of the user's primary role, e.g. "Administrator". */
	roleLabel: string;
	profileUrl: string;
	logoutUrl: string;
	canManageOptions: boolean;
}

export interface PurecartAdminConfig {
	/** React page slug to navigate to on initial load. */
	currentPage?: string;
	nonce?: string;
	restNonce?: string;
	apiUrl?: string;
	adminUrl?: string;
	version?: string;
	currentUser?: PurecartCurrentUser;
}

declare global {
	interface Window {
		purecartAdmin?: PurecartAdminConfig;
	}
}

/**
 * The localized admin config, or an empty object when the SPA is rendered
 * outside wp-admin (tests, Storybook-style harnesses) and nothing localized it.
 *
 * @since 1.1.0
 */
export function getAdminConfig(): PurecartAdminConfig {
	return window.purecartAdmin ?? {};
}

/**
 * The signed-in user, or null when the payload is missing or unusable —
 * callers render a non-interactive fallback rather than an account menu
 * whose links would go nowhere.
 *
 * @since 1.1.0
 */
export function getCurrentUser(): PurecartCurrentUser | null {
	const user = getAdminConfig().currentUser;
	return user && user.id > 0 && '' !== user.name ? user : null;
}

/**
 * Up to two initials for an avatar fallback, e.g. "Abdur Rahman" → "AR".
 *
 * Uses `Array.from` rather than `[0]` so a name whose first letter is a
 * surrogate pair (most non-Latin scripts and emoji) yields that whole
 * character instead of half of it.
 *
 * @since 1.1.0
 * @param name Display name to derive initials from.
 */
export function getUserInitials( name: string ): string {
	const words = name.trim().split( /\s+/ ).filter( Boolean );
	if ( 0 === words.length ) return '';

	const first = Array.from( words[ 0 ] )[ 0 ] ?? '';
	const last = words.length > 1 ? Array.from( words[ words.length - 1 ] )[ 0 ] ?? '' : '';

	return ( first + last ).toUpperCase();
}
