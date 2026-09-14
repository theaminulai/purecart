/**
 * Updates Module API Client.
 *
 * Provides typed methods for interacting with PureCart Software Update REST routes.
 *
 * @file
 * @since 1.0.0
 */

import { apiFetch, getApiBase, getRestNonce } from '../client';
import type {
	ProductVersion,
	UpdateStats,
	VersionQueryParams,
	UpdateAnalyticsData,
	RollbackRecord,
	NewReleasePayload,
} from '../../types/updates';

export interface PaginatedVersionsResponse {
	data: ProductVersion[];
	total: number;
	totalPages: number;
	stats: UpdateStats;
}

/**
 * Fetches all WooCommerce products available for updates.
 */
export async function fetchProducts(): Promise<Array<{ id: number; name: string; slug: string }>> {
	const res = await apiFetch<Array<{ product_id: number; product_name: string; slug: string }>>('/updates/products');
	return ( res || [] ).map( ( p ) => ( {
		id: p.product_id,
		name: p.product_name,
		slug: p.slug,
	} ) );
}

/**
 * Fetches software packages and versions with pagination, search, and filter queries.
 */
export async function fetchVersions(
	params: VersionQueryParams = {}
): Promise<PaginatedVersionsResponse> {
	const qs = new URLSearchParams();
	if (params.page) qs.append('page', String(params.page));
	if (params.perPage) qs.append('perPage', String(params.perPage));
	if (params.search) qs.append('search', params.search);
	if (params.channel && params.channel !== 'All') qs.append('channel', params.channel);
	if (params.platform && params.platform !== 'All') qs.append('platform', params.platform);
	if (params.productType && params.productType !== 'All') qs.append('productType', params.productType);
	if (params.productId && params.productId !== 'All') qs.append('productId', String(params.productId));
	if (params.status && params.status !== 'All') qs.append('status', params.status);

	const query = qs.toString() ? `?${qs.toString()}` : '';
	return apiFetch<PaginatedVersionsResponse>(`/updates/versions${query}`);
}

/**
 * Uploads a new package archive with form metadata.
 */
export async function uploadPackage(
	payload: NewReleasePayload
): Promise<{ success: boolean; version: ProductVersion }> {
	const formData = new FormData();
	formData.append('productId', String(payload.productId));
	formData.append('version', payload.version);
	formData.append('channel', payload.channel);
	formData.append('platform', payload.platform);
	if (payload.requiresVersion) formData.append('requiresVersion', payload.requiresVersion);
	if (payload.testedVersion) formData.append('testedVersion', payload.testedVersion);
	formData.append('changelog', payload.changelog);
	formData.append('notifyCustomers', payload.notifyCustomers ? '1' : '0');
	if (payload.file) {
		formData.append('file', payload.file);
	}

	const apiBase = getApiBase();
	const res = await fetch(`${apiBase}/updates/upload`, {
		method: 'POST',
		headers: {
			'X-WP-Nonce': getRestNonce(),
		},
		body: formData,
	});

	if (!res.ok) {
		let errorMsg = `Upload failed (${res.status})`;
		try {
			const json = await res.json();
			if (json?.message) errorMsg = json.message;
		} catch {}
		throw new Error(errorMsg);
	}

	return res.json();
}

/**
 * Publishes or promotes a version to a channel.
 */
export async function publishVersion(
	versionId: number,
	channel: string = 'stable'
): Promise<{ success: boolean }> {
	return apiFetch<{ success: boolean }>(`/updates/versions/${versionId}/publish`, {
		method: 'POST',
		body: JSON.stringify({ channel }),
	});
}

/**
 * Sets active/archived status for a package version.
 */
export async function setVersionStatus(
	versionId: number,
	status: 'active' | 'archived'
): Promise<{ success: boolean }> {
	return apiFetch<{ success: boolean }>(`/updates/versions/${versionId}/status`, {
		method: 'POST',
		body: JSON.stringify({ status }),
	});
}

/**
 * Deletes a package version and its stored physical file.
 */
export async function deleteVersion(versionId: number): Promise<{ success: boolean }> {
	return apiFetch<{ success: boolean }>(`/updates/versions/${versionId}`, {
		method: 'DELETE',
	});
}

/**
 * Generates a temporary 15-minute test download URL.
 */
export async function generateTestUrl(versionId: number): Promise<{ url: string }> {
	return apiFetch<{ url: string }>(`/updates/versions/${versionId}/test-url`, {
		method: 'POST',
	});
}

/**
 * Executes an emergency rollback.
 */
export async function rollbackVersion(payload: {
	productId: number;
	version: string;
	reason: string;
}): Promise<{ success: boolean; record: RollbackRecord }> {
	return apiFetch<{ success: boolean; record: RollbackRecord }>('/updates/rollback', {
		method: 'POST',
		body: JSON.stringify({
			product_id: payload.productId,
			version: payload.version,
			reason: payload.reason,
		}),
	});
}

/**
 * Fetches update adoption analytics and download trends.
 */
export async function fetchUpdateAnalytics(): Promise<UpdateAnalyticsData> {
	return apiFetch<UpdateAnalyticsData>('/updates/analytics');
}

/**
 * Fetches customer notification email preview HTML.
 */
export async function fetchEmailPreview(): Promise<{ html: string }> {
	return apiFetch<{ html: string }>('/updates/email-preview');
}
