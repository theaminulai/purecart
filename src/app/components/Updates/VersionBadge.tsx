import React from 'react';
import type { UpdateChannel } from '../../types/updates';
import { M3 } from '../../utils/static-data';

interface VersionBadgeProps {
	version: string;
	channel?: UpdateChannel;
	size?: 'small' | 'medium';
}

const CHANNEL_STYLES: Record<UpdateChannel, { bg: string; text: string }> = {
	stable: { bg: M3.successContainer, text: M3.success },
	beta: { bg: M3.warningContainer, text: M3.warning },
	nightly: { bg: M3.surfaceContainerHigh, text: M3.onSurfaceVariant },
};

export function VersionBadge( { version, channel = 'stable', size = 'medium' }: VersionBadgeProps ) {
	const style = CHANNEL_STYLES[ channel ] || CHANNEL_STYLES.stable;
	const isSmall = size === 'small';

	return (
		<span
			style={ {
				display: 'inline-flex',
				alignItems: 'center',
				fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
				fontSize: isSmall ? '11px' : '12px',
				fontWeight: 600,
				padding: isSmall ? '1px 6px' : '2px 8px',
				borderRadius: '6px',
				backgroundColor: style.bg,
				color: style.text,
				letterSpacing: '0.02em',
			} }
		>
			{ version.startsWith( 'v' ) ? version : `v${ version }` }
		</span>
	);
}
