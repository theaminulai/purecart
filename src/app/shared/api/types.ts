/**
 * Shared API types.
 *
 * @since 1.1.0
 */

/*
 * `window.purecartAdmin` (the wp-admin SPA's config) is declared in
 * shared/wp/admin-config.ts, not here - one declaration per global, or
 * TypeScript rejects the second one the moment the two drift apart.
 */
declare global {
	interface Window {
		purecartConfig?: {
			nonce: string; // wp_create_nonce( 'wp_rest' )
			restBase: string; // e.g. 'https://example.com/wp-json/purecart/v1'
			adminUrl: string;
			myAccountUrl: string;
			currentUser: number;
			currency: string;
			dateFormat: string;
		};
	}
}

export interface ApiResponseWithMeta<T> {
	data: T;
	total: number;
	totalPages: number;
}

/** Normalized shape every REST error is coerced into before it reaches a component. */
export interface ApiError {
	message: string;
	code?: string;
}
