/**
 * Types & Interfaces for the PureCart Software Updates Module.
 *
 * @file
 * @since 1.0.0
 */

export type UpdateChannel = 'stable' | 'beta' | 'nightly';

export type ProductType =
	| 'wp-plugin'
	| 'wp-theme'
	| 'desktop-app'
	| 'cli-tool'
	| 'mobile-app'
	| 'electron-app'
	| 'other';

export type PackageStatus = 'draft' | 'active' | 'archived';

export type Platform =
	| 'universal'
	| 'darwin-arm64'
	| 'darwin-x64'
	| 'win-x64'
	| 'win-arm64'
	| 'linux-x86_64'
	| 'linux-arm64';

export interface ProductVersion {
	id: number;
	productId: number;
	productName: string;
	productSlug?: string;
	productType: ProductType;
	version: string;
	channel: UpdateChannel;
	platform: Platform;
	fileSize: number; // bytes
	checksumSha256: string;
	requiresVersion: string | null; // min WP or OS version
	testedVersion: string | null; // max WP or OS version
	changelog: string; // Markdown text
	status: PackageStatus;
	isRollback: boolean;
	downloadCount: number;
	publishedAt: string | null;
	createdAt: string;
	updatedAt: string;
}

export interface UpdateStats {
	totalPackages: number;
	latestReleases: number;
	pendingDrafts: number;
	totalDownloads: number;
}

export interface RollbackRecord {
	id: number;
	productId: number;
	productName?: string;
	fromVersion: string;
	toVersion: string;
	reason: string;
	rolledBackAt: string;
	rolledBackBy: string;
}

export interface VersionQueryParams {
	page?: number;
	perPage?: number;
	search?: string;
	channel?: UpdateChannel | 'All';
	platform?: Platform | 'All';
	productType?: ProductType | 'All';
	productId?: number | 'All';
	status?: PackageStatus | 'All';
}

export interface UpdateAnalyticsData {
	stats: {
		totalDownloads: number;
		downloadsTrend: number;
		adoptionRate: number;
		uniqueUpdaters: number;
		pendingRollbacks: number;
	};
	dailyDownloads: Array<{ date: string; downloads: number; checks: number }>;
	versionAdoption: Array<{ version: string; percentage: number; count: number }>;
	channelDistribution: Array<{ channel: UpdateChannel; count: number; percentage: number }>;
	platformDistribution: Array<{ platform: Platform; count: number; percentage: number }>;
	rollbacks: RollbackRecord[];
}

export interface NewReleasePayload {
	productId: number;
	version: string;
	channel: UpdateChannel;
	platform: Platform;
	requiresVersion?: string;
	testedVersion?: string;
	changelog: string;
	notifyCustomers: boolean;
	file: File | null;
	status?: PackageStatus;
}
