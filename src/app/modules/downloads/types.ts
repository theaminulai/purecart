/**
 * Downloads module TypeScript data shapes.
 *
 * Field names and enum values match includes/API/Downloads.php's prepare_*()
 * output exactly (camelCase, matches the backend verbatim) so no translation
 * layer is ever needed between the REST response and the UI.
 *
 * @file
 * @since 1.0.0
 */

export type DownloadLogStatus =
	| 'success'
	| 'rejected_expired'
	| 'rejected_exhausted'
	| 'rejected_revoked';

export type DownloadTokenStatus = 'active' | 'expired' | 'revoked';

export interface DownloadLogEntry {
	id: number;
	downloadId: number;
	orderId: number;
	productId: number;
	fileId: number;
	fileLabel: string;
	fileExtension: string;
	token: string; // last 8 chars only
	status: DownloadLogStatus;
	ipAddress: string;
	downloadedAt: string;
	customerName: string;
	customerEmail: string;
	productName: string;
	tokenStatus: DownloadTokenStatus;
	downloadCount: number;
	maxDownloads: number; // 0 = unlimited
	expiresAt: string;
}

export interface DownloadToken {
	id: number;
	orderId: number;
	productId: number;
	productName: string;
	customerName: string;
	customerEmail: string;
	token: string; // last 8 chars only
	downloadCount: number;
	maxDownloads: number; // 0 = unlimited
	expiresAt: string;
	status: DownloadTokenStatus;
}

export interface DownloadStats {
	totalDownloads: number;
	uniqueFiles: number;
	failedAttempts: number;
	tokensExpiringIn24h: number;
}

export interface DownloadLogQueryParams {
	page?: number;
	perPage?: number;
	search?: string;
	status?: DownloadLogStatus | 'All';
	productId?: number | 'All';
	dateFrom?: string;
}
