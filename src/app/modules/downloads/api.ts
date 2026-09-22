/**
 * Downloads Module API Client.
 *
 * Typed wrappers for includes/API/Downloads.php's admin routes
 * (GET/POST /purecart/v1/downloads/*).
 *
 * @file
 * @since 1.0.0
 */

import { purecartFetch, purecartFetchRaw } from '@/shared/api';
import type { DownloadLogEntry, DownloadToken, DownloadLogQueryParams, DownloadStats } from './types';

export interface PaginatedDownloadLogResponse {
	data: DownloadLogEntry[];
	total: number;
	totalPages: number;
	stats: DownloadStats;
}

/**
 * GET /purecart/v1/downloads/log — paginated, filtered admin log + KPI stats.
 *
 * @since 1.0.0
 * @param {DownloadLogQueryParams} params Page/search/status/product/date filters.
 * @return {Promise<PaginatedDownloadLogResponse>} The log page + stats.
 */
export async function fetchDownloadLogs(params: DownloadLogQueryParams = {}): Promise<PaginatedDownloadLogResponse> {
	const qs = new URLSearchParams();
	if (params.page) qs.append('page', String(params.page));
	if (params.perPage) qs.append('perPage', String(params.perPage));
	if (params.search) qs.append('search', params.search);
	if (params.status && params.status !== 'All') qs.append('status', params.status);
	if (params.productId && params.productId !== 'All') qs.append('productId', String(params.productId));
	if (params.dateFrom) qs.append('dateFrom', params.dateFrom);

	const query = qs.toString() ? `?${qs.toString()}` : '';
	return purecartFetch<PaginatedDownloadLogResponse>(`/downloads/log${query}`);
}

/**
 * POST /purecart/v1/downloads/token/{id}/revoke
 *
 * @since 1.0.0
 */
export async function revokeDownloadToken(id: number): Promise<{ success: boolean; token: DownloadToken }> {
	return purecartFetch<{ success: boolean; token: DownloadToken }>(`/downloads/token/${id}/revoke`, {
		method: 'POST',
	});
}

/**
 * POST /purecart/v1/downloads/token/{id}/regenerate
 *
 * @since 1.0.0
 */
export async function regenerateDownloadToken(id: number): Promise<{ success: boolean; token: DownloadToken }> {
	return purecartFetch<{ success: boolean; token: DownloadToken }>(`/downloads/token/${id}/regenerate`, {
		method: 'POST',
	});
}

/**
 * POST /purecart/v1/downloads/bulk-revoke
 *
 * @since 1.0.0
 */
export async function bulkRevokeDownloadTokens(ids: number[]): Promise<{ success: boolean; revoked: number }> {
	return purecartFetch<{ success: boolean; revoked: number }>('/downloads/bulk-revoke', {
		method: 'POST',
		data: { ids },
	});
}

/**
 * GET /purecart/v1/downloads/delivery-test — self-test the file delivery path.
 *
 * @since 1.0.0
 */
export async function testDownloadDelivery(): Promise<{ success: boolean; message: string }> {
	return purecartFetch<{ success: boolean; message: string }>('/downloads/delivery-test');
}

export interface DownloadSettings {
	expirySeconds: number;
	maxCount: number;
}

interface RawDownloadSettings {
	expiry_seconds: number;
	max_count: number;
}

/**
 * GET /purecart/v1/downloads/settings
 *
 * @since 1.0.0
 */
export async function fetchDownloadSettings(): Promise<DownloadSettings> {
	const raw = await purecartFetch<RawDownloadSettings>('/downloads/settings');
	return { expirySeconds: raw.expiry_seconds, maxCount: raw.max_count };
}

/**
 * POST /purecart/v1/downloads/settings
 *
 * @since 1.0.0
 */
export async function saveDownloadSettings(settings: DownloadSettings): Promise<void> {
	await purecartFetch('/downloads/settings', {
		method: 'POST',
		data: { expiry_seconds: settings.expirySeconds, max_count: settings.maxCount },
	});
}

/**
 * GET /purecart/v1/downloads/log/export — trigger browser download of CSV.
 *
 * @since 1.0.0
 */
export async function exportDownloadLogCsv(): Promise<void> {
	const res = await purecartFetchRaw('/downloads/log/export', { method: 'GET' });

	const blob = await res.blob();
	const url = URL.createObjectURL(blob);
	const link = document.createElement('a');
	link.href = url;
	link.setAttribute('download', `purecart-download-log-${new Date().toISOString().slice(0, 10)}.csv`);
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	URL.revokeObjectURL(url);
}
