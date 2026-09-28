/**
 * Subscriptions REST API Module.
 *
 * Handles subscription queries, lifecycle transitions, retention flows,
 * logs, payment ledgers, discounts, and CSV reporting.
 *
 * @file
 * @since 1.0.0
 */

import { purecartFetch, purecartFetchRaw, purecartFetchWithMeta } from '@/shared/api';
import type {
	SubscriptionRecord,
	SubscriptionStatus,
	SubscriptionLogEntry,
	SubscriptionEmailLogEntry,
	PaymentRecord,
} from './types';
import {
	mapBackendSubscriptionToRecord,
	mapRecordToBackendPatch,
	mapBackendLogToEntry,
	mapBackendPaymentToRecord,
} from './utils';

/**
 * GET /purecart/v1/subscriptions - list all subscriptions.
 *
 * @since 1.0.0
 * @return {Promise<SubscriptionRecord[]>} All subscription records.
 */
export async function fetchSubscriptions(): Promise<SubscriptionRecord[]> {
	const res = await purecartFetch<any[]>('/subscriptions');
	return Array.isArray(res) ? res.map(mapBackendSubscriptionToRecord) : [];
}

/**
 * GET /purecart/v1/subscriptions - how many subscriptions are in one status.
 *
 * Requests a single row and reads WordPress's X-WP-Total header instead of
 * counting a fetched page: callers that only need the number (the top bar's
 * notification feed) would otherwise pull the whole list to count it, and
 * the endpoint caps per_page at 100 anyway.
 *
 * @since 1.1.0
 * @param {SubscriptionStatus} status Status to count.
 * @return {Promise<number>} Number of subscriptions in that status.
 */
export async function fetchSubscriptionCount(status: SubscriptionStatus): Promise<number> {
	const { total } = await purecartFetchWithMeta<unknown[]>('/subscriptions', { status, per_page: 1 });
	return total;
}

/**
 * GET /purecart/v1/subscriptions/{id} - a single subscription.
 *
 * @since 1.0.0
 * @param {string} id Subscription ID, e.g. 'SUB-001'.
 * @return {Promise<SubscriptionRecord|undefined>} The matching record, or undefined if not found.
 */
export async function fetchSubscription(id: string): Promise<SubscriptionRecord | undefined> {
	const numericId = parseInt(id.replace(/\D/g, ''), 10) || id;
	const res = await purecartFetch<any>(`/subscriptions/${numericId}`);
	return res ? mapBackendSubscriptionToRecord(res) : undefined;
}

/**
 * POST /purecart/v1/subscriptions/{id}/early-renewal - early renewal triggered by customer or admin.
 */
export async function earlyRenewSubscription(id: string): Promise<SubscriptionRecord> {
	const numericId = parseInt(id.replace(/\D/g, ''), 10) || id;
	const res = await purecartFetch<any>(`/subscriptions/${numericId}/early-renewal`, {
		method: 'POST',
	});
	return mapBackendSubscriptionToRecord(res);
}

/**
 * POST /purecart/v1/subscriptions/{id}/renew - manual renewal triggered by admin.
 */
export async function renewSubscription(id: string): Promise<SubscriptionRecord> {
	const numericId = parseInt(id.replace(/\D/g, ''), 10) || id;
	const res = await purecartFetch<any>(`/subscriptions/${numericId}/renew`, {
		method: 'POST',
	});
	return mapBackendSubscriptionToRecord(res);
}

/**
 * POST /purecart/v1/subscriptions/{id}/pause - pause an active subscription.
 */
export async function pauseSubscription(id: string, resumeAt?: string | null): Promise<SubscriptionRecord> {
	const numericId = parseInt(id.replace(/\D/g, ''), 10) || id;
	const res = await purecartFetch<any>(`/subscriptions/${numericId}/pause`, {
		method: 'POST',
		data: { resume_at: resumeAt },
	});
	return mapBackendSubscriptionToRecord(res);
}

/**
 * POST /purecart/v1/subscriptions/{id}/resume - resume a paused subscription.
 */
export async function resumeSubscription(id: string): Promise<SubscriptionRecord> {
	const numericId = parseInt(id.replace(/\D/g, ''), 10) || id;
	const res = await purecartFetch<any>(`/subscriptions/${numericId}/resume`, {
		method: 'POST',
	});
	return mapBackendSubscriptionToRecord(res);
}

/**
 * POST /purecart/v1/subscriptions/{id}/cancel - cancel a subscription.
 */
