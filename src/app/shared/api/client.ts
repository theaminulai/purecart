/**
 * Shared REST client: a thin @wordpress/api-fetch wrapper providing typed
 * responses and normalized errors for the PureCart REST namespace.
 *
 * Root URL and nonce middleware are NOT configured here — WordPress core
 * wires both automatically once `wp-api-fetch` is an enqueued script
 * dependency (it reads the current site's REST root and a `wp_rest` nonce),
 * which happens for free via @wordpress/scripts' DependencyExtractionWebpackPlugin.
 * Module-specific endpoints do not belong here — see DEVELOPMENT_GUIDELINES.md §7.
 *
 * @since 1.1.0
 */
import apiFetch, { type APIFetchOptions } from '@wordpress/api-fetch';
import type { ApiError, ApiResponseWithMeta } from './types';

const API_NAMESPACE = '/purecart/v1';

/**
 * `path`/`parse` are always set by this module, never by a caller — excluding
 * them from the accepted options type (rather than just overriding them at
 * the call site) keeps `apiFetch`'s `Parse` generic inferring cleanly from
 * its default instead of collapsing to the wider `boolean` the full
 * `APIFetchOptions['parse']` type would otherwise introduce.
 */
type RequestOptions = Omit<Partial<APIFetchOptions>, 'path' | 'parse'>;

function normalizePath(path: string): string {
	const withSlash = path.startsWith('/') ? path : `/${path}`;
	return `${API_NAMESPACE}${withSlash}`;
}

function normalizeError(error: unknown): ApiError {
	if (error && typeof error === 'object' && 'message' in error) {
		const withMessage = error as { message: unknown; code?: unknown };
		return {
			message: String(withMessage.message),
			code: withMessage.code !== undefined ? String(withMessage.code) : undefined,
		};
	}
	return { message: error instanceof Error ? error.message : 'Unknown error' };
}

/**
 * Builds a query string from key-value parameters, dropping empty/"All" values
 * (the admin filter UI uses "All" as its unset-filter sentinel).
 */
export function buildQueryString(params?: Record<string, unknown>): string {
	if (!params || Object.keys(params).length === 0) return '';
	const validKeys = Object.keys(params).filter(
		(k) => params[k] !== undefined && params[k] !== null && params[k] !== '' && params[k] !== 'All'
	);
	if (validKeys.length === 0) return '';
	const qs = validKeys
		.map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(String(params[k]))}`)
		.join('&');
	return `?${qs}`;
}

/**
 * Authenticated JSON request against a PureCart REST endpoint.
 *
 * @param path    Endpoint path relative to the purecart/v1 namespace, e.g. '/subscriptions'.
 * @param options Extra apiFetch options (method, data, etc.).
 */
export async function purecartFetch<T>(path: string, options?: RequestOptions): Promise<T> {
	try {
		return await apiFetch<T>({ ...options, path: normalizePath(path) });
	} catch (error) {
		throw normalizeError(error);
	}
}

/**
 * Authenticated request that returns the raw `Response` instead of parsed
 * JSON — for endpoints whose body isn't JSON (CSV/file downloads via
 * `response.blob()`, etc.). Prefer {@link purecartFetch} unless you
 * specifically need the raw Response.
 */
export async function purecartFetchRaw(path: string, options?: RequestOptions): Promise<Response> {
	try {
		return await apiFetch<Response, false>({
			...options,
			path: normalizePath(path),
			parse: false,
		});
	} catch (error) {
		throw normalizeError(error);
	}
}

/**
 * Same as {@link purecartFetch}, but also extracts the `X-WP-Total`/
 * `X-WP-TotalPages` pagination headers WordPress list endpoints return.
 */
export async function purecartFetchWithMeta<T>(
	path: string,
	params?: Record<string, unknown>,
	options?: RequestOptions
): Promise<ApiResponseWithMeta<T>> {
	try {
		const response = await apiFetch<Response, false>({
			...options,
			path: `${normalizePath(path)}${buildQueryString(params)}`,
			parse: false,
		});
		const totalHeader = response.headers.get('x-wp-total');
		const totalPagesHeader = response.headers.get('x-wp-totalpages');
		const data = (await response.json()) as T;
		return {
			data,
			total: totalHeader ? parseInt(totalHeader, 10) : Array.isArray(data) ? data.length : 0,
			totalPages: totalPagesHeader ? parseInt(totalPagesHeader, 10) : 1,
		};
	} catch (error) {
		throw normalizeError(error);
	}
}
