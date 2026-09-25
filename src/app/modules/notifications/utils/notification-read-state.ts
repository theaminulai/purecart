/**
 * Read state for the notification feed.
 *
 * Kept in the browser, not the database: the feed itself is derived on the
 * client and has no server-side identity to hang a per-user read flag on.
 * The practical consequence is that "read" is per browser, not per account —
 * acceptable for a dismissable badge, and the thing to revisit first if this
 * ever grows a real backend store.
 *
 * @file
 * @since 1.1.0
 */

const STORAGE_KEY = 'purecart:notifications:read';

/**
 * Previously read notification IDs, or an empty list when storage is
 * unavailable (private browsing, blocked cookies) or holds anything but the
 * array this module wrote.
 *
 * @since 1.1.0
 * @return {string[]} Stored IDs.
 */
export function loadReadNotificationIds(): string[] {
	try {
		const raw = window.localStorage.getItem( STORAGE_KEY );
		if ( ! raw ) return [];
		const parsed: unknown = JSON.parse( raw );
		return Array.isArray( parsed )
			? parsed.filter( ( id ): id is string => 'string' === typeof id )
			: [];
	} catch {
		return [];
	}
}

/**
 * Persists read IDs, ignoring storage failures — a browser that refuses to
 * remember which notifications were read should still show them.
 *
 * @since 1.1.0
 * @param {string[]} ids IDs to store.
 */
export function persistReadNotificationIds( ids: string[] ): void {
	try {
		window.localStorage.setItem( STORAGE_KEY, JSON.stringify( ids ) );
	} catch {
		// Intentionally ignored - see above.
	}
}
