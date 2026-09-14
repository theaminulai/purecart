import React from 'react';
import { Globe, Monitor, Terminal } from 'lucide-react';
import type { Platform } from '../../types/updates';
import { M3 } from '../../utils/static-data';

interface PlatformChipProps {
	platform: Platform | string;
}

const PLATFORM_MAP: Record<string, { label: string; icon: React.ReactNode }> = {
	universal: { label: 'Universal', icon: <Globe size={ 13 } /> },
	all: { label: 'Universal', icon: <Globe size={ 13 } /> },
	'darwin-arm64': { label: 'macOS (ARM)', icon: <Monitor size={ 13 } /> },
	'darwin-x64': { label: 'macOS (Intel)', icon: <Monitor size={ 13 } /> },
	'win-x64': { label: 'Win x64', icon: <Monitor size={ 13 } /> },
	'win-arm64': { label: 'Win ARM', icon: <Monitor size={ 13 } /> },
	'linux-x86_64': { label: 'Linux x64', icon: <Terminal size={ 13 } /> },
	'linux-arm64': { label: 'Linux ARM', icon: <Terminal size={ 13 } /> },
};

export function PlatformChip( { platform }: PlatformChipProps ) {
	const config = PLATFORM_MAP[ platform ] || {
		label: platform,
		icon: <Globe size={ 13 } />,
	};

	return (
		<span
			style={ {
				display: 'inline-flex',
				alignItems: 'center',
				gap: '4px',
				fontSize: '11px',
				fontWeight: 500,
				padding: '2px 7px',
				borderRadius: '12px',
				backgroundColor: M3.surfaceContainerHigh,
				color: M3.onSurfaceVariant,
				border: `1px solid ${ M3.outlineVariant }`,
			} }
		>
			{ config.icon }
			<span>{ config.label }</span>
		</span>
	);
}
