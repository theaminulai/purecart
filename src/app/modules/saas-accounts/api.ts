/**
 * SaaS Accounts Module API Client.
 *
 * Typed wrappers for includes/API/SaaS.php's settings routes
 * (GET/POST /purecart/v1/saas-accounts/settings).
 *
 * @file
 * @since 1.0.0
 */

import { purecartFetch } from '@/shared/api';

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
