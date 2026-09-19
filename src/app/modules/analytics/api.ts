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
