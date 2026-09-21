/**
 * DownloadStatusBadge component.
 *
 * Displays a download log entry's status as a colored pill, per
 * docs/RND-frontend-secure-downloads.md's DownloadStatusBadge spec.
 *
 * @file
 * @since 1.0.0
 */
import { CheckCircle2, Clock, Ban, ShieldOff } from 'lucide-react';
import { downloadStatusLabel, downloadStatusBadgeStyle } from '../../constants';
import type { DownloadLogStatus } from '../../types';

const STATUS_ICONS: Record<DownloadLogStatus, React.ElementType> = {
	success: CheckCircle2,
	rejected_expired: Clock,
	rejected_exhausted: Ban,
	rejected_revoked: ShieldOff,
};

/**
 * Renders a pill summarizing a download log entry's status.
 *
 * @since 1.0.0
 */
export function DownloadStatusBadge( { status }: { status: DownloadLogStatus } ) {
	const { bg, color } = downloadStatusBadgeStyle( status );
	const Icon = STATUS_ICONS[ status ] ?? CheckCircle2;

	return (
		<span
			className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
			style={ { backgroundColor: bg, color, fontFamily: 'Roboto, sans-serif' } }
		>
			<Icon size={ 12 } />
			{ downloadStatusLabel( status ) }
		</span>
	);
}
