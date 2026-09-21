/**
 * Analytics & Revenue Goals REST API Module.
 *
 * @file
 * @since 1.0.0
 */

import { purecartFetch } from '@/shared/api';
import type { RevenueGoal, ChurnRiskEntry } from '@/modules/subscriptions';

/**
 * GET /purecart/v1/subscriptions/revenue-goals - admin-configured revenue goals.
 *
 * @since 1.0.0
 * @return {Promise<RevenueGoal[]>} All revenue goals.
 */
export async function fetchRevenueGoals(): Promise<RevenueGoal[]> {
	return purecartFetch<RevenueGoal[]>('/subscriptions/revenue-goals');
}

/**
 * Analytics churn-risk table data.
 *
 * @since 1.0.0
 * @return {Promise<ChurnRiskEntry[]>} At-risk subscription entries.
 */
export async function fetchChurnRisk(): Promise<ChurnRiskEntry[]> {
	return purecartFetch<ChurnRiskEntry[]>('/subscriptions/report/churn-risk');
}

/** One month's point in the revenue trend backing the MRR/ARR chart. */
export interface RevenueMonthPoint {
	month: string;
	total: number;
	periods: number;
}

/** One dunning-retry attempt stage in the recovery funnel. */
export interface DunningFunnelStage {
	attempt: number;
	failed: number;
	recovered: number;
}

/** Cancellation count for one reason slug (see subscriptions module's cancellation reasons). */
export interface ChurnReasonCount {
	reason: string;
	count: number;
}

/** Shape of GET /reports/subscriptions/summary — only the fields this SPA currently reads. */
export interface SubscriptionReportSummary {
	mrr: number;
	arr: number;
	revenue_churn_rate: number;
	revenue_by_month: RevenueMonthPoint[];
	dunning_funnel: DunningFunnelStage[];
	churn_by_reason: ChurnReasonCount[];
}

/**
 * GET /purecart/v1/reports/subscriptions/summary - the full dashboard summary
 * (MRR/ARR, churn rates, revenue trend, dunning funnel, churn by reason).
 *
 * @since 1.0.0
 * @return {Promise<SubscriptionReportSummary>} The report summary.
 */
export async function fetchSubscriptionReportSummary(): Promise<SubscriptionReportSummary> {
	return purecartFetch<SubscriptionReportSummary>('/reports/subscriptions/summary');
}
