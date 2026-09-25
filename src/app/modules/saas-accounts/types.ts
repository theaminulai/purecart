/**
 * SaaS Accounts module TypeScript data shapes.
 *
 * Mapped from includes/API/SaaS.php::prepare_account()'s snake_case output
 * into camelCase by `mapAccount()` in ./api.ts — unlike the Downloads
 * module (whose backend already emits camelCase), this module's REST
 * contract is snake_case, so the mapping layer is real here and every field
 * below has a named counterpart there.
 *
 * @file
 * @since 1.0.0
 */

export type SaasAccountStatus = 'active' | 'suspended' | 'cancelled';

export interface SaasAccountRecord {
	id: number;
	orderId: number;
	orderNumber: string;
	userId: number;
	customerName: string;
	customerEmail: string;
	productId: number;
	productName: string;
	plan: string;
	/** Masked by the backend to the last 8 characters — the full key is never sent to the admin UI. */
	apiKeyMasked: string;
	status: SaasAccountStatus;
	provisionedAt: string;
}

export interface SaasPlanCount {
	plan: string;
	count: number;
}

export interface SaasStats {
	total: number;
	active: number;
	suspended: number;
	cancelled: number;
	provisionedToday: number;
	topPlans: SaasPlanCount[];
}

export interface SaasAccountQueryParams {
	page?: number;
	perPage?: number;
	search?: string;
	status?: SaasAccountStatus | 'All';
	plan?: string | 'All';
	productId?: number | 'All';
}
