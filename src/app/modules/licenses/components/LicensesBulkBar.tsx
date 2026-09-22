/**
 * LicensesBulkBar component.
 *
 * Shown when >= 1 row is selected on the Licenses list page — a single
 * "Revoke N Selected" action, per docs/RND-frontend-license-manager.md's
 * bulk action bar spec (the only bulk action the backend supports today;
 * see includes/API/Licenses.php's bulk-revoke route).
 *
 * @file
 * @since 1.0.0
 */
import { Trash2 } from 'lucide-react';
import { __, sprintf, _n } from '@wordpress/i18n';
import { M3 } from '@/theme';
import { FilledButton } from '@/shared/ui/FilledButton';
import { TextButton } from '@/shared/ui/TextButton';

interface LicensesBulkBarProps {
	selectedCount: number;
	onClear: () => void;
	onRevokeSelected: () => void;
}

/**
 * Renders the sticky bulk-action bar for the Licenses table's selection.
 *
 * @since 1.0.0
 */
export function LicensesBulkBar( { selectedCount, onClear, onRevokeSelected }: LicensesBulkBarProps ) {
	if ( selectedCount === 0 ) return null;

	return (
		<div
			className="flex items-center justify-between px-4 py-3 rounded-xl"
			style={ { backgroundColor: M3.surfaceContainerHigh, border: `1px solid ${ M3.outlineVariant }` } }
		>
			<span style={ { fontSize: '13px', color: M3.onSurface, fontFamily: 'Roboto, sans-serif' } }>
				{ sprintf(
					/* translators: %d: number of selected licenses */
					_n( '%d license selected', '%d licenses selected', selectedCount, 'purecart' ),
					selectedCount
				) }
			</span>
			<div className="flex items-center gap-2">
				<TextButton small onClick={ onClear }>{ __( 'Clear', 'purecart' ) }</TextButton>
				<FilledButton danger small onClick={ onRevokeSelected }>
					<Trash2 size={ 14 } />
					{
						/* translators: %d: number of selected licenses */
						sprintf( __( 'Revoke %d Selected', 'purecart' ), selectedCount )
					}
				</FilledButton>
			</div>
		</div>
	);
}
