/**
 * SaaS Accounts Module API Client.
 *
 * Typed wrappers for includes/API/SaaS.php's admin routes
 * (GET /purecart/v1/saas-accounts, /stats, /{id} row actions, and the
 * GET/POST /saas-accounts/settings pair).
 *
 * The customer-facing JWT routes (/saas/token, /saas/token/refresh,
 * /saas/usage/{api_key}) are deliberately absent: they authenticate by API
 * key rather than by WP capability and are called by the merchant's SaaS
 * backend, never by this admin SPA.
 *
 * @file
 * @since 1.0.0
 */

import { purecartFetch, purecartFetchWithMeta } from '@/shared/api';
import type {
	SaasAccountRecord,
	SaasAccountQueryParams,
	SaasAccountStatus,
	SaasStats,
} from './types';

/** One account row exactly as SaaS::prepare_account() emits it. */
interface RawSaasAccount {
	id: number;
	order_id: number;
	order_number: string;
	user_id: number;
	customer_name: string;
	customer_email: string;
	product_id: number;
	product_name: string;
	plan: string;
	api_key_masked: string;
	status: SaasAccountStatus;
	provisioned_at: string;
}

interface RawSaasStats {
	total: number;
	active: number;
	suspended: number;
	cancelled: number;
	provisioned_today: number;
	top_plans: Array< { plan: string; count: number } >;
}

export interface PaginatedSaasAccountsResponse {
	data: SaasAccountRecord[];
	total: number;
	totalPages: number;
}

/** snake_case REST row -> camelCase UI record. */
function mapAccount( raw: RawSaasAccount ): SaasAccountRecord {
	return {
		id: raw.id,
		orderId: raw.order_id,
		orderNumber: raw.order_number,
		userId: raw.user_id,
		customerName: raw.customer_name,
		customerEmail: raw.customer_email,
		productId: raw.product_id,
		productName: raw.product_name,
		plan: raw.plan,
		apiKeyMasked: raw.api_key_masked,
		status: raw.status,
		provisionedAt: raw.provisioned_at,
	};
}

/**
 * GET /purecart/v1/saas-accounts — one filtered page of accounts.
 *
 * Unlike the Licenses/Downloads list endpoints (which bundle their totals
 * and KPI stats into the JSON body), this one returns a bare array and puts
 * pagination in the X-WP-Total/X-WP-TotalPages headers, so it goes through
 * purecartFetchWithMeta. KPI stats come from fetchSaasStats() separately.
 *
 * @since 1.0.0
 * @param {SaasAccountQueryParams} params Page/search/status/plan/product filters.
 * @return {Promise<PaginatedSaasAccountsResponse>} The account page + totals.
 */
export async function fetchSaasAccounts(
	params: SaasAccountQueryParams = {}
): Promise< PaginatedSaasAccountsResponse > {
	const { data, total, totalPages } = await purecartFetchWithMeta< RawSaasAccount[] >( '/saas-accounts', {
		page: params.page,
		per_page: params.perPage,
		search: params.search,
		status: params.status,
		plan: params.plan,
		product_id: params.productId,
	} );

	return { data: data.map( mapAccount ), total, totalPages };
}

/**
 * GET /purecart/v1/saas-accounts/stats — KPI counters over every account,
 * not just the current page's rows.
 *
 * @since 1.0.0
 */
export async function fetchSaasStats(): Promise< SaasStats > {
	const raw = await purecartFetch< RawSaasStats >( '/saas-accounts/stats' );

	return {
		total: raw.total,
		active: raw.active,
		suspended: raw.suspended,
		cancelled: raw.cancelled,
		provisionedToday: raw.provisioned_today,
		topPlans: ( raw.top_plans ?? [] ).map( ( row ) => ( { plan: row.plan, count: row.count } ) ),
	};
}

/**
 * POST /purecart/v1/saas-accounts/{id}/suspend — also fires the merchant's
 * `suspend` webhook backend-side.
 *
 * @since 1.0.0
 */
export async function suspendSaasAccount( id: number ): Promise< SaasAccountRecord > {
	return mapAccount( await purecartFetch< RawSaasAccount >( `/saas-accounts/${ id }/suspend`, { method: 'POST' } ) );
}

/**
 * POST /purecart/v1/saas-accounts/{id}/activate
 *
 * @since 1.0.0
 */
export async function activateSaasAccount( id: number ): Promise< SaasAccountRecord > {
	return mapAccount( await purecartFetch< RawSaasAccount >( `/saas-accounts/${ id }/activate`, { method: 'POST' } ) );
}

/**
 * POST /purecart/v1/saas-accounts/{id}/rotate-key
 *
 * Resolves with the account carrying its *masked* new key: the backend
 * deliberately never returns a full API key to the admin UI (see
 * SaaS::prepare_account()'s comment — the full key is shown once, in the
 * customer's provisioning email). Callers must not promise the admin a
 * copyable key here.
 *
 * @since 1.0.0
 */
export async function rotateSaasApiKey( id: number ): Promise< SaasAccountRecord > {
	return mapAccount(
		await purecartFetch< RawSaasAccount >( `/saas-accounts/${ id }/rotate-key`, { method: 'POST' } )
	);
}

export interface SaasSettings {
	webhookUrl: string;
	/** Auto-generated on first send; read-only here — no regenerate endpoint exists yet. */
	webhookSecret: string;
	jwtExpirySeconds: number;
	jwtRefreshSeconds: number;
}

interface RawSaasSettings {
	webhook_url: string;
	webhook_secret: string;
	jwt_expiry_seconds: number;
	jwt_refresh_seconds: number;
}

/**
 * GET /purecart/v1/saas-accounts/settings
 *
 * @since 1.0.0
 */
export async function fetchSaasSettings(): Promise<SaasSettings> {
	const raw = await purecartFetch<RawSaasSettings>('/saas-accounts/settings');
	return {
		webhookUrl: raw.webhook_url,
		webhookSecret: raw.webhook_secret,
		jwtExpirySeconds: raw.jwt_expiry_seconds,
		jwtRefreshSeconds: raw.jwt_refresh_seconds,
	};
}

/**
 * POST /purecart/v1/saas-accounts/settings — webhook_secret is intentionally
 * not accepted here (see includes/API/SaaS.php::save_settings()'s own
 * docblock: rotating it isn't a side effect of saving this form).
 *
 * @since 1.0.0
 */
export async function saveSaasSettings(
	settings: Pick<SaasSettings, 'webhookUrl' | 'jwtExpirySeconds' | 'jwtRefreshSeconds'>
): Promise<void> {
	await purecartFetch('/saas-accounts/settings', {
		method: 'POST',
		data: {
			webhook_url: settings.webhookUrl,
			jwt_expiry_seconds: settings.jwtExpirySeconds,
			jwt_refresh_seconds: settings.jwtRefreshSeconds,
		},
	});
}