export async function cancelSubscription(id: string, immediately: boolean = true, reason?: string | null): Promise<SubscriptionRecord> {
	const numericId = parseInt(id.replace(/\D/g, ''), 10) || id;
	const res = await purecartFetch<any>(`/subscriptions/${numericId}/cancel`, {
		method: 'POST',
		data: { immediately, reason },
	});
	return mapBackendSubscriptionToRecord(res);
}

/**
 * GET /purecart/v1/subscriptions/{id}/cancellation/reasons
 */
export async function fetchCancellationReasons(id?: string): Promise<Record<string, string>> {
	const numericId = id ? parseInt(id.replace(/\D/g, ''), 10) || 1 : 1;
	return purecartFetch<Record<string, string>>(`/subscriptions/${numericId}/cancellation/reasons`);
}

/**
 * GET /purecart/v1/subscriptions/{id}/cancellation/offers?reason=...
 */
export async function fetchCancellationOffers(id: string, reason: string): Promise<any[]> {
	const numericId = parseInt(id.replace(/\D/g, ''), 10) || id;
	return purecartFetch<any[]>(`/subscriptions/${numericId}/cancellation/offers?reason=${encodeURIComponent(reason)}`);
}

/**
 * POST /purecart/v1/subscriptions/{id}/cancellation/accept-offer
 */
export async function acceptCancellationOffer(id: string, offerType: string, reason: string): Promise<SubscriptionRecord> {
	const numericId = parseInt(id.replace(/\D/g, ''), 10) || id;
	const res = await purecartFetch<any>(`/subscriptions/${numericId}/cancellation/accept-offer`, {
		method: 'POST',
		data: { offer_type: offerType, reason },
	});
	return mapBackendSubscriptionToRecord(res);
}

/**
 * POST /purecart/v1/subscriptions/{id}/skip - skip next renewal cycle.
 */
export async function skipSubscription(id: string): Promise<SubscriptionRecord> {
	const numericId = parseInt(id.replace(/\D/g, ''), 10) || id;
	const res = await purecartFetch<any>(`/subscriptions/${numericId}/skip`, {
		method: 'POST',
	});
	return mapBackendSubscriptionToRecord(res);
}

/**
 * POST /purecart/v1/subscriptions/{id}/retry-payment - retry failed charge.
 */
export async function retryPaymentSubscription(id: string): Promise<SubscriptionRecord> {
	const numericId = parseInt(id.replace(/\D/g, ''), 10) || id;
	const res = await purecartFetch<any>(`/subscriptions/${numericId}/retry-payment`, {
		method: 'POST',
	});
	return mapBackendSubscriptionToRecord(res);
}

/**
 * POST /purecart/v1/subscriptions/{id}/upgrade - switch product plan/tier with proration.
 */
export async function upgradeSubscription(
	id: string,
	params: {
		productId?: number;
		cycle?: string;
		planLabel?: string;
		amount?: number;
		mode?: 'prorate_immediately' | 'apply_at_renewal' | 'no_proration';
	}
): Promise<SubscriptionRecord> {
	const { productId, cycle, planLabel, amount, mode = 'apply_at_renewal' } = params;
	const numericId = parseInt(id.replace(/\D/g, ''), 10) || id;
	const res = await purecartFetch<any>(`/subscriptions/${numericId}/upgrade`, {
		method: 'POST',
		data: {
			product_id: productId,
			cycle,
			plan_label: planLabel,
			amount,
			mode,
		},
	});
	return mapBackendSubscriptionToRecord(res);
}

/**
 * POST /purecart/v1/subscriptions/{id}/discount - apply manual admin discount.
 */
export async function applySubscriptionDiscount(
	id: string,
	percent: number,
	duration: string,
	cycles?: number
): Promise<SubscriptionRecord> {
	const numericId = parseInt(id.replace(/\D/g, ''), 10) || id;
	const res = await purecartFetch<any>(`/subscriptions/${numericId}/discount`, {
		method: 'POST',
		data: { percent, duration, cycles },
	});
	return mapBackendSubscriptionToRecord(res);
}

/**
 * POST /purecart/v1/subscriptions/{id}/send-card-update - generates magic card-update link.
 */
export async function sendCardUpdate(id: string): Promise<{ token: string; url: string }> {
	const numericId = parseInt(id.replace(/\D/g, ''), 10) || id;
	return await purecartFetch<{ token: string; url: string }>(`/subscriptions/${numericId}/send-card-update`, {
		method: 'POST',
	});
}

