/**
 * Plugin module registry for the Settings → Modules tab.
 *
 * Mirrors the feature set already listed in nav-schema.ts. Enable state
 * here is local UI-only state, same as every other Settings tab in this
 * module - none of them persist to a real endpoint yet (see
 * SettingsSubscriptions and SettingsUpdates' save handlers), and toggling a
 * module here doesn't yet filter the sidebar.
 *
 * @file
 * @since 1.0.0
 */

export interface PluginModule {
	name: string;
	desc: string;
	phase: string;
	enabled: boolean;
}

export const INITIAL_MODULES: PluginModule[] = [
	{
		name: 'Secure Downloads',
		desc: 'Protect download links with expiring tokens',
		phase: 'Phase 1',
		enabled: true,
	},
	{
		name: 'License Manager',
		desc: 'Issue and validate software licenses',
		phase: 'Phase 1',
		enabled: true,
	},
	{
		name: 'Update Manager',
		desc: 'Serve plugin/theme update packages',
		phase: 'Phase 1',
		enabled: true,
	},
	{
		name: 'Subscriptions',
		desc: 'Recurring billing and subscription management',
		phase: 'Phase 1',
		enabled: true,
	},
	{
		name: 'SaaS Provisioning',
		desc: 'Automated account and seat management',
		phase: 'Phase 2',
		enabled: true,
	},
	{
		name: 'Affiliate Program',
		desc: 'Track referrals and manage commissions',
		phase: 'Phase 2',
		enabled: true,
	},
	{
		name: 'Abandoned Cart',
		desc: 'Recover lost sales with automated emails',
		phase: 'Phase 2',
		enabled: true,
	},
	{
		name: 'Analytics',
		desc: 'Advanced reporting and revenue dashboards',
		phase: 'Phase 1',
		enabled: true,
	},
	{
		name: 'Security Suite',
		desc: 'Fraud detection and IP blocking',
		phase: 'Phase 3',
		enabled: true,
	},
];
