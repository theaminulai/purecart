/**
 * SettingsModules - the "Modules" settings tab.
 *
 * Enable/disable list for the plugin's feature modules, matching docs/app's
 * SettingsPage "Modules" tab layout.
 *
 * @file
 * @since 1.0.0
 */
import { useState } from 'react';
import { M3 } from '@/theme';
import { Card } from '@/shared/ui/Card';
import { Toggle } from '@/shared/ui/Toggle';
import { INITIAL_MODULES } from './moduleRegistry';

/**
 * Renders the Modules settings tab.
 *
 * @since 1.0.0
 *
 * @return {JSX.Element} The Modules settings tab.
 */
export function SettingsModules() {
	const [ modules, setModules ] = useState( INITIAL_MODULES );

	const toggleModule = ( name: string ) => {
		setModules( ( prev ) =>
			prev.map( ( m ) =>
				m.name === name ? { ...m, enabled: ! m.enabled } : m
			)
		);
	};

	return (
		<div className="flex flex-col gap-2">
			<div className="mb-4">
				<h2
					className="font-medium text-lg"
					style={ {
						color: M3.onSurface,
						fontFamily: 'Roboto, sans-serif',
					} }
				>
					Plugin Modules
				</h2>
				<p
					className="text-sm mt-1"
					style={ {
						color: M3.onSurfaceVariant,
						fontFamily: 'Roboto, sans-serif',
					} }
				>
					Enable or disable modules. Enabled modules appear in the
					sidebar and unlock their analytics.
				</p>
			</div>
			{ modules.map( ( mod ) => (
				<Card
					key={ mod.name }
					className="flex items-center gap-4 px-5 py-4"
				>
					<div
						className="w-2.5 h-2.5 rounded-full flex-shrink-0"
						style={ {
							backgroundColor: mod.enabled
								? M3.success
								: M3.outlineVariant,
						} }
					/>
					<div className="flex-1 min-w-0">
						<div
							className="text-sm font-medium"
							style={ {
								color: M3.onSurface,
								fontFamily: 'Roboto, sans-serif',
							} }
						>
							{ mod.name }
						</div>
						<div
							className="text-xs mt-0.5"
							style={ {
								color: M3.onSurfaceVariant,
								fontFamily: 'Roboto, sans-serif',
							} }
						>
							{ mod.desc }
						</div>
					</div>
					<div className="flex items-center gap-3 flex-shrink-0">
						<span
							className="text-xs px-2 py-0.5 rounded-full"
							style={ {
								border: `1px solid ${ M3.outlineVariant }`,
								color: M3.onSurfaceVariant,
								fontFamily: 'Roboto, sans-serif',
							} }
						>
							{ mod.phase }
						</span>
						<span
							className="text-xs px-2 py-0.5 rounded-full"
							style={ {
								backgroundColor: mod.enabled
									? M3.successContainer
									: M3.surfaceContainerHigh,
								color: mod.enabled
									? M3.success
									: M3.onSurfaceVariant,
								fontFamily: 'Roboto, sans-serif',
							} }
						>
							{ mod.enabled ? 'Active' : 'Disabled' }
						</span>
						<Toggle
							checked={ mod.enabled }
							onChange={ () => toggleModule( mod.name ) }
						/>
					</div>
				</Card>
			) ) }
		</div>
	);
}