/**
 * POST /purecart/v1/subscriptions/{id}/resubscribe - reactivates or clones subscription.
 */
export async function resubscribeSubscription(id: string): Promise<SubscriptionRecord> {
	const numericId = parseInt(id.replace(/\D/g, ''), 10) || id;
	const res = await purecartFetch<any>(`/subscriptions/${numericId}/resubscribe`, {
		method: 'POST',
	});
	return mapBackendSubscriptionToRecord(res);
}

/**
 * GET /purecart/v1/subscriptions/export - trigger browser download of CSV report.
 */
export async function exportSubscriptionsCsv(status?: string): Promise<void> {
	const params = status && status !== 'all' ? `?status=${encodeURIComponent(status)}` : '';
	const res = await purecartFetchRaw(`/subscriptions/export${params}`, { method: 'GET' });

	const blob = await res.blob();
	const url = URL.createObjectURL(blob);
	const link = document.createElement('a');
	link.href = url;
	link.setAttribute('download', `purecart-subscriptions-${new Date().toISOString().slice(0, 10)}.csv`);
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	URL.revokeObjectURL(url);
}

/**
 * DELETE /purecart/v1/subscriptions/{id} - permanently delete subscription record.
 */
export async function deleteSubscription(id: string): Promise<{ deleted: boolean; id: string }> {
	const numericId = parseInt(id.replace(/\D/g, ''), 10) || id;
	return await purecartFetch<{ deleted: boolean; id: string }>(`/subscriptions/${numericId}`, {
		method: 'DELETE',
	});
}

/**
 * Generic patch used by row-action mutations. Routes to dedicated action endpoints when live.
 *
 * @since 1.0.0
 * @param {string}                        id    Subscription ID to update.
 * @param {Partial<SubscriptionRecord>}   patch Fields to merge into the record.
 * @return {Promise<SubscriptionRecord>} The updated record.
 */
export async function updateSubscription(
	id: string,
	patch: Partial<SubscriptionRecord>
): Promise<SubscriptionRecord> {
	if (patch.status === 'paused') {
		return pauseSubscription(id, patch.pauseEndDate);
	}
	if (patch.status === 'active') {
		return resumeSubscription(id);
	}
	if (patch.status === 'cancelled' || patch.status === 'pending_cancel') {
		return cancelSubscription(id, patch.status === 'cancelled');
	}
	if (patch.skipCount !== undefined) {
		return skipSubscription(id);
	}

	const numericId = parseInt(id.replace(/\D/g, ''), 10) || id;
	const backendPayload = mapRecordToBackendPatch(patch);
	const res = await purecartFetch<any>(`/subscriptions/${numericId}`, {
		method: 'PATCH',
		data: backendPayload,
	});
	return mapBackendSubscriptionToRecord(res);
}

/**
 * GET /purecart/v1/subscriptions/{id}/logs - the status-history event log.
 *
 * @since 1.0.0
 * @param {string} id Subscription ID.
 * @return {Promise<SubscriptionLogEntry[]>} That subscription's log entries.
 */
export async function fetchSubscriptionLogs(id: string): Promise<SubscriptionLogEntry[]> {
	const numericId = parseInt(id.replace(/\D/g, ''), 10) || id;
	const res = await purecartFetch<any[]>(`/subscriptions/${numericId}/logs`);
	return Array.isArray(res) ? res.map(mapBackendLogToEntry) : [];
}

/**
 * Emails-sent history for one subscription.
 *
 * @since 1.0.0
 * @param {string} id Subscription ID.
 * @return {Promise<SubscriptionEmailLogEntry[]>} That subscription's sent-email log.
 */
export async function fetchSubscriptionEmails(id: string): Promise<SubscriptionEmailLogEntry[]> {
	const numericId = parseInt(id.replace(/\D/g, ''), 10) || id;
	return purecartFetch<SubscriptionEmailLogEntry[]>(`/subscriptions/${numericId}/emails`);
}

/**
 * Per-charge payment ledger for one subscription.
 *
 * @since 1.0.0
 * @param {string} id Subscription ID.
 * @return {Promise<PaymentRecord[]>} That subscription's payment records.
 */
export async function fetchPaymentHistory(id: string): Promise<PaymentRecord[]> {
	const numericId = parseInt(id.replace(/\D/g, ''), 10) || id;
	const res = await purecartFetch<any[]>(`/subscriptions/${numericId}/payments`);
	return Array.isArray(res) ? res.map(mapBackendPaymentToRecord) : [];
}
