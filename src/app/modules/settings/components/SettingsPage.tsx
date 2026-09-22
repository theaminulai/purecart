/**
 * SettingsPage - top-level Settings container.
 *
 * Left-rail tab nav + content panel, matching docs/app's SettingsPage
 * layout and tab order. The active tab is driven by the `:tab` route
 * param (e.g. `#/settings/subscriptions`) rather than local state, so a
 * tab is a real, bookmarkable/deep-linkable URL instead of only reachable
 * by clicking through from a bare `/settings`. Affiliates, Abandoned Cart,
 * Security, Emails and Advanced aren't included yet - those modules don't
 * have settings content defined for them here, and stub tabs with nothing
 * behind them would be inventing UI nobody asked for.
 *
 * @file
 * @since 1.0.0
 */
import { useNavigate, useParams } from 'react-router-dom';
import { M3 } from '@/theme';
import { settingsTabPath } from '@/app/router';
import { SettingsModules } from './SettingsModules';
import { SettingsLicensing } from './SettingsLicensing';
import { SettingsDownloads } from './SettingsDownloads';
import { SettingsUpdates } from './SettingsUpdates';
import { SettingsSubscriptions } from './SettingsSubscriptions';
import { SettingsSaas } from './SettingsSaas';

export const SETTINGS_TABS = [
	'Modules',
	'Licensing',
	'Downloads',
	'Updates',
	'Subscriptions',
	'SaaS',
] as const;
type SettingsTab = ( typeof SETTINGS_TABS )[ number ];

const DEFAULT_TAB: SettingsTab = 'Modules';

/** Case-insensitive lookup from a URL slug (e.g. 'subscriptions') to its canonical tab label ('Subscriptions'). */
const TAB_BY_SLUG: Record< string, SettingsTab > = Object.fromEntries(
	SETTINGS_TABS.map( ( tab ) => [ tab.toLowerCase(), tab ] )
);

/**
 * Renders the Settings page.
 *
 * @since 1.0.0
 *
 * @return {JSX.Element} The settings page.
 */
export function SettingsPage() {
	const navigate = useNavigate();
	const { tab } = useParams< { tab?: string } >();
	const activeTab =
		( tab && TAB_BY_SLUG[ tab.toLowerCase() ] ) || DEFAULT_TAB;

	return (
		<div className="flex" style={ { minHeight: 600 } }>
			<div
				className="flex flex-col flex-shrink-0"
				style={ {
					width: 200,
					borderRight: `1px solid ${ M3.outlineVariant }`,
				} }
			>
				{ SETTINGS_TABS.map( ( t ) => {
					const isActive = activeTab === t;
					return (
						<button
							key={ t }
							onClick={ () => navigate( settingsTabPath( t ) ) }
							className="text-left px-4 py-3 text-sm transition-all"
							style={ {
								backgroundColor: isActive
									? M3.primaryContainer
									: 'transparent',
								color: isActive
									? M3.onPrimaryContainer
									: M3.onSurfaceVariant,
								border: 'none',
								borderRight: isActive
									? `3px solid ${ M3.primary }`
									: '3px solid transparent',
								cursor: 'pointer',
								fontFamily: 'Roboto, sans-serif',
								fontWeight: isActive ? 500 : 400,
							} }
						>
							{ t }
						</button>
					);
				} ) }
			</div>

			<div className="flex-1 pl-6">
				{ activeTab === 'Modules' && <SettingsModules /> }
				{ activeTab === 'Licensing' && <SettingsLicensing /> }
				{ activeTab === 'Downloads' && <SettingsDownloads /> }
				{ activeTab === 'Updates' && <SettingsUpdates /> }
				{ activeTab === 'Subscriptions' && <SettingsSubscriptions /> }
				{ activeTab === 'SaaS' && <SettingsSaas /> }
			</div>
		</div>
	);
}
