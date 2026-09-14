/**
 * SettingsPage - top-level Settings container.
 *
 * This repo has no other modules yet (Licensing, SaaS, etc.), so a
 * multi-tab shell with stub tabs for modules that don't exist would be
 * inventing UI nobody asked for. Ships with exactly one real tab.
 *
 * @file
 * @since 1.0.0
 */
import { useState } from 'react';
import { M3 } from '../../utils/static-data';
import { SettingsSubscriptions } from './SettingsSubscriptions';
import { SettingsUpdates } from './SettingsUpdates';

export const SETTINGS_TABS = [ 'Subscriptions', 'Updates' ] as const;
type SettingsTab = typeof SETTINGS_TABS[ number ];

/**
 * Renders the Settings page.
 *
 * @since 1.0.0
 *
 * @return {JSX.Element} The settings page.
 */
export function SettingsPage() {
	const [ activeTab, setActiveTab ] = useState<SettingsTab>( 'Subscriptions' );

	return (
		<div className="flex flex-col gap-4">
			<div className="flex items-center gap-1" style={ { borderBottom: `1px solid ${ M3.outlineVariant }` } }>
				{ SETTINGS_TABS.map( ( tab ) => {
					const isActive = activeTab === tab;
					return (
						<button
							key={ tab }
							onClick={ () => setActiveTab( tab ) }
							className="px-4 py-2.5 text-sm font-medium"
							style={ {
								color: isActive ? M3.primary : M3.onSurfaceVariant,
								fontFamily: 'Roboto, sans-serif',
								borderBottom: isActive ? `2px solid ${ M3.primary }` : '2px solid transparent',
								marginBottom: -1,
								background: 'none',
								borderLeft: 'none',
								borderRight: 'none',
								borderTop: 'none',
								cursor: 'pointer',
							} }
						>
							{ tab }
						</button>
					);
				} ) }
			</div>
			{ activeTab === 'Subscriptions' && <SettingsSubscriptions /> }
			{ activeTab === 'Updates' && <SettingsUpdates /> }
		</div>
	);
}

