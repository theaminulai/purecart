/**
 * FileTypeChip component.
 *
 * Renders a monospace pill with a colored dot for a file extension — e.g.
 * "● ZIP". Per docs/RND-frontend-secure-downloads.md's design system note,
 * this never uses external icon sets or file-type images.
 *
 * @file
 * @since 1.0.0
 */
import { M3 } from '@/theme';
import { fileTypeLabel, fileTypeColor } from '../../constants';

/**
 * Renders a colored-dot + label pill for a file extension.
 *
 * @since 1.0.0
 */
export function FileTypeChip( { extension }: { extension: string } ) {
	return (
		<span
			className="inline-flex items-center gap-1.5 text-xs"
			style={ { fontFamily: 'Roboto Mono, monospace', color: M3.onSurfaceVariant } }
		>
			<span
				style={ {
					width: 6,
					height: 6,
					borderRadius: '50%',
					backgroundColor: fileTypeColor( extension ),
					flexShrink: 0,
				} }
			/>
			{ fileTypeLabel( extension ) }
		</span>
	);
}
