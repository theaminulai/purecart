/**
 * DownloadsBulkBar component.
 *
 * Shown when >= 1 row is selected on the Downloads log page — a single
 * "Revoke N Tokens" action, per docs/RND-frontend-secure-downloads.md's
 * bulk action bar spec (the only bulk action the backend supports today;
 * see includes/API/Downloads.php's bulk-revoke route).
 *
 * @file
 * @since 1.0.0
 */
import { Trash2 } from 'lucide-react';
import { __, sprintf, _n } from '@wordpress/i18n';
import { M3 } from '@/theme';
import { FilledButton } from '@/shared/ui/FilledButton';
import { TextButton } from '@/shared/ui/TextButton';

interface DownloadsBulkBarProps {
	selectedCount: number;
	onClear: () => void;
	onRevokeSelected: () => void;
}

/**
 * Renders the sticky bulk-action bar for the Downloads table's selection.
 *
 * @since 1.0.0
 */
export function DownloadsBulkBar( { selectedCount, onClear, onRevokeSelected }: DownloadsBulkBarProps ) {
	if ( selectedCount === 0 ) return null;

	return (
		<div
			className="flex items-center justify-between px-4 py-3 rounded-xl"
			style={ { backgroundColor: M3.surfaceContainerHigh, border: `1px solid ${ M3.outlineVariant }` } }
		>
			<span style={ { fontSize: '13px', color: M3.onSurface, fontFamily: 'Roboto, sans-serif' } }>
				{ sprintf(
					/* translators: %d: number of selected download tokens */
					_n( '%d token selected', '%d tokens selected', selectedCount, 'purecart' ),
					selectedCount
				) }
			</span>
			<div className="flex items-center gap-2">
				<TextButton small onClick={ onClear }>{ __( 'Clear', 'purecart' ) }</TextButton>
				<FilledButton danger small onClick={ onRevokeSelected }>
					<Trash2 size={ 14 } />
					{
						/* translators: %d: number of selected download tokens */
						sprintf( __( 'Revoke %d Tokens', 'purecart' ), selectedCount )
					}
				</FilledButton>
			</div>
		</div>
	);
}
