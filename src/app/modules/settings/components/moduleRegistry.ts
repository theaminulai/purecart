/**
 * Plugin module registry for the Settings → Modules tab.
 *
 * Mirrors the feature set already listed in nav-schema.ts. Enable state
 * here is local UI-only state — toggling a module here doesn't persist or
 * filter the sidebar for any of them, including Subscriptions.
 *
 * Of these 9 entries, exactly one (Subscriptions, `OptionKeys::SUB_ENABLED`)
 * has a real backend enable/disable flag today — `Subscriptions\Module`
 * checks it before bootstrapping. It isn't wired to this toggle yet: that
 * flag would need to live behind a route that stays registered even when
 * the module is disabled (the Subscriptions REST controller itself only
 * registers when `is_enabled()` is true, so a settings route inside it
 * would vanish the moment someone disables the module from here — locking
 * re-enabling behind a direct DB edit). That's a routing-architecture
 * decision, not a wiring fix, so it's left undone rather than guessed at.
 *
 * Licensing, Updates, SaaS Provisioning, and Downloads have no enable/
 * disable flag anywhere in the backend — Plugin::init() bootstraps them
 * unconditionally. Affiliate Program, Abandoned Cart, and Security Suite
 * have no backend module at all (their pages are frontend-only stubs, see
 * AppRoutes.tsx's "Module stubs" imports); Analytics is a frontend
 * aggregation view, not a bootstrapped module. Every toggle below is
 * decorative until that changes.
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
